"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const getDashboardSchema = z.object({
  range: z.enum(["day", "week", "month", "year"]).default("week"),
});

export type DashboardRange = "day" | "week" | "month" | "year";

export type UpcomingItem = {
  id: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  type: "FOOD" | "EXERCISE" | "MEDICINE";
  status: "PENDING" | "LATE" | "MISSED";
  completedAt: string | null;
  payload?: unknown;
};

export type AppointmentData = {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  organization: string;
  status: string;
};

export type DashboardData = {
  range: DashboardRange;
  upcoming: UpcomingItem[];
  appointment: AppointmentData | null;
  infographics: {
    total: number;
    done: number;
    late: number;
    missed: number;
    chartData: Array<{
      date: string;
      done: number;
      late: number;
      missed: number;
    }>;
  };
};

const DEFAULT_COURSES = [
  { id: "c-breakfast", name: "Breakfast", defaultTime: "08:30 AM", order: 0 },
  { id: "c-lunch", name: "Lunch", defaultTime: "01:30 PM", order: 1 },
  { id: "c-dinner", name: "Dinner", defaultTime: "08:30 PM", order: 2 },
];

const DEFAULT_SESSIONS = [
  { id: "s-morning", name: "Morning Cardio", defaultTime: "07:00 AM", order: 0 },
  { id: "s-evening", name: "Strength Training", defaultTime: "05:30 PM", order: 1 },
  { id: "s-night", name: "Core & Stretch", defaultTime: "08:30 PM", order: 2 },
];

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

export async function getDashboardData(formData: FormData): Promise<DashboardData> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = getDashboardSchema.safeParse({
    range: formData.get("range"),
  });
  const range: DashboardRange = parsed.success ? parsed.data.range : "week";

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // ─── 1. Date Range ──────────────────────────────────────
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

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = todayStr;

  // ─── 2. Latest Upcoming Items ───────────────────────────
  const upcomingItems: UpcomingItem[] = [];

  // A. MEDICINE Next Item
  const medicineRoutine = await prisma.routine.findFirst({
    where: { userId: user.id, type: "MEDICINE", isActive: true },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          completions: {
            where: {
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
          },
        },
      },
    },
  });

  let nextMedicineItem: UpcomingItem | null = null;
  for (const item of medicineRoutine?.items || []) {
    const comp = item.completions[0];
    if (comp?.status === "DONE") continue;

    let status: "PENDING" | "LATE" | "MISSED" = "PENDING";
    if (item.endTime) {
      const [h, m] = item.endTime.split(":").map(Number);
      const endD = new Date();
      endD.setHours(h, m, 0, 0);
      if (now > endD) {
        status = comp ? "LATE" : "MISSED";
      }
    }

    nextMedicineItem = {
      id: item.id,
      label: item.label,
      startTime: item.startTime,
      endTime: item.endTime,
      type: "MEDICINE",
      status,
      completedAt: comp?.completedAt?.toISOString() || null,
      payload: item.payload,
    };
    break;
  }

  // Fallback if no medicine scheduled in routine but user has prescriptions
  if (!nextMedicineItem) {
    const prescription = await prisma.prescription.findFirst({
      where: { patientId: user.id },
      include: { medicines: true },
      orderBy: { createdAt: "desc" },
    });
    if (prescription && prescription.medicines.length > 0) {
      const med = prescription.medicines[0];
      nextMedicineItem = {
        id: `rx-${med.id}`,
        label: `${med.medicineName} (${med.dosage})`,
        startTime: "08:00 AM",
        endTime: null,
        type: "MEDICINE",
        status: "PENDING",
        completedAt: null,
      };
    }
  }

  if (nextMedicineItem) upcomingItems.push(nextMedicineItem);

  // B. DIET Next Item
  const dietRoutine = await prisma.routine.findFirst({
    where: { userId: user.id, type: "FOOD" },
    include: { items: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dietPayload = (dietRoutine?.items[0]?.payload as any) || {};
  const courses = Array.isArray(dietPayload.courses) && dietPayload.courses.length > 0
    ? dietPayload.courses
    : DEFAULT_COURSES;
  const dietCompletions: Array<{ date: string; courseId: string; confirmedAt: string }> =
    Array.isArray(dietPayload.completions) ? dietPayload.completions : [];
  const todayDietComps = dietCompletions.filter((c) => c.date === todayStr);

  for (const course of courses) {
    const isDone = todayDietComps.some((c) => c.courseId === course.id);
    if (isDone) continue;

    upcomingItems.push({
      id: `diet-upcoming-${course.id}`,
      label: course.name,
      startTime: course.defaultTime || "12:00 PM",
      endTime: null,
      type: "FOOD",
      status: "PENDING",
      completedAt: null,
    });
    break;
  }

  // C. EXERCISE Next Item
  const exerciseRoutine = await prisma.routine.findFirst({
    where: { userId: user.id, type: "EXERCISE" },
    include: { items: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exPayload = (exerciseRoutine?.items[0]?.payload as any) || {};
  const sessions = Array.isArray(exPayload.sessions) && exPayload.sessions.length > 0
    ? exPayload.sessions
    : DEFAULT_SESSIONS;
  const exCompletions: Array<{ date: string; sessionId: string; confirmedAt: string }> =
    Array.isArray(exPayload.completions) ? exPayload.completions : [];
  const todayExComps = exCompletions.filter((c) => c.date === todayStr);

  for (const session of sessions) {
    const isDone = todayExComps.some((c) => c.sessionId === session.id);
    if (isDone) continue;

    upcomingItems.push({
      id: `exercise-upcoming-${session.id}`,
      label: session.name,
      startTime: session.defaultTime || "05:00 PM",
      endTime: null,
      type: "EXERCISE",
      status: "PENDING",
      completedAt: null,
    });
    break;
  }

  // ─── 3. Latest Upcoming Appointment ─────────────────────
  // Look for any upcoming or existing booked/pending appointment
  const nextAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: user.id,
      status: { in: ["BOOKED", "PENDING"] },
    },
    include: {
      doctors: true,
      organization: true,
    },
    orderBy: { bookedSlotTime: "asc" },
  });

  let appointmentData: AppointmentData | null = null;
  if (nextAppointment) {
    let doctorName = "Assigned Specialist";
    if (nextAppointment.doctors[0]) {
      const docUser = await prisma.user.findUnique({
        where: { id: nextAppointment.doctors[0].doctorUserId },
        select: { name: true },
      });
      if (docUser?.name) {
        doctorName = docUser.name;
      }
    }

    appointmentData = {
      id: nextAppointment.id,
      date: nextAppointment.bookedSlotTime?.toISOString().split("T")[0] || todayStr,
      time: nextAppointment.bookedSlotTime
        ? nextAppointment.bookedSlotTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : "10:00 AM",
      doctorName,
      organization: nextAppointment.organization?.name || "PersoCare Health Center",
      status: nextAppointment.status,
    };
  }

  // ─── 4. Infographic Data ────────────────────────────────
  type UnifiedActivityEntry = {
    date: string;
    status: "DONE" | "LATE" | "MISSED";
  };
  const allCompletions: UnifiedActivityEntry[] = [];

  // Medicine completions
  const medicineCompletions = await prisma.routineCompletion.findMany({
    where: {
      date: { gte: startDate, lte: now },
      routineItem: {
        routine: {
          userId: user.id,
          type: "MEDICINE",
        },
      },
    },
    include: {
      routineItem: true,
    },
  });

  for (const mc of medicineCompletions) {
    const dStr = mc.date.toISOString().split("T")[0];
    let status: "DONE" | "LATE" | "MISSED" = "DONE";
    if (mc.status === "NOT_YET" || (!mc.completedAt && mc.status !== "DONE")) {
      status = "MISSED";
    } else if (mc.completedAt && mc.routineItem.endTime) {
      const [h, m] = mc.routineItem.endTime.split(":").map(Number);
      const endDate = new Date(mc.completedAt);
      endDate.setHours(h, m, 0, 0);
      if (mc.completedAt > endDate) status = "LATE";
    }
    allCompletions.push({ date: dStr, status });
  }

  // Diet completions
  for (const comp of dietCompletions) {
    if (!comp.date || comp.date < startStr || comp.date > endStr) continue;
    allCompletions.push({ date: comp.date, status: "DONE" });
  }

  const foodLogsRange = await prisma.foodLogEntry.findMany({
    where: {
      userId: user.id,
      loggedAt: { gte: startDate, lte: now },
    },
  });
  for (const fl of foodLogsRange) {
    allCompletions.push({ date: fl.loggedAt.toISOString().split("T")[0], status: "DONE" });
  }

  // Exercise completions
  for (const comp of exCompletions) {
    if (!comp.date || comp.date < startStr || comp.date > endStr) continue;
    allCompletions.push({ date: comp.date, status: "DONE" });
  }

  const activityLogsRange = await prisma.activityLog.findMany({
    where: {
      userId: user.id,
      type: "EXERCISE",
      loggedAt: { gte: startDate, lte: now },
    },
  });
  for (const al of activityLogsRange) {
    allCompletions.push({ date: al.loggedAt.toISOString().split("T")[0], status: "DONE" });
  }

  const total = allCompletions.length;
  const done = allCompletions.filter((c) => c.status === "DONE").length;
  const late = allCompletions.filter((c) => c.status === "LATE").length;
  const missed = allCompletions.filter((c) => c.status === "MISSED").length;

  const dateMap = new Map<string, { done: number; late: number; missed: number }>();
  for (const comp of allCompletions) {
    if (!dateMap.has(comp.date)) {
      dateMap.set(comp.date, { done: 0, late: 0, missed: 0 });
    }
    const entry = dateMap.get(comp.date)!;
    if (comp.status === "DONE") entry.done++;
    else if (comp.status === "LATE") entry.late++;
    else if (comp.status === "MISSED") entry.missed++;
  }

  if (dateMap.size === 0) {
    dateMap.set(todayStr, { done: 0, late: 0, missed: 0 });
  }

  const chartData = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, counts]) => ({ date, ...counts }));

  return {
    range,
    upcoming: upcomingItems,
    appointment: appointmentData,
    infographics: {
      total,
      done,
      late,
      missed,
      chartData,
    },
  };
}
