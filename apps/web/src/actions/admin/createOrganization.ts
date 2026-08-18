"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationTypeId: z.string().min(1, "Organization type is required"),
  specialties: z.array(z.string()).optional().default([]),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  logo: z.string().optional(),
  motto: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  establishedYear: z.coerce.number().optional().nullable(),
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

export async function createOrganization(formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the user has a verified ADMIN profession
  const adminProfession = await prisma.userProfession.findFirst({
    where: {
      userId: user.id,
      professionType: { code: "ADMIN" },
      status: "VERIFIED",
    },
  });

  if (!adminProfession) {
    throw new Error("You must have a verified Admin role to create an organization.");
  }

  // Check if user is already an admin of an active organization
  const existingAdminOrg = await prisma.organizationAdmin.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
  });

  if (existingAdminOrg) {
    throw new Error("You are already an administrator of an organization.");
  }

  const rawSpecialties = formData.get("specialties") as string | null;
  const specialtiesArray = rawSpecialties
    ? rawSpecialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const rawLat = formData.get("latitude") as string | null;
  const rawLng = formData.get("longitude") as string | null;

  const data = createOrgSchema.parse({
    name: formData.get("name") as string,
    organizationTypeId: formData.get("organizationTypeId") as string,
    specialties: specialtiesArray,
    address: (formData.get("address") as string)?.trim() || null,
    latitude: rawLat && !isNaN(parseFloat(rawLat)) ? parseFloat(rawLat) : null,
    longitude: rawLng && !isNaN(parseFloat(rawLng)) ? parseFloat(rawLng) : null,
    logo: (formData.get("logo") as string) || undefined,
    motto: (formData.get("motto") as string) || undefined,
    vision: (formData.get("vision") as string) || undefined,
    mission: (formData.get("mission") as string) || undefined,
    establishedYear: formData.get("establishedYear") ? Number(formData.get("establishedYear")) : null,
  });

  // Generate unique slug
  let slug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const existingSlug = await prisma.organization.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  // Create organization and assign primary admin in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.name,
        slug,
        organizationTypeId: data.organizationTypeId,
        specialties: data.specialties,
        ownerId: user.id,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        logo: data.logo,
        motto: data.motto,
        vision: data.vision,
        mission: data.mission,
        establishedYear: data.establishedYear,
        verificationStatus: "verified", // Automatically active for initial creation
      },
    });

    const admin = await tx.organizationAdmin.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        isPrimaryAdmin: true,
        permissions: [
          "MANAGE_ORGANIZATION",
          "MANAGE_EMPLOYEES",
          "MANAGE_ROLES",
          "INVITE_ADMIN",
          "DELETE_ORGANIZATION",
        ],
        isActive: true,
      },
    });

    return { org, admin };
  });

  revalidatePath("/dashboard/organization");
  return { success: true, organizationId: result.org.id };
}
