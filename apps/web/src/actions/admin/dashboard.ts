"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const getDashboardDataSchema = z.object({
  organizationId: z.string().optional(),
  range: z.enum(["day", "week", "month", "year"]).default("week"),
});

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

export async function getAdminDashboardData(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const adminOrgs = await prisma.organizationAdmin.findMany({
    where: { userId: user.id, isActive: true },
    select: { organizationId: true },
  });
  if (adminOrgs.length === 0) throw new Error("Unauthorized – Admin only");

  const { organizationId, range } = getDashboardDataSchema.parse({
    organizationId: (formData.get("organizationId") as string) || undefined,
    range: (formData.get("range") as string) || "week",
  });

  const orgIds = organizationId
    ? [organizationId]
    : adminOrgs.map((a) => a.organizationId);

  // Date range
  const now = new Date();
  const startDate = new Date(now);
  switch (range) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week": {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case "month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  // ─── Stats ────────────────────────────────────────────────

  const [doctors, appointments, pendingApprovals] = await Promise.all([
    prisma.organizationEmployee.count({
      where: { organizationId: { in: orgIds }, role: "DOCTOR", isActive: true },
    }),
    prisma.appointment.count({
      where: {
        organizationId: { in: orgIds },
        bookedSlotTime: { gte: startDate, lte: now },
      },
    }),
    prisma.doctorSchedule.count({
      where: { organizationId: { in: orgIds }, status: "PENDING" },
    }),
  ]);

  // Distinct patients
  const patientRows = await prisma.appointment.findMany({
    where: {
      organizationId: { in: orgIds },
      patientId: { not: undefined, gt: "" },
    },
    distinct: ["patientId"],
    select: { patientId: true },
  });
  const patients = patientRows.length;

  // ─── Appointment status breakdown ─────────────────────────

  const statusGroups = await prisma.appointment.groupBy({
    by: ["status"],
    where: {
      organizationId: { in: orgIds },
      bookedSlotTime: { gte: startDate, lte: now },
    },
    _count: { _all: true },
  });
  const statusCounts: Record<string, number> = {};
  statusGroups.forEach((s) => {
    statusCounts[s.status] = s._count._all;
  });

  // ─── Daily chart (booked vs completed) ───────────────────

  const dailyAppointments = await prisma.appointment.findMany({
    where: {
      organizationId: { in: orgIds },
      bookedSlotTime: { gte: startDate, lte: now },
    },
    select: { bookedSlotTime: true, status: true },
  });

  // Group by date
  const dailyMap = new Map<string, { booked: number; completed: number }>();
  for (const a of dailyAppointments) {
    if (!a.bookedSlotTime) continue;
    const dateKey = a.bookedSlotTime.toISOString().slice(0, 10);
    const entry = dailyMap.get(dateKey) || { booked: 0, completed: 0 };
    entry.booked += 1;
    if (a.status === "PRESCRIBED") entry.completed += 1;
    dailyMap.set(dateKey, entry);
  }
  const dailyChart = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  // ─── Recent appointments ──────────────────────────────────

  const recentAppointments = await prisma.appointment.findMany({
    where: {
      organizationId: { in: orgIds },
      bookedSlotTime: { gte: startDate, lte: now },
    },
    include: {
      patient: { select: { name: true } },
      doctors: { include: { doctor: { select: { name: true } } } },
      organization: { select: { name: true } },
    },
    orderBy: { bookedSlotTime: "desc" },
    take: 8,
  });

  // ─── Organizations for filter dropdown ────────────────────

  const organizations = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
  });

  return {
    stats: { doctors, patients, appointments, pendingApprovals },
    statusCounts,
    dailyChart,
    recentAppointments: recentAppointments.map((a) => ({
      id: a.id,
      patientName: a.patient?.name ?? "Unknown Patient",
      doctorName: a.doctors[0]?.doctor?.name ?? "Unassigned",
      organizationName: a.organization.name,
      date: a.bookedSlotTime ? a.bookedSlotTime.toISOString() : null,
      status: a.status,
    })),
    organizations,
    range,
    selectedOrgId: organizationId ?? null,
  };
}
