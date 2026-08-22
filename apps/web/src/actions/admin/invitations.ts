"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "crypto";

const createInvitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  organizationId: z.string().min(1, "Organization ID is required"),
});

const respondInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
  accept: z.boolean(),
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

export async function createAdminInvitation(formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const organizationId = formData.get("organizationId") as string;

  const data = createInvitationSchema.parse({
    email,
    organizationId,
  });

  // Verify the current user is an active admin of this organization
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

  // 1. Find the target user by email
  const targetUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, name: true, email: true },
  });

  if (!targetUser) {
    throw new Error("No registered PersoCare user found with this email address.");
  }

  if (targetUser.id === user.id) {
    throw new Error("You cannot invite yourself as a co-admin.");
  }

  // 2. Check if the target user has an Admin profession (if not, we allow invite and they can activate/bypass upon accepting)
  const adminProfession = await prisma.userProfession.findFirst({
    where: {
      userId: targetUser.id,
      professionType: { code: "ADMIN" },
      status: "VERIFIED",
    },
  });

  if (!adminProfession) {
    // Alternatively, auto-qualify or advise them
    // Let's create or verify that they have an ADMIN profession, or inform the inviter
  }

  // 3. Check if target user is already an admin of this organization
  const existingAdmin = await prisma.organizationAdmin.findFirst({
    where: {
      organizationId: data.organizationId,
      userId: targetUser.id,
      isActive: true,
    },
  });

  if (existingAdmin) {
    throw new Error("This user is already an administrator of this organization.");
  }

  // 4. Check if a pending invite already exists
  const existingInvite = await prisma.adminInvitation.findFirst({
    where: {
      organizationId: data.organizationId,
      invitedUserId: targetUser.id,
      status: "PENDING",
    },
  });

  if (existingInvite) {
    throw new Error("An invitation has already been sent to this user.");
  }

  // 5. Create invitation
  const invitation = await prisma.adminInvitation.create({
    data: {
      organizationId: data.organizationId,
      invitedById: user.id,
      invitedUserId: targetUser.id,
      email: targetUser.email,
      token: randomUUID(),
    },
  });

  revalidatePath("/dashboard/organization");
  return { success: true, invitationId: invitation.id };
}

export async function respondToInvitation(formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const invitationId = formData.get("invitationId") as string;
  const accept = formData.get("accept") === "true";

  respondInvitationSchema.parse({ invitationId, accept });

  const invitation = await prisma.adminInvitation.findUnique({
    where: { id: invitationId },
    include: { organization: true },
  });

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  if (invitation.invitedUserId !== user.id) {
    throw new Error("Unauthorized: this invitation was sent to a different account.");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("This invitation has already been processed.");
  }

  if (accept) {
    await prisma.$transaction(async (tx) => {
      // Ensure user has verified ADMIN profession
      let adminType = await tx.professionType.findUnique({
        where: { code: "ADMIN" },
      });
      if (!adminType) {
        adminType = await tx.professionType.create({
          data: {
            code: "ADMIN",
            name: "Admin / Organization Lead",
            requiredDocuments: ["National ID", "Organization Authorization Letter"],
            verifyingBody: "PersoCare Administration",
            isActive: true,
          },
        });
      }

      await tx.userProfession.upsert({
        where: {
          userId_professionTypeId: {
            userId: user.id,
            professionTypeId: adminType.id,
          },
        },
        update: { status: "VERIFIED", verifiedAt: new Date() },
        create: {
          userId: user.id,
          professionTypeId: adminType.id,
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      });

      // Create OrganizationAdmin record
      await tx.organizationAdmin.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: user.id,
          },
        },
        update: { isActive: true },
        create: {
          organizationId: invitation.organizationId,
          userId: user.id,
          isPrimaryAdmin: false,
          permissions: ["MANAGE_EMPLOYEES", "MANAGE_ROLES"],
          isActive: true,
        },
      });

      // Update invitation status
      await tx.adminInvitation.update({
        where: { id: invitationId },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });
    });
  } else {
    await prisma.adminInvitation.update({
      where: { id: invitationId },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
      },
    });
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

export type AdminOrgResponse =
  | {
      type: "admin";
      organization: {
        id: string;
        name: string;
        slug: string;
        specialties: string[];
        address: string | null;
        latitude: number | null;
        longitude: number | null;
        logo: string | null;
        motto: string | null;
        vision: string | null;
        mission: string | null;
        establishedYear: number | null;
        patientServedCount: number | null;
        verificationStatus: string;
        aiConfiguration: {
          mode: string;
          qrLevels: string[];
          qrUseCases: string[];
        } | null;
        organizationType: { id: string; name: string; code: string };
        departments: Array<{
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          head?: { id: string; name: string } | null;
        }>;
        roles: Array<{
          id: string;
          name: string;
          description: string | null;
        }>;
        admins: Array<{
          id: string;
          isPrimaryAdmin: boolean;
          permissions: string[];
          user: { id: string; name: string; email: string };
        }>;
        adminInvitations: Array<{
          id: string;
          email: string | null;
          createdAt: string;
          invitedUser: { name: string; email: string };
        }>;
      };
      adminRecord: {
        id: string;
        isPrimaryAdmin: boolean;
        permissions: string[];
      };
    }
  | {
      type: "invitation";
      invitation: {
        id: string;
        organization: { id: string; name: string; specialties: string[] };
        invitedBy: { name: string; email: string };
      } | null;
    }
  | {
      type: "none";
    };

export async function getOrganizationForAdmin(): Promise<AdminOrgResponse> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Check if user is an active admin of any organization
  const adminRecord = await prisma.organizationAdmin.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      organization: {
        include: {
          organizationType: true,
          departments: {
            include: { head: { select: { id: true, name: true } } },
            orderBy: { name: "asc" },
          },
          orgRoles: {
            orderBy: { name: "asc" },
          },
          aiConfiguration: true,
          admins: {
            where: { isActive: true },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          adminInvitations: {
            where: { status: "PENDING" },
            include: {
              invitedUser: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (adminRecord && adminRecord.organization) {
    const org = adminRecord.organization;
    return {
      type: "admin",
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        specialties: org.specialties,
        address: org.address,
        latitude: org.latitude,
        longitude: org.longitude,
        logo: org.logo,
        motto: org.motto,
        vision: org.vision,
        mission: org.mission,
        establishedYear: org.establishedYear,
        patientServedCount: org.patientServedCount,
        verificationStatus: org.verificationStatus,
        aiConfiguration: org.aiConfiguration
          ? {
              mode: org.aiConfiguration.mode,
              qrLevels: Array.isArray(org.aiConfiguration.qrLevels)
                ? (org.aiConfiguration.qrLevels as string[])
                : [],
              qrUseCases: Array.isArray(org.aiConfiguration.qrUseCases)
                ? (org.aiConfiguration.qrUseCases as string[])
                : [],
            }
          : null,
        organizationType: {
          id: org.organizationType.id,
          name: org.organizationType.name,
          code: org.organizationType.code,
        },
        departments: org.departments.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          icon: d.icon,
          head: d.head,
        })),
        roles: org.orgRoles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
        })),
        admins: org.admins.map((a) => ({
          id: a.id,
          isPrimaryAdmin: a.isPrimaryAdmin,
          permissions: a.permissions,
          user: a.user,
        })),
        adminInvitations: org.adminInvitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          createdAt: inv.createdAt.toISOString(),
          invitedUser: inv.invitedUser,
        })),
      },
      adminRecord: {
        id: adminRecord.id,
        isPrimaryAdmin: adminRecord.isPrimaryAdmin,
        permissions: adminRecord.permissions,
      },
    };
  }

  // 2. Check if user has a pending invitation
  const pendingInvitation = await prisma.adminInvitation.findFirst({
    where: {
      invitedUserId: user.id,
      status: "PENDING",
    },
    include: {
      organization: { select: { id: true, name: true, specialties: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (pendingInvitation) {
    return {
      type: "invitation",
      invitation: {
        id: pendingInvitation.id,
        organization: pendingInvitation.organization,
        invitedBy: pendingInvitation.invitedBy,
      },
    };
  }

  return { type: "none" };
}
