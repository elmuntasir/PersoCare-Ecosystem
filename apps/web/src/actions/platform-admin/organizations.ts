"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getAllOrganizations() {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const orgs = await prisma.organization.findMany({
    include: {
      organizationType: true,
      admins: {
        include: { user: { select: { name: true, email: true } } },
      },
      _count: {
        select: { memberships: true, appointments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orgs;
}

const updateOrgStatusSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
});

export async function updateOrganizationStatus(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const { orgId, status } = updateOrgStatusSchema.parse({
    orgId: formData.get("orgId"),
    status: formData.get("status"),
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { status },
  });

  // Log the action in SystemAuditLog
  await prisma.systemAuditLog.create({
    data: {
      userId: user.id,
      action: "ORG_STATUS_CHANGE",
      details: { orgId, status },
    },
  });

  revalidatePath("/platform-admin/organizations");
  revalidatePath("/platform-admin/dashboard");
  return { success: true };
}
