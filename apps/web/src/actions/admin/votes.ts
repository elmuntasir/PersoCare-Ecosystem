"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createVoteSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  targetAdminId: z.string().min(1, "Target Admin User ID is required"),
  action: z.enum(["ADD_ADMIN", "REMOVE_ADMIN"]),
  reason: z.string().optional(),
});

export async function createAdminVote(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { organizationId, targetAdminId, action, reason } = createVoteSchema.parse({
    organizationId: formData.get("organizationId"),
    targetAdminId: formData.get("targetAdminId"),
    action: formData.get("action"),
    reason: formData.get("reason") || "",
  });

  // Verify user is active admin of this org
  const admin = await prisma.organizationAdmin.findFirst({
    where: {
      userId: user.id,
      organizationId,
      isActive: true,
    },
  });

  if (!admin) throw new Error("Only an active admin can initiate votes");

  // Check if there's already a pending vote for this target in this organization
  const pending = await prisma.adminVote.findFirst({
    where: {
      organizationId,
      targetAdminId,
      status: "PENDING",
    },
  });

  if (pending) throw new Error("A vote for this target is already pending");

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetAdminId },
  });
  if (!targetUser) throw new Error("Target user not found");

  // If removing, verify the admin exists in the organization
  if (action === "REMOVE_ADMIN") {
    const target = await prisma.organizationAdmin.findFirst({
      where: { userId: targetAdminId, organizationId, isActive: true },
    });
    if (!target) throw new Error("Active admin not found to remove");
    if (target.isPrimaryAdmin) throw new Error("Cannot remove primary admin through standard vote");
  }

  // If adding, verify they are not already an admin
  if (action === "ADD_ADMIN") {
    const existing = await prisma.organizationAdmin.findFirst({
      where: { userId: targetAdminId, organizationId, isActive: true },
    });
    if (existing) throw new Error("This user is already an admin of this organization");
  }

  const vote = await prisma.adminVote.create({
    data: {
      organizationId,
      initiatedById: user.id,
      targetAdminId,
      action,
      reason: reason || null,
    },
  });

  revalidatePath(`/dashboard/organization/edit/${organizationId}`);
  revalidatePath(`/admin/manage/edit/${organizationId}`);
  return { success: true, voteId: vote.id };
}

export async function voteOnAdminChange(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { voteId, approved, comment } = z
    .object({
      voteId: z.string().min(1),
      approved: z.boolean(),
      comment: z.string().optional(),
    })
    .parse({
      voteId: formData.get("voteId"),
      approved: formData.get("approved") === "true",
      comment: formData.get("comment") || "",
    });

  // Check if user is an active admin of this org
  const vote = await prisma.adminVote.findUnique({
    where: { id: voteId },
    include: {
      organization: {
        include: {
          admins: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!vote) throw new Error("Vote not found");
  if (vote.status !== "PENDING") throw new Error("Vote is no longer pending");

  const isAdmin = vote.organization.admins.some((a) => a.userId === user.id);
  if (!isAdmin) throw new Error("Only active admins can vote");

  // Check if already voted
  const existingVote = await prisma.adminVoteResponse.findUnique({
    where: {
      voteId_adminId: {
        voteId: vote.id,
        adminId: user.id,
      },
    },
  });

  if (existingVote) throw new Error("You have already voted on this proposal");

  // Record vote & check if decision reached in transaction
  await prisma.$transaction(async (tx) => {
    await tx.adminVoteResponse.create({
      data: {
        voteId: vote.id,
        adminId: user.id,
        approved,
        comment: comment || null,
      },
    });

    const allAdmins = vote.organization.admins;
    const responses = await tx.adminVoteResponse.findMany({
      where: { voteId: vote.id },
    });

    // If all active admins have voted
    if (responses.length >= allAdmins.length) {
      const allApproved = responses.every((r) => r.approved);
      if (allApproved) {
        // Apply the change
        if (vote.action === "ADD_ADMIN") {
          // Ensure target user has verified ADMIN profession
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
                userId: vote.targetAdminId,
                professionTypeId: adminType.id,
              },
            },
            update: { status: "VERIFIED", verifiedAt: new Date() },
            create: {
              userId: vote.targetAdminId,
              professionTypeId: adminType.id,
              status: "VERIFIED",
              verifiedAt: new Date(),
            },
          });

          await tx.organizationAdmin.upsert({
            where: {
              organizationId_userId: {
                organizationId: vote.organizationId,
                userId: vote.targetAdminId,
              },
            },
            update: { isActive: true },
            create: {
              organizationId: vote.organizationId,
              userId: vote.targetAdminId,
              isPrimaryAdmin: false,
              permissions: ["MANAGE_EMPLOYEES", "MANAGE_ROLES"],
              isActive: true,
            },
          });
        } else if (vote.action === "REMOVE_ADMIN") {
          await tx.organizationAdmin.updateMany({
            where: {
              organizationId: vote.organizationId,
              userId: vote.targetAdminId,
            },
            data: { isActive: false },
          });
        }

        await tx.adminVote.update({
          where: { id: voteId },
          data: { status: "APPROVED" },
        });
      } else {
        await tx.adminVote.update({
          where: { id: voteId },
          data: { status: "REJECTED" },
        });
      }
    }
  });

  revalidatePath(`/dashboard/organization/edit/${vote.organizationId}`);
  revalidatePath(`/admin/manage/edit/${vote.organizationId}`);
  return { success: true };
}

export async function getPendingVotes(organizationId: string) {
  const votes = await prisma.adminVote.findMany({
    where: { organizationId, status: "PENDING" },
    include: {
      votes: {
        include: {
          admin: { select: { id: true, name: true, email: true } },
        },
      },
      initiatedBy: { select: { id: true, name: true, email: true } },
      targetAdmin: { select: { id: true, name: true, email: true } },
      organization: {
        include: {
          admins: {
            where: { isActive: true },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return votes;
}
