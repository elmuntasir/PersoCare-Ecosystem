"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "crypto";

// ─── Get Employees with Department & Role ──────────────────

export async function getOrganizationEmployees(organizationId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const employees = await prisma.organizationEmployee.findMany({
    where: { organizationId, isActive: true },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      department: {
        select: { id: true, name: true },
      },
      organizationRole: {
        select: { id: true, name: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const pendingInvitations = await prisma.employeeInvitation.findMany({
    where: { organizationId, status: "PENDING" },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
      invitedUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { employees, pendingInvitations };
}

// ─── Invite Employee (with Audit Logging) ───────────────────

const inviteEmployeeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Role is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  departmentId: z.string().optional(),
});

export async function inviteEmployee(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string)?.trim().toUpperCase();
  const organizationId = formData.get("organizationId") as string;
  const departmentId = (formData.get("departmentId") as string) || undefined;

  const data = inviteEmployeeSchema.parse({ email, role, organizationId, departmentId });

  // Verify caller is an active admin of this organization
  const admin = await prisma.organizationAdmin.findFirst({
    where: { userId: user.id, organizationId: data.organizationId, isActive: true },
  });
  if (!admin) throw new Error("Unauthorized – You are not an admin of this organization");

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true },
  });
  if (!targetUser) throw new Error("No user found with this email address");

  // Check if already an active employee
  const existing = await prisma.organizationEmployee.findUnique({
    where: {
      organizationId_userId: { organizationId: data.organizationId, userId: targetUser.id },
    },
  });
  if (existing && existing.isActive) {
    throw new Error("This user is already an active employee of this organization");
  }

  // ── If target is an admin of this org (including self), directly add as employee ──
  const targetIsAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: data.organizationId, userId: targetUser.id, isActive: true },
  });

  if (targetIsAdmin) {
    if (existing) {
      await prisma.organizationEmployee.update({
        where: { id: existing.id },
        data: {
          role: data.role,
          departmentId: data.departmentId || null,
          isActive: true,
          leftAt: null,
        },
      });
    } else {
      await prisma.organizationEmployee.create({
        data: {
          organizationId: data.organizationId,
          userId: targetUser.id,
          role: data.role,
          departmentId: data.departmentId || null,
          isActive: true,
        },
      });
    }

    // Log direct addition
    await prisma.organizationMemberHistory.create({
      data: {
        organizationId: data.organizationId,
        actedBy: user.id,
        targetUserId: targetUser.id,
        action: "MEMBER_ADDED",
        details: {
          role: data.role,
          departmentId: data.departmentId,
          note: "Admin added directly without invitation",
        },
      },
    });

    revalidatePath("/dashboard/organization/employees");
    revalidatePath("/admin/employees");
    return { success: true, message: "Admin added as employee directly" };
  }

  // Check for pending invitation
  const pending = await prisma.employeeInvitation.findFirst({
    where: { organizationId: data.organizationId, invitedUserId: targetUser.id, status: "PENDING" },
  });
  if (pending) throw new Error("An invitation has already been sent to this user");

  // Reactivate without invitation if previously an employee
  if (existing && !existing.isActive) {
    await prisma.organizationEmployee.update({
      where: { id: existing.id },
      data: {
        role: data.role,
        departmentId: data.departmentId || null,
        isActive: true,
        leftAt: null,
      },
    });

    await prisma.organizationMemberHistory.create({
      data: {
        organizationId: data.organizationId,
        actedBy: user.id,
        targetUserId: targetUser.id,
        action: "REACTIVATED",
        details: {
          role: data.role,
          departmentId: data.departmentId,
        },
      },
    });

    revalidatePath("/dashboard/organization/employees");
    revalidatePath("/admin/employees");
    return { success: true, message: "Employee reactivated" };
  }

  // Create invitation
  const invitation = await prisma.employeeInvitation.create({
    data: {
      organizationId: data.organizationId,
      invitedById: user.id,
      invitedUserId: targetUser.id,
      email: targetUser.email,
      role: data.role,
      token: randomUUID(),
    },
  });

  // Log invitation sent
  await prisma.organizationMemberHistory.create({
    data: {
      organizationId: data.organizationId,
      actedBy: user.id,
      targetUserId: targetUser.id,
      action: "INVITE_SENT",
      details: {
        role: data.role,
        departmentId: data.departmentId,
        invitationId: invitation.id,
      },
    },
  });

  revalidatePath("/dashboard/organization/employees");
  revalidatePath("/admin/employees");
  return { success: true };
}

// ─── Respond to Employee Invitation (Accept / Decline with Log) ──

export async function respondToEmployeeInvitation(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { invitationId, accept } = z
    .object({
      invitationId: z.string(),
      accept: z.boolean(),
    })
    .parse({
      invitationId: formData.get("invitationId"),
      accept: formData.get("accept") === "true",
    });

  const invitation = await prisma.employeeInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.invitedUserId !== user.id) throw new Error("Unauthorized");
  if (invitation.status !== "PENDING") throw new Error("Invitation already responded to");

  if (accept) {
    await prisma.$transaction(async (tx) => {
      await tx.organizationEmployee.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: user.id,
          },
        },
        update: {
          role: invitation.role,
          isActive: true,
          leftAt: null,
        },
        create: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.role,
          isActive: true,
        },
      });

      await tx.employeeInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });

      await tx.organizationMemberHistory.create({
        data: {
          organizationId: invitation.organizationId,
          actedBy: user.id,
          targetUserId: user.id,
          action: "INVITE_ACCEPTED",
          details: {
            role: invitation.role,
            invitationId: invitation.id,
          },
        },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.employeeInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED", respondedAt: new Date() },
      });

      await tx.organizationMemberHistory.create({
        data: {
          organizationId: invitation.organizationId,
          actedBy: user.id,
          targetUserId: user.id,
          action: "INVITE_DECLINED",
          details: {
            role: invitation.role,
            invitationId: invitation.id,
          },
        },
      });
    });
  }

  revalidatePath("/dashboard/organization/employees");
  revalidatePath("/admin/employees");
  return { success: true };
}

// ─── Remove Employee ───────────────────────────────────────

const removeEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  reason: z.string().optional(),
});

export async function removeEmployee(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { employeeId, reason } = removeEmployeeSchema.parse({
    employeeId: formData.get("employeeId"),
    reason: (formData.get("reason") as string) || "",
  });

  const employee = await prisma.organizationEmployee.findUnique({
    where: { id: employeeId },
    include: { organization: true },
  });

  if (!employee) throw new Error("Employee not found");

  // Verify caller is an active admin of this organization
  const admin = await prisma.organizationAdmin.findFirst({
    where: {
      userId: user.id,
      organizationId: employee.organizationId,
      isActive: true,
    },
  });

  if (!admin) throw new Error("Unauthorized – Admin privileges required");

  // Deactivate employee
  await prisma.organizationEmployee.update({
    where: { id: employeeId },
    data: {
      isActive: false,
      leftAt: new Date(),
    },
  });

  // Log removal action
  await prisma.organizationMemberHistory.create({
    data: {
      organizationId: employee.organizationId,
      actedBy: user.id,
      targetUserId: employee.userId,
      action: "MEMBER_REMOVED",
      details: {
        role: employee.role,
        departmentId: employee.departmentId,
        reason: reason || "Removed by administrator",
      },
    },
  });

  revalidatePath("/dashboard/organization/employees");
  revalidatePath("/admin/employees");
  return { success: true };
}

// ─── Update Employee Role/Department ──────────────────────

const updateEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  role: z.string().optional(),
  departmentId: z.string().optional().nullable(),
});

export async function updateEmployee(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { employeeId, role, departmentId } = updateEmployeeSchema.parse({
    employeeId: formData.get("employeeId"),
    role: (formData.get("role") as string) || undefined,
    departmentId: (formData.get("departmentId") as string) || null,
  });

  const employee = await prisma.organizationEmployee.findUnique({
    where: { id: employeeId },
    include: { organization: true },
  });
  if (!employee) throw new Error("Employee not found");

  const admin = await prisma.organizationAdmin.findFirst({
    where: {
      userId: user.id,
      organizationId: employee.organizationId,
      isActive: true,
    },
  });
  if (!admin) throw new Error("Unauthorized – Admin privileges required");

  const updateData: any = {};
  let action: "ROLE_CHANGED" | "DEPARTMENT_CHANGED" | null = null;
  let details: any = {};

  if (role && role !== employee.role) {
    updateData.role = role;
    action = "ROLE_CHANGED";
    details = { oldRole: employee.role, newRole: role };
  }

  if (departmentId !== undefined && departmentId !== employee.departmentId) {
    updateData.departmentId = departmentId;
    if (!action) action = "DEPARTMENT_CHANGED";
    details = { ...details, oldDepartmentId: employee.departmentId, newDepartmentId: departmentId };
  }

  if (!action) throw new Error("No changes detected to apply");

  await prisma.organizationEmployee.update({
    where: { id: employeeId },
    data: updateData,
  });

  await prisma.organizationMemberHistory.create({
    data: {
      organizationId: employee.organizationId,
      actedBy: user.id,
      targetUserId: employee.userId,
      action,
      details,
    },
  });

  revalidatePath("/dashboard/organization/employees");
  revalidatePath("/admin/employees");
  return { success: true };
}

// ─── Get Member History ────────────────────────────────────

export async function getMemberHistory(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { organizationId, action, dateFrom, dateTo, targetName, page, limit } = z
    .object({
      organizationId: z.string().min(1, "Organization ID is required"),
      action: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      targetName: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
    .parse({
      organizationId: formData.get("organizationId"),
      action: (formData.get("action") as string) || undefined,
      dateFrom: (formData.get("dateFrom") as string) || undefined,
      dateTo: (formData.get("dateTo") as string) || undefined,
      targetName: (formData.get("targetName") as string) || undefined,
      page: formData.get("page") || 1,
      limit: formData.get("limit") || 50,
    });

  // Verify caller is admin of this org
  const admin = await prisma.organizationAdmin.findFirst({
    where: { userId: user.id, organizationId, isActive: true },
  });
  if (!admin) throw new Error("Unauthorized – Admin access required");

  const where: any = { organizationId };
  if (action) where.action = action;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }
  if (targetName) {
    where.targetUser = { name: { contains: targetName, mode: "insensitive" } };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.organizationMemberHistory.findMany({
      where,
      include: {
        actedByUser: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.organizationMemberHistory.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      action: item.action,
      details: item.details,
      createdAt: item.createdAt.toISOString(),
      actedByUser: item.actedByUser,
      targetUser: item.targetUser,
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
}

