"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const getHistorySchema = z.object({
  organizationId: z.string().optional(),
  status: z.enum(["APPROVED", "REJECTED"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  doctorName: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ApprovalHistoryData = Awaited<ReturnType<typeof getApprovalHistory>>;

export async function getApprovalHistory(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const adminOrgs = await prisma.organizationAdmin.findMany({
    where: { userId: user.id, isActive: true },
    select: { organizationId: true },
  });
  if (adminOrgs.length === 0) throw new Error("Unauthorized – Admin only");

  const { organizationId, status, dateFrom, dateTo, doctorName, page, limit } =
    getHistorySchema.parse({
      organizationId: (formData.get("organizationId") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      dateFrom: (formData.get("dateFrom") as string) || undefined,
      dateTo: (formData.get("dateTo") as string) || undefined,
      doctorName: (formData.get("doctorName") as string) || undefined,
      page: formData.get("page") || 1,
      limit: formData.get("limit") || 20,
    });

  const orgIds = organizationId
    ? [organizationId]
    : adminOrgs.map((a) => a.organizationId);

  const where: any = {
    organizationId: { in: orgIds },
    status: status ? status : { in: ["APPROVED", "REJECTED"] },
  };

  if (dateFrom || dateTo) {
    where.reviewedAt = {};
    if (dateFrom) where.reviewedAt.gte = new Date(dateFrom);
    if (dateTo) where.reviewedAt.lte = new Date(dateTo + "T23:59:59Z");
  }

  if (doctorName) {
    where.doctor = {
      name: { contains: doctorName, mode: "insensitive" },
    };
  }

  const skip = (page - 1) * limit;

  const [items, total, organizations] = await Promise.all([
    prisma.doctorSchedule.findMany({
      where,
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { reviewedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.doctorSchedule.count({ where }),
    prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    }),
  ]);

  // Fetch reviewer names separately (reviewedBy is a userId string, not a relation)
  const reviewerIds = items
    .map((i) => i.reviewedBy)
    .filter((id): id is string => !!id);
  const reviewers =
    reviewerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: reviewerIds } },
          select: { id: true, name: true },
        })
      : [];
  const reviewerMap = new Map(reviewers.map((r) => [r.id, r.name]));

  return {
    items: items.map((item) => ({
      id: item.id,
      doctor: item.doctor,
      organization: item.organization,
      assumedVisitDurationMinutes: item.assumedVisitDurationMinutes,
      approvalMode: item.approvalMode,
      workingDays: item.workingDays,
      startTime: item.startTime,
      endTime: item.endTime,
      lunchBreakStart: item.lunchBreakStart,
      lunchBreakEnd: item.lunchBreakEnd,
      status: item.status as "APPROVED" | "REJECTED",
      requestedAt: item.requestedAt ? item.requestedAt.toISOString() : null,
      reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
      reviewedByName: item.reviewedBy ? (reviewerMap.get(item.reviewedBy) ?? null) : null,
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
    organizations,
  };
}
