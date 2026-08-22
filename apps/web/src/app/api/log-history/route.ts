import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────

export type LogFilter = "week" | "month" | "year";
export type LogCategory = "all" | "diet" | "exercise" | "medicine" | "health_diary";

export type LogTableRow = {
  id: string;
  date: string;
  category: string;
  itemLabel: string;
  timeWindow: string;
  status: string;    // DONE | LATE | MISSED (computed)
  completedAt: string;
};

export type LogChartPoint = {
  date: string;
  done: number;
  late: number;
  missed: number;
};

export type LogHistoryResponse = {
  summary: { total: number; done: number; late: number; missed: number };
  chartData: LogChartPoint[];
  tableData: LogTableRow[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
};

// ─── Auth helper ───────────────────────────────────────────

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    return await prisma.user.findUnique({ where: { authId: authUser.id } });
  } catch {
    return null;
  }
}

// ─── Date range helper ─────────────────────────────────────

function getDateRange(filter: LogFilter): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);

  switch (filter) {
    case "week": {
      const dow = now.getDay();
      const diff = dow === 0 ? 6 : dow - 1; // Monday = start
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end: now };
}

// ─── Compute display status ────────────────────────────────
// Schema only stores DONE / SKIPPED / NOT_YET.
// LATE = completed after endTime window.
// MISSED = NOT_YET (never completed).

function computeDisplayStatus(
  dbStatus: string,
  completedAt: Date | null,
  endTime: string | null
): string {
  if (dbStatus === "NOT_YET" || (!completedAt && dbStatus !== "DONE")) return "MISSED";
  if (completedAt && endTime) {
    // Parse endTime "HH:MM" against the completedAt day
    const [h, m] = endTime.split(":").map(Number);
    const endDate = new Date(completedAt);
    endDate.setHours(h, m, 0, 0);
    if (completedAt > endDate) return "LATE";
  }
  return "DONE";
}

// ─── GET ───────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get("filter") || "week") as LogFilter;
    const category = (searchParams.get("category") || "all") as LogCategory;
    const searchTerm = (searchParams.get("search") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = 100;

    const { start, end } = getDateRange(filter);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const includeDiet = category === "all" || category === "diet";
    const includeExercise = category === "all" || category === "exercise";
    const includeMedicine = category === "all" || category === "medicine";
    const includeHealthDiary = category === "all" || category === "health_diary";

    type UnifiedEntry = {
      id: string;
      date: string; // YYYY-MM-DD
      category: "Diet" | "Exercise" | "Medicine" | "Health Diary";
      itemLabel: string;
      timeWindow: string;
      status: "DONE" | "LATE" | "MISSED";
      completedAt: string; // e.g. "09:32 AM" or "—"
      rawDate: Date;
    };

    const allEntries: UnifiedEntry[] = [];

    // ─────────────────────────────────────────────────────────────
    // 1. DIET COMPLETIONS & SCHEDULE FROM ROUTINE JSON PAYLOAD
    // ─────────────────────────────────────────────────────────────
    if (includeDiet) {
      const dietRoutine = await prisma.routine.findFirst({
        where: { userId: user.id, type: "FOOD" },
        include: { items: true },
      });

      if (dietRoutine && dietRoutine.items.length > 0) {
        const payload = (dietRoutine.items[0].payload as any) || {};
        const courses: Array<{ id: string; name: string; defaultTime: string }> = Array.isArray(payload.courses) ? payload.courses : [];
        const schedule: Array<{ id: string; day: string; courseId: string; foodName: string; amountGrams: number }> = Array.isArray(payload.schedule) ? payload.schedule : [];
        const completions: Array<{ date: string; courseId: string; confirmedAt: string }> = Array.isArray(payload.completions) ? payload.completions : [];

        const courseMap = new Map(courses.map((c) => [c.id, c]));

        for (const comp of completions) {
          if (!comp.date || comp.date < startStr || comp.date > endStr) continue;

          const course = courseMap.get(comp.courseId);
          const courseName = course ? course.name : "Meal";
          const defaultTime = course ? course.defaultTime : "—";

          // Find schedule items for this course on this day
          const dObj = new Date(comp.date + "T00:00:00");
          const dayName = dObj.toLocaleDateString("en-US", { weekday: "long" });
          const matchingMeals = schedule.filter((s) => s.courseId === comp.courseId && s.day.toLowerCase() === dayName.toLowerCase());
          const foodSummary = matchingMeals.length > 0
            ? matchingMeals.map((m) => `${m.foodName} (${m.amountGrams}g)`).join(", ")
            : `${courseName}`;

          const itemLabel = `${courseName}: ${foodSummary}`;

          // Use explicit status when available (front-end stores MISSED/LATE/DONE), otherwise infer from confirmedAt
          const dietStatus = (comp as any).status ? (comp as any).status : (comp.confirmedAt ? "DONE" : "MISSED");
          allEntries.push({
            id: `diet-comp-${comp.date}-${comp.courseId}`,
            date: comp.date,
            category: "Diet",
            itemLabel,
            timeWindow: defaultTime,
            status: dietStatus as "DONE" | "LATE" | "MISSED",
            completedAt: comp.confirmedAt || "—",
            rawDate: dObj,
          });
        }
      }

      // Also include individual FoodLogEntry records
      const foodLogs = await prisma.foodLogEntry.findMany({
        where: {
          userId: user.id,
          loggedAt: { gte: start, lte: end },
        },
        include: { food: true },
        orderBy: { loggedAt: "desc" },
      });

      for (const fl of foodLogs) {
        const dateStr = fl.loggedAt.toISOString().split("T")[0];
        allEntries.push({
          id: `food-log-${fl.id}`,
          date: dateStr,
          category: "Diet",
          itemLabel: `${fl.food.foodName} (${fl.amountGrams}g)`,
          timeWindow: "Quick Log",
          status: "DONE",
          completedAt: fl.loggedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          rawDate: fl.loggedAt,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. EXERCISE COMPLETIONS & WORKOUTS FROM ROUTINE JSON PAYLOAD
    // ─────────────────────────────────────────────────────────────
    if (includeExercise) {
      const exerciseRoutine = await prisma.routine.findFirst({
        where: { userId: user.id, type: "EXERCISE" },
        include: { items: true },
      });

      if (exerciseRoutine && exerciseRoutine.items.length > 0) {
        const payload = (exerciseRoutine.items[0].payload as any) || {};
        const sessions: Array<{ id: string; name: string; defaultTime: string }> = Array.isArray(payload.sessions) ? payload.sessions : [];
        const schedule: Array<{ id: string; day: string; sessionId: string; exerciseName: string; sets: number; reps: number; muscleGroup?: string; estimatedCalories?: number }> = Array.isArray(payload.schedule) ? payload.schedule : [];
        const completions: Array<{ date: string; sessionId: string; confirmedAt: string }> = Array.isArray(payload.completions) ? payload.completions : [];

        const sessionMap = new Map(sessions.map((s) => [s.id, s]));

        for (const comp of completions) {
          if (!comp.date || comp.date < startStr || comp.date > endStr) continue;

          const session = sessionMap.get(comp.sessionId);
          const sessionName = session ? session.name : "Workout Session";
          const defaultTime = session ? session.defaultTime : "—";

          const dObj = new Date(comp.date + "T00:00:00");
          const dayName = dObj.toLocaleDateString("en-US", { weekday: "long" });
          const matchingExercises = schedule.filter((s) => s.sessionId === comp.sessionId && s.day.toLowerCase() === dayName.toLowerCase());
          const exerciseSummary = matchingExercises.length > 0
            ? matchingExercises.map((e) => `${e.exerciseName} (${e.sets}×${e.reps})`).join(", ")
            : `${sessionName}`;

          const itemLabel = `${sessionName}: ${exerciseSummary}`;

          // Respect explicit status when present; otherwise infer from confirmedAt
          const exStatus = (comp as any).status ? (comp as any).status : (comp.confirmedAt ? "DONE" : "MISSED");
          allEntries.push({
            id: `exercise-comp-${comp.date}-${comp.sessionId}`,
            date: comp.date,
            category: "Exercise",
            itemLabel,
            timeWindow: defaultTime,
            status: exStatus as "DONE" | "LATE" | "MISSED",
            completedAt: comp.confirmedAt || "—",
            rawDate: dObj,
          });
        }
      }

      // Also include ActivityLog entries of type EXERCISE
      const activityLogs = await prisma.activityLog.findMany({
        where: {
          userId: user.id,
          type: "EXERCISE",
          loggedAt: { gte: start, lte: end },
        },
        orderBy: { loggedAt: "desc" },
      });

      for (const al of activityLogs) {
        const dateStr = al.loggedAt.toISOString().split("T")[0];
        const p = (al.payload as any) || {};
        const exName = p.exerciseName || "Workout";
        const details = p.sets && p.reps ? ` (${p.sets}×${p.reps})` : "";
        allEntries.push({
          id: `activity-log-${al.id}`,
          date: dateStr,
          category: "Exercise",
          itemLabel: `${exName}${details}`,
          timeWindow: "Quick Log",
          status: "DONE",
          completedAt: al.loggedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          rawDate: al.loggedAt,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. MEDICINE ROUTINE COMPLETIONS (Database table relations)
    // ─────────────────────────────────────────────────────────────
    if (includeMedicine) {
      const medicineCompletions = await prisma.routineCompletion.findMany({
        where: {
          date: { gte: start, lte: end },
          routineItem: {
            routine: {
              userId: user.id,
              type: "MEDICINE",
            },
          },
        },
        include: {
          routineItem: {
            select: {
              label: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      });

      for (const mc of medicineCompletions) {
        const dateStr = mc.date.toISOString().split("T")[0];
        const displayStatus = computeDisplayStatus(
          mc.status,
          mc.completedAt,
          mc.routineItem.endTime
        ) as "DONE" | "LATE" | "MISSED";

        allEntries.push({
          id: `medicine-comp-${mc.id}`,
          date: dateStr,
          category: "Medicine",
          itemLabel: mc.routineItem.label,
          timeWindow:
            mc.routineItem.startTime && mc.routineItem.endTime
              ? `${mc.routineItem.startTime}–${mc.routineItem.endTime}`
              : mc.routineItem.startTime || "—",
          status: displayStatus,
          completedAt: mc.completedAt
            ? mc.completedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "—",
          rawDate: mc.completedAt || mc.date,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. HEALTH DIARY ENTRIES
    // ─────────────────────────────────────────────────────────────
    if (includeHealthDiary) {
      const diaryEntries = await prisma.healthDiaryEntry.findMany({
        where: {
          userId: user.id,
          recordedAt: { gte: start, lte: end },
        },
        orderBy: { recordedAt: "desc" },
      });

      for (const de of diaryEntries) {
        const dateStr = de.recordedAt.toISOString().split("T")[0];
        const preview = de.note.length > 50 ? `${de.note.slice(0, 50)}...` : de.note;
        const moodStr = de.mood ? ` [${de.mood}]` : "";
        allEntries.push({
          id: `health-diary-${de.id}`,
          date: dateStr,
          category: "Health Diary",
          itemLabel: `${preview}${moodStr}`,
          timeWindow: "Journal Note",
          status: "DONE",
          completedAt: de.recordedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          rawDate: de.recordedAt,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. FILTER (SEARCH), AGGREGATE SUMMARY & CHARTS, PAGINATE
    // ─────────────────────────────────────────────────────────────

    // Apply search filter
    const filteredEntries = searchTerm
      ? allEntries.filter((e) => e.itemLabel.toLowerCase().includes(searchTerm))
      : allEntries;

    // Sort descending by date
    filteredEntries.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    // Summary counts
    let done = 0, late = 0, missed = 0;
    const datesMap = new Map<string, { done: number; late: number; missed: number }>();

    for (const e of filteredEntries) {
      if (e.status === "DONE") done++;
      else if (e.status === "LATE") late++;
      else missed++;

      if (!datesMap.has(e.date)) {
        datesMap.set(e.date, { done: 0, late: 0, missed: 0 });
      }
      const item = datesMap.get(e.date)!;
      if (e.status === "DONE") item.done++;
      else if (e.status === "LATE") item.late++;
      else item.missed++;
    }

    const chartData: LogChartPoint[] = Array.from(datesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => ({ date, ...counts }));

    // Pagination
    const totalItems = filteredEntries.length;
    const startIndex = (page - 1) * limit;
    const pagedEntries = filteredEntries.slice(startIndex, startIndex + limit);

    const tableData: LogTableRow[] = pagedEntries.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      itemLabel: e.itemLabel,
      timeWindow: e.timeWindow,
      status: e.status,
      completedAt: e.completedAt,
    }));

    const response: LogHistoryResponse = {
      summary: { total: totalItems, done, late, missed },
      chartData,
      tableData,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        totalItems,
        itemsPerPage: limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/log-history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

