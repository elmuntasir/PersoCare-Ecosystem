"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const qrConfigSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  qrLevels: z.array(z.enum(["organization", "department", "employee"])).default(["organization"]),
  qrUseCases: z.array(z.enum(["booking", "profile"])).default(["booking"]),
});

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;
    return await prisma.user.findUnique({ where: { authId: authUser.id } });
  } catch {
    return null;
  }
}

export async function updateOrganizationQrConfiguration(formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const organizationId = String(formData.get("organizationId") || "");
  const qrLevels = formData
    .getAll("qrLevels")
    .map((value) => String(value))
    .filter((value): value is "organization" | "department" | "employee" =>
      ["organization", "department", "employee"].includes(value)
    );
  const qrUseCases = formData
    .getAll("qrUseCases")
    .map((value) => String(value))
    .filter((value): value is "booking" | "profile" => ["booking", "profile"].includes(value));

  const data = qrConfigSchema.parse({
    organizationId,
    qrLevels: qrLevels.length > 0 ? qrLevels : ["organization"],
    qrUseCases: qrUseCases.length > 0 ? qrUseCases : ["booking"],
  });

  const currentAdmin = await prisma.organizationAdmin.findFirst({
    where: {
      organizationId: data.organizationId,
      userId: user.id,
      isActive: true,
    },
  });

  if (!currentAdmin) {
    throw new Error("You do not have administrative authority for this organization.");
  }

  await prisma.$executeRaw`
    INSERT INTO "AIConfiguration" (
      "organizationId",
      "mode",
      "byokProvider",
      "byokKeyCiphertext",
      "installedAgents",
      "qrLevels",
      "qrUseCases"
    )
    VALUES (
      ${data.organizationId},
      'marketplace',
      NULL,
      NULL,
      ARRAY[]::text[],
      ${JSON.stringify(data.qrLevels)}::jsonb,
      ${JSON.stringify(data.qrUseCases)}::jsonb
    )
    ON CONFLICT ("organizationId")
    DO UPDATE SET
      "qrLevels" = EXCLUDED."qrLevels",
      "qrUseCases" = EXCLUDED."qrUseCases",
      "updatedAt" = NOW()
  `;

  const organization = await prisma.organization.findUnique({
    where: { id: data.organizationId },
    select: { slug: true },
  });

  revalidatePath("/dashboard/organization");
  if (organization?.slug) {
    revalidatePath(`/public-organization/${organization.slug}`);
  }

  return {
    success: true,
    qrLevels: data.qrLevels,
    qrUseCases: data.qrUseCases,
  };
}
