"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { executeProviderChat } from "@/lib/ai/adapters";
import type { AIProvider } from "@/types/avatar";

const getDashboardSchema = z.object({
  range: z.enum(["day", "week", "month", "year"]).default("week"),
});

export type DashboardRange = "day" | "week" | "month" | "year";

export type AIHealthInsight = {
  id: string;
  title: string;
  category: "NUTRITION" | "EXERCISE" | "MEDICATION" | "WELLNESS" | "ALERT";
  summary: string;
  actionableStep?: string;
  importance: "HIGH" | "MEDIUM" | "LOW";
};

export type AIHealthInsightsResponse = {
  insights: AIHealthInsight[];
  generatedAt: string;
  providerUsed: string;
  hasCustomProviders: boolean;
};

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

  // Fire all independent queries in parallel instead of serially.
  // These run across a remote (~80ms RTT) Postgres pool, so serializing
  // ~10 round-trips added multiple seconds to every page navigation.
  const [
    medicineRoutine,
    dietRoutine,
    exerciseRoutine,
    nextAppointment,
    medicineCompletions,
    foodLogsRange,
    userFoodLogsRange,
    activityLogsRange,
    userExerciseLogsRange,
    diaryLogsRange,
  ] = await Promise.all([
    // A. MEDICINE routine
    prisma.routine.findFirst({
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
    }),

    // B. DIET routine
    prisma.routine.findFirst({
      where: { userId: user.id, type: "FOOD" },
      include: { items: true },
    }),

    // C. EXERCISE routine
    prisma.routine.findFirst({
      where: { userId: user.id, type: "EXERCISE" },
      include: { items: true },
    }),

    // 3. Latest Upcoming Appointment
    prisma.appointment.findFirst({
      where: {
        patientId: user.id,
        status: { in: ["BOOKED", "PENDING"] },
      },
      include: {
        doctors: true,
        organization: true,
      },
      orderBy: { bookedSlotTime: "asc" },
    }),

    // 4. Infographic data
    prisma.routineCompletion.findMany({
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
    }),

    prisma.foodLogEntry.findMany({
      where: {
        userId: user.id,
        loggedAt: { gte: startDate, lte: now },
      },
    }),

    prisma.userFoodLog.findMany({
      where: {
        userId: user.id,
        consumedAt: { gte: startDate, lte: now },
      },
    }),

    prisma.activityLog.findMany({
      where: {
        userId: user.id,
        type: "EXERCISE",
        loggedAt: { gte: startDate, lte: now },
      },
    }),

    prisma.userExerciseLog.findMany({
      where: {
        userId: user.id,
        loggedAt: { gte: startDate, lte: now },
      },
    }),

    prisma.healthDiaryEntry.findMany({
      where: {
        userId: user.id,
        recordedAt: { gte: startDate, lte: now },
      },
    }),
  ]);

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

  // Diet completions from Routine payload
  for (const comp of dietCompletions) {
    if (!comp.date || comp.date < startStr || comp.date > endStr) continue;
    allCompletions.push({ date: comp.date, status: "DONE" });
  }

  // FoodLogEntry records
  for (const fl of foodLogsRange) {
    allCompletions.push({ date: fl.loggedAt.toISOString().split("T")[0], status: "DONE" });
  }

  // UserFoodLog records
  for (const ufl of userFoodLogsRange) {
    allCompletions.push({ date: ufl.consumedAt.toISOString().split("T")[0], status: "DONE" });
  }

  // Exercise completions from Routine payload
  for (const comp of exCompletions) {
    if (!comp.date || comp.date < startStr || comp.date > endStr) continue;
    allCompletions.push({ date: comp.date, status: "DONE" });
  }

  // ActivityLog records
  for (const al of activityLogsRange) {
    allCompletions.push({ date: al.loggedAt.toISOString().split("T")[0], status: "DONE" });
  }

  // UserExerciseLog records
  for (const uel of userExerciseLogsRange) {
    allCompletions.push({ date: uel.loggedAt.toISOString().split("T")[0], status: "DONE" });
  }

  // HealthDiaryEntry records
  for (const dl of diaryLogsRange) {
    allCompletions.push({ date: dl.recordedAt.toISOString().split("T")[0], status: "DONE" });
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

export async function getAIHealthInsights(rawProvidersJson?: string): Promise<AIHealthInsightsResponse> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  let clientProviders: AIProvider[] = [];
  if (rawProvidersJson) {
    try {
      clientProviders = JSON.parse(rawProvidersJson);
    } catch {
      clientProviders = [];
    }
  }

  // 1. Fetch user health signals and telemetry
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: user.id },
  });

  const recentFoods = await prisma.userFoodLog.findMany({
    where: { userId: user.id },
    include: { user: false },
    orderBy: { consumedAt: "desc" },
    take: 6,
  });

  const recentFoodEntries = await prisma.foodLogEntry.findMany({
    where: { userId: user.id },
    include: { food: true },
    orderBy: { loggedAt: "desc" },
    take: 6,
  });

  const recentExercises = await prisma.userExerciseLog.findMany({
    where: { userId: user.id },
    orderBy: { loggedAt: "desc" },
    take: 6,
  });

  const recentDiaries = await prisma.healthDiaryEntry.findMany({
    where: { userId: user.id },
    orderBy: { recordedAt: "desc" },
    take: 5,
  });

  const recentMetabolic = await prisma.metabolicRiskAssessment.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const activePrescriptions = await prisma.prescription.findMany({
    where: { patientId: user.id },
    include: { medicines: true },
    take: 3,
  });

  // 2. Select AI Provider
  const candidateProviders: AIProvider[] = clientProviders.filter((p) => p.enabled && !p.rateLimited);

  if (candidateProviders.length === 0) {
    if (process.env.GROQ_API_KEY) {
      candidateProviders.push({
        id: "env-groq",
        name: "Groq LLaMA",
        icon: "/images/avatars/providers/groq.png",
        model: "llama-3.3-70b-versatile",
        apiKey: process.env.GROQ_API_KEY,
        providerKey: "groq",
        enabled: true,
      });
    }
    if (process.env.GEMINI_API_KEY) {
      candidateProviders.push({
        id: "env-gemini",
        name: "Google Gemini",
        icon: "/images/avatars/providers/google.png",
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        providerKey: "google",
        enabled: true,
      });
    }
    if (process.env.OPENAI_API_KEY) {
      candidateProviders.push({
        id: "env-openai",
        name: "OpenAI GPT",
        icon: "/images/avatars/providers/openai.png",
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
        providerKey: "openai",
        enabled: true,
      });
    }
  }

  const userHealthSummary = {
    userName: user.name,
    gender: user.gender,
    allergies: profile?.allergies || [],
    dietaryRestrictions: profile?.dietaryRestrictions || [],
    weightKg: profile?.weightKg,
    heightCm: profile?.heightCm,
    smokingStatus: profile?.smokingStatus,
    metabolicRiskTier: recentMetabolic?.tier || "UNKNOWN",
    recentMealsLoggedCount: recentFoods.length + recentFoodEntries.length,
    recentMealsSample: recentFoodEntries.map((f) => f.food.foodName).concat(recentFoods.map((f) => f.notes || "Meal")).slice(0, 5),
    recentWorkouts: recentExercises.map((e) => `${e.exerciseName} (${e.duration}m, ${e.caloriesBurned} kcal)`),
    recentSymptomsOrMood: recentDiaries.map((d) => ({ mood: d.mood, symptoms: d.symptoms, note: d.note })),
    activeMedicines: activePrescriptions.flatMap((p) => p.medicines.map((m) => `${m.medicineName} (${m.dosage})`)),
  };

  let generatedInsights: AIHealthInsight[] = [];
  let providerUsed = "Internal Health Engine";

  if (candidateProviders.length > 0) {
    const selectedProvider = candidateProviders[0];
    providerUsed = selectedProvider.name || selectedProvider.model;

    const systemPrompt = `You are the PersoCare AI Clinical & Wellness Intelligence Engine.
Analyze the user's real health telemetry and generate 3 to 4 hyper-personalized, actionable health insights.

OUTPUT FORMAT REQUIREMENTS:
Return ONLY a valid JSON array of objects. Do not include markdown code block backticks, just raw JSON.
Each object must have the following keys:
- "id": string (unique slug like "insight-1")
- "title": string (concise, catchy heading, max 7 words)
- "category": one of ["NUTRITION", "EXERCISE", "MEDICATION", "WELLNESS", "ALERT"]
- "summary": string (1-2 sentences explaining the personalized insight based on their specific logged data or gaps)
- "actionableStep": string (specific, simple recommendation they can do today)
- "importance": one of ["HIGH", "MEDIUM", "LOW"]

USER HEALTH CONTEXT:
${JSON.stringify(userHealthSummary, null, 2)}
`;

    try {
      const responseText = await executeProviderChat(
        selectedProvider,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate current personalized health insights for my dashboard." },
        ],
        { temperature: 0.4 }
      );

      const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        generatedInsights = parsed.map((item, idx) => ({
          id: item.id || `insight-${idx + 1}`,
          title: item.title || "Health Observation",
          category: ["NUTRITION", "EXERCISE", "MEDICATION", "WELLNESS", "ALERT"].includes(item.category)
            ? item.category
            : "WELLNESS",
          summary: item.summary || "Smart health routine update.",
          actionableStep: item.actionableStep,
          importance: ["HIGH", "MEDIUM", "LOW"].includes(item.importance) ? item.importance : "MEDIUM",
        }));
      }
    } catch (err) {
      console.error("[getAIHealthInsights] AI generation failed, falling back to heuristic engine:", err);
    }
  }

  // Fallback heuristic engine if AI call fails or no API keys configured
  if (generatedInsights.length === 0) {
    if (userHealthSummary.recentMealsLoggedCount === 0) {
      generatedInsights.push({
        id: "insight-nutrition-log",
        title: "Log Your Meals for Precision Metrics",
        category: "NUTRITION",
        summary: "We haven't detected meal entries this week. Tracking your meals helps calibrate metabolic risk and calorie expenditure.",
        actionableStep: "Tap Diet Plan or Food Search to quick-log your latest meal.",
        importance: "MEDIUM",
      });
    } else {
      generatedInsights.push({
        id: "insight-nutrition-balance",
        title: "Nutritional Adherence Tracking",
        category: "NUTRITION",
        summary: `You have logged ${userHealthSummary.recentMealsLoggedCount} meals recently. Consistent logging improves dietary recommendations.`,
        actionableStep: "Keep maintaining steady hydration (aim for 2.5L+ daily).",
        importance: "LOW",
      });
    }

    if (userHealthSummary.recentWorkouts.length === 0) {
      generatedInsights.push({
        id: "insight-exercise-start",
        title: "Incorporate Daily Physical Activity",
        category: "EXERCISE",
        summary: "No exercise sessions were logged recently. A 20-minute brisk walk enhances cardiovascular circulation and reduces insulin resistance.",
        actionableStep: "Schedule a 15-20 min light cardio session today.",
        importance: "MEDIUM",
      });
    } else {
      generatedInsights.push({
        id: "insight-exercise-active",
        title: "Great Workout Consistency",
        category: "EXERCISE",
        summary: `Active logs found: ${userHealthSummary.recentWorkouts[0]}. Consistent physical routines boost metabolic health.`,
        actionableStep: "Remember post-workout stretching and protein replenishment.",
        importance: "LOW",
      });
    }

    if (userHealthSummary.activeMedicines.length > 0) {
      generatedInsights.push({
        id: "insight-medication-sync",
        title: "Prescription Schedule Sync",
        category: "MEDICATION",
        summary: `You have ${userHealthSummary.activeMedicines.length} active prescribed medications.`,
        actionableStep: "Ensure doses are taken with the prescribed meal relations.",
        importance: "HIGH",
      });
    } else {
      generatedInsights.push({
        id: "insight-wellness-check",
        title: "Routine Health Check & Diary",
        category: "WELLNESS",
        summary: "Recording your daily mood and symptoms in the Health Diary helps detect early wellness patterns.",
        actionableStep: "Add a quick 30-second symptom check-in today.",
        importance: "LOW",
      });
    }
  }

  return {
    insights: generatedInsights,
    generatedAt: new Date().toISOString(),
    providerUsed,
    hasCustomProviders: candidateProviders.length > 0,
  };
}
