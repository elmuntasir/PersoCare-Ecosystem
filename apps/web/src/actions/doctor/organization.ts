"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getDoctorOrganizations() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const employees = await prisma.organizationEmployee.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      department: true,
      organizationRole: true,
      organization: {
        include: {
          organizationType: true,
          admins: {
            where: { isActive: true },
            include: { user: { select: { name: true } } },
          },
          departments: true,
          orgRoles: true,
          schedules: {
            where: { doctorUserId: user.id },
            orderBy: { requestedAt: "desc" },
          },
        },
      },
    },
  });

  const processedEmployees = employees.map((emp) => {
    const schedules = emp.organization.schedules || [];
    const activeSchedule =
      schedules.find((s) => s.isActive && s.status === "APPROVED") || null;
    const pendingSchedule =
      schedules.find((s) => s.status === "PENDING") || null;
    const rejectedSchedule =
      schedules.find((s) => s.status === "REJECTED") || null;

    return {
      ...emp,
      activeSchedule: activeSchedule
        ? {
            ...activeSchedule,
            requestedAt: activeSchedule.requestedAt
              ? activeSchedule.requestedAt.toISOString()
              : null,
          }
        : null,
      pendingSchedule: pendingSchedule
        ? {
            ...pendingSchedule,
            requestedAt: pendingSchedule.requestedAt
              ? pendingSchedule.requestedAt.toISOString()
              : null,
          }
        : null,
      rejectedSchedule: rejectedSchedule
        ? {
            ...rejectedSchedule,
            requestedAt: rejectedSchedule.requestedAt
              ? rejectedSchedule.requestedAt.toISOString()
              : null,
            reviewedAt: rejectedSchedule.reviewedAt
              ? rejectedSchedule.reviewedAt.toISOString()
              : null,
          }
        : null,
    };
  });

  const invitations = await prisma.employeeInvitation.findMany({
    where: { invitedUserId: user.id, status: "PENDING" },
    include: {
      organization: true,
      invitedBy: { select: { name: true, email: true } },
    },
  });

  return { employees: processedEmployees, invitations };
}

export async function respondToEmployeeInvitationDoctor(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { invitationId, accept } = z
    .object({ invitationId: z.string(), accept: z.boolean() })
    .parse({
      invitationId: formData.get("invitationId"),
      accept: formData.get("accept") === "true",
    });

  const invitation = await prisma.employeeInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.invitedUserId !== user.id) throw new Error("Unauthorized");
  if (invitation.status !== "PENDING") throw new Error("Already responded");

  if (accept) {
    const existing = await prisma.organizationEmployee.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: user.id,
        },
      },
    });

    if (!existing) {
      await prisma.organizationEmployee.create({
        data: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.role,
          isActive: true,
        },
      });
    } else if (!existing.isActive) {
      await prisma.organizationEmployee.update({
        where: { id: existing.id },
        data: { isActive: true, leftAt: null, role: invitation.role },
      });
    }

    await prisma.employeeInvitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
  } else {
    await prisma.employeeInvitation.update({
      where: { id: invitationId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  }

  revalidatePath("/dashboard/doctor/my-organization");
  return { success: true };
}
