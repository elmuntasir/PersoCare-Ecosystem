"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type PendingApplicationItem = {
  id: string;
  organizationName: string;
  slug: string;
  organizationType: string;
  organizationTypeCode: string;
  specialties: string[];
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  submittedAt: string;
  status: string;
  verificationStatus: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
};

export type PlatformDashboardStats = {
  totalOrganizations: number;
  verifiedOrganizations: number;
  pendingOrganizations: number;
  rejectedOrganizations: number;
  totalDoctors: number;
  totalAppointments: number;
  totalUsers: number;
};

// ─── 1. Get Pending Organization Applications ─────────────────

export async function getPendingApplications(): Promise<PendingApplicationItem[]> {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const organizations = await prisma.organization.findMany({
    where: {
      verificationStatus: "pending",
    },
    include: {
      organizationType: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return organizations.map((org) => ({
    id: org.id,
    organizationName: org.name,
    slug: org.slug,
    organizationType: org.organizationType?.name || "Healthcare Facility",
    organizationTypeCode: org.organizationType?.code || "GENERAL",
    specialties: org.specialties || [],
    address: org.address,
    latitude: org.latitude,
    longitude: org.longitude,
    submittedAt: org.createdAt.toISOString(),
    status: org.status,
    verificationStatus: org.verificationStatus,
    user: {
      id: org.owner.id,
      name: org.owner.name,
      email: org.owner.email,
      phone: org.owner.phone,
    },
  }));
}

// ─── 2. Approve Organization Application ──────────────────────

const approveSchema = z.object({
  applicationId: z.string().min(1, "Organization Application ID is required"),
});

export async function approveApplication(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const { applicationId } = approveSchema.parse({
    applicationId: formData.get("applicationId"),
  });

  const organization = await prisma.organization.findUnique({
    where: { id: applicationId },
    include: { owner: true },
  });

  if (!organization) {
    throw new Error("Organization application not found");
  }

  if (organization.verificationStatus === "verified") {
    throw new Error("Organization is already verified and approved");
  }

  // Update organization verification status to 'verified' and ensure owner has Primary Admin role
  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: applicationId },
      data: {
        verificationStatus: "verified",
        verifiedAt: new Date(),
        status: "ACTIVE",
      },
    });

    // Ensure OrganizationAdmin record exists for applicant owner
    const existingAdmin = await tx.organizationAdmin.findFirst({
      where: {
        organizationId: applicationId,
        userId: organization.ownerId,
      },
    });

    if (!existingAdmin) {
      await tx.organizationAdmin.create({
        data: {
          organizationId: applicationId,
          userId: organization.ownerId,
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
    } else if (!existingAdmin.isActive || !existingAdmin.isPrimaryAdmin) {
      await tx.organizationAdmin.update({
        where: { id: existingAdmin.id },
        data: {
          isActive: true,
          isPrimaryAdmin: true,
        },
      });
    }
  });

  revalidatePath("/platform-admin/applications");
  revalidatePath("/platform-admin/dashboard");
  revalidatePath("/dashboard/organization");
  revalidatePath("/dashboard/appointments");

  return { success: true, organizationId: organization.id };
}

// ─── 3. Reject Organization Application ───────────────────────

const rejectSchema = z.object({
  applicationId: z.string().min(1, "Organization Application ID is required"),
  rejectionReason: z.string().optional().default(""),
});

export async function rejectApplication(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const { applicationId, rejectionReason } = rejectSchema.parse({
    applicationId: formData.get("applicationId"),
    rejectionReason: formData.get("rejectionReason") || "",
  });

  const organization = await prisma.organization.findUnique({
    where: { id: applicationId },
  });

  if (!organization) {
    throw new Error("Organization application not found");
  }

  await prisma.organization.update({
    where: { id: applicationId },
    data: {
      verificationStatus: "rejected",
      status: "SUSPENDED",
    },
  });

  revalidatePath("/platform-admin/applications");
  revalidatePath("/platform-admin/dashboard");
  revalidatePath("/dashboard/organization");

  return { success: true, reason: rejectionReason };
}

// ─── 4. Platform Dashboard Statistics ─────────────────────────

export async function getPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const [
    totalOrganizations,
    verifiedOrganizations,
    pendingOrganizations,
    rejectedOrganizations,
    totalDoctors,
    totalAppointments,
    totalUsers,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { verificationStatus: "verified" } }),
    prisma.organization.count({ where: { verificationStatus: "pending" } }),
    prisma.organization.count({ where: { verificationStatus: "rejected" } }),
    prisma.userProfession.count({
      where: { professionType: { code: "DOCTOR" }, status: "VERIFIED" },
    }),
    prisma.appointment.count(),
    prisma.user.count(),
  ]);

  return {
    totalOrganizations,
    verifiedOrganizations,
    pendingOrganizations,
    rejectedOrganizations,
    totalDoctors,
    totalAppointments,
    totalUsers,
  };
}
