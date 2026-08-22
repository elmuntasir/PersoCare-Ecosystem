"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { z } from "zod";

const auditQuerySchema = z.object({
  action: z.string().optional(),
  userId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.number().int().default(50),
});

export async function getAuditLogs(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const { action, userId, fromDate, toDate, limit } = auditQuerySchema.parse({
    action: formData.get("action") ? String(formData.get("action")) : undefined,
    userId: formData.get("userId") ? String(formData.get("userId")) : undefined,
    fromDate: formData.get("fromDate") ? String(formData.get("fromDate")) : undefined,
    toDate: formData.get("toDate") ? String(formData.get("toDate")) : undefined,
    limit: formData.get("limit") ? Number(formData.get("limit")) : 50,
  });

  const where: any = {};
  if (action && action.trim() !== "") {
    where.action = { contains: action.trim(), mode: "insensitive" };
  }
  if (userId && userId.trim() !== "") {
    where.userId = userId.trim();
  }
  if (fromDate && fromDate.trim() !== "") {
    where.createdAt = { ...(where.createdAt || {}), gte: new Date(fromDate) };
  }
  if (toDate && toDate.trim() !== "") {
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    where.createdAt = { ...(where.createdAt || {}), lte: endOfDay };
  }

  const logs = await prisma.systemAuditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    details: log.details,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
    user: log.user ? { name: log.user.name, email: log.user.email } : null,
  }));
}
