"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateOrgSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationTypeId: z.string().min(1, "Organization type is required"),
  specialties: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  logo: z.string().optional(),
  motto: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  establishedYear: z.coerce.number().optional().nullable(),
});

export async function updateOrganization(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const organizationId = formData.get("organizationId") as string;
  const name = (formData.get("name") as string)?.trim();
  const organizationTypeId = formData.get("organizationTypeId") as string;
  const rawSpecialties = formData.get("specialties") as string | null;
  const address = (formData.get("address") as string)?.trim() || null;
  const rawLat = formData.get("latitude") as string | null;
  const rawLng = formData.get("longitude") as string | null;

  const specialtiesArray = rawSpecialties
    ? rawSpecialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const data = updateOrgSchema.parse({
    organizationId,
    name,
    organizationTypeId,
    specialties: specialtiesArray,
    description: (formData.get("description") as string) || undefined,
    address,
    latitude: rawLat && !isNaN(parseFloat(rawLat)) ? parseFloat(rawLat) : null,
    longitude: rawLng && !isNaN(parseFloat(rawLng)) ? parseFloat(rawLng) : null,
    logo: (formData.get("logo") as string) || undefined,
    motto: (formData.get("motto") as string) || undefined,
    vision: (formData.get("vision") as string) || undefined,
    mission: (formData.get("mission") as string) || undefined,
    establishedYear: formData.get("establishedYear") ? Number(formData.get("establishedYear")) : null,
  });

  // Verify caller is an active admin of this org
  const admin = await prisma.organizationAdmin.findFirst({
    where: {
      userId: user.id,
      organizationId: data.organizationId,
      isActive: true,
    },
  });

  if (!admin) {
    throw new Error("You do not have administrative authority to update this organization");
  }

  await prisma.organization.update({
    where: { id: data.organizationId },
    data: {
      name: data.name,
      organizationTypeId: data.organizationTypeId,
      specialties: data.specialties,
      description: data.description,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      logo: data.logo,
      motto: data.motto,
      vision: data.vision,
      mission: data.mission,
      establishedYear: data.establishedYear,
    },
  });

  revalidatePath(`/dashboard/organization/edit/${data.organizationId}`);
  revalidatePath(`/admin/manage/edit/${data.organizationId}`);
  revalidatePath("/dashboard/organization");
  revalidatePath("/admin/manage");

  return { success: true };
}
