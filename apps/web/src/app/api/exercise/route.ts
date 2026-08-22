import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export type WorkoutSessionDefinition = {
  id: string;
  name: string;
  defaultTime: string; // e.g. "07:00 AM"
  order: number;
};

export type ExerciseScheduleEntry = {
  id: string;
  day: string;
  sessionId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  muscleGroup?: string;
  estimatedCalories?: number;
};

export type WorkoutCompletionRecord = {
  date: string; // YYYY-MM-DD
  sessionId: string;
  confirmedAt: string; // "07:15 AM"
  status?: "DONE" | "LATE" | "MISSED";
};

const DEFAULT_SESSIONS: WorkoutSessionDefinition[] = [
  { id: "s-morning", name: "Morning Cardio", defaultTime: "07:00 AM", order: 0 },
  { id: "s-evening", name: "Strength Training", defaultTime: "05:30 PM", order: 1 },
  { id: "s-night", name: "Core & Stretch", defaultTime: "08:30 PM", order: 2 },
];

const DEFAULT_EXERCISE_SCHEDULE: ExerciseScheduleEntry[] = [
  // Monday
  { id: "es-1", day: "Monday", sessionId: "s-morning", exerciseName: "Running / Jogging", sets: 1, reps: 20, muscleGroup: "Cardiovascular, Legs", estimatedCalories: 180 },
  { id: "es-2", day: "Monday", sessionId: "s-evening", exerciseName: "Push-ups & Bench Press", sets: 4, reps: 12, muscleGroup: "Chest, Triceps", estimatedCalories: 210 },
  { id: "es-3", day: "Monday", sessionId: "s-night", exerciseName: "Standard Plank & Stretch", sets: 3, reps: 60, muscleGroup: "Core, Abs", estimatedCalories: 65 },

  // Tuesday
  { id: "es-4", day: "Tuesday", sessionId: "s-morning", exerciseName: "Jumping Jacks & Burpees", sets: 3, reps: 20, muscleGroup: "Full Body, Cardio", estimatedCalories: 150 },
  { id: "es-5", day: "Tuesday", sessionId: "s-evening", exerciseName: "Bodyweight Squats & Lunges", sets: 4, reps: 15, muscleGroup: "Quads, Glutes", estimatedCalories: 220 },
  { id: "es-6", day: "Tuesday", sessionId: "s-night", exerciseName: "Yoga & Dynamic Stretching", sets: 1, reps: 15, muscleGroup: "Mobility, Spine", estimatedCalories: 50 },

  // Wednesday
  { id: "es-7", day: "Wednesday", sessionId: "s-morning", exerciseName: "Cycling (Endurance)", sets: 1, reps: 25, muscleGroup: "Legs, Heart & Lungs", estimatedCalories: 195 },
  { id: "es-8", day: "Wednesday", sessionId: "s-evening", exerciseName: "Pull-ups & Dumbbell Rows", sets: 4, reps: 10, muscleGroup: "Back, Biceps", estimatedCalories: 230 },
  { id: "es-9", day: "Wednesday", sessionId: "s-night", exerciseName: "Standard Plank", sets: 3, reps: 45, muscleGroup: "Core", estimatedCalories: 60 },

  // Thursday
  { id: "es-10", day: "Thursday", sessionId: "s-morning", exerciseName: "Running / Jogging", sets: 1, reps: 15, muscleGroup: "Cardio", estimatedCalories: 140 },
  { id: "es-11", day: "Thursday", sessionId: "s-evening", exerciseName: "Deadlift & Shoulder Press", sets: 3, reps: 10, muscleGroup: "Back, Shoulders", estimatedCalories: 240 },
  { id: "es-12", day: "Thursday", sessionId: "s-night", exerciseName: "Yoga & Stretching", sets: 1, reps: 15, muscleGroup: "Flexibility", estimatedCalories: 45 },

  // Friday (Current day demo)
  { id: "es-13", day: "Friday", sessionId: "s-morning", exerciseName: "Jumping Jacks & Cardio", sets: 3, reps: 25, muscleGroup: "Full Body", estimatedCalories: 160 },
  { id: "es-14", day: "Friday", sessionId: "s-evening", exerciseName: "Push-ups & Bodyweight Squats", sets: 4, reps: 15, muscleGroup: "Chest, Legs, Core", estimatedCalories: 250 },
  { id: "es-15", day: "Friday", sessionId: "s-night", exerciseName: "Standard Plank & Core Stretch", sets: 3, reps: 60, muscleGroup: "Core, Abs", estimatedCalories: 70 },

  // Saturday
  { id: "es-16", day: "Saturday", sessionId: "s-morning", exerciseName: "Stationary Cycling", sets: 1, reps: 30, muscleGroup: "Cardio", estimatedCalories: 230 },
  { id: "es-17", day: "Saturday", sessionId: "s-evening", exerciseName: "Full Body Dumbbell Circuit", sets: 3, reps: 12, muscleGroup: "Full Body", estimatedCalories: 260 },
  { id: "es-18", day: "Saturday", sessionId: "s-night", exerciseName: "Rest & Foam Rolling", sets: 1, reps: 20, muscleGroup: "Recovery", estimatedCalories: 30 },

  // Sunday
  { id: "es-19", day: "Sunday", sessionId: "s-morning", exerciseName: "Light Walk & Mobility", sets: 1, reps: 25, muscleGroup: "Flexibility", estimatedCalories: 90 },
  { id: "es-20", day: "Sunday", sessionId: "s-evening", exerciseName: "Core Blast (Planks & Crunches)", sets: 3, reps: 20, muscleGroup: "Abs, Core", estimatedCalories: 110 },
  { id: "es-21", day: "Sunday", sessionId: "s-night", exerciseName: "Full Body Stretch", sets: 1, reps: 15, muscleGroup: "Flexibility", estimatedCalories: 40 },
];

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { authId: user.id } });
}

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({
        sessions: DEFAULT_SESSIONS,
        schedule: DEFAULT_EXERCISE_SCHEDULE,
        completions: [],
        stepCount: { [new Date().toISOString().split("T")[0]]: 4500 },
        isGuest: true,
      });
    }

    const routine = await prisma.routine.findFirst({
      where: {
        userId: user.id,
        type: "EXERCISE",
        name: "Weekly Exercise Schedule",
      },
      include: {
        items: true,
      },
    });

    if (!routine || routine.items.length === 0) {
      return NextResponse.json({
        sessions: DEFAULT_SESSIONS,
        schedule: DEFAULT_EXERCISE_SCHEDULE,
        completions: [],
        stepCount: { [new Date().toISOString().split("T")[0]]: 4500 },
        isGuest: false,
      });
    }

    const mainItem = routine.items[0];
    const payload = (mainItem.payload as any) || {};

    const sessions: WorkoutSessionDefinition[] =
      Array.isArray(payload.sessions) && payload.sessions.length > 0
        ? payload.sessions
        : DEFAULT_SESSIONS;

    const schedule: ExerciseScheduleEntry[] = Array.isArray(payload.schedule)
      ? payload.schedule
      : DEFAULT_EXERCISE_SCHEDULE;

    const completions: WorkoutCompletionRecord[] = Array.isArray(payload.completions)
      ? payload.completions
      : [];

    const stepCount: Record<string, number> =
      payload.stepCount && typeof payload.stepCount === "object"
        ? payload.stepCount
        : { [new Date().toISOString().split("T")[0]]: 4500 };

    return NextResponse.json({
      sessions,
      schedule,
      completions,
      stepCount,
      isGuest: false,
    });
  } catch (error) {
    console.error("Error in GET /api/exercise:", error);
    return NextResponse.json(
      {
        sessions: DEFAULT_SESSIONS,
        schedule: DEFAULT_EXERCISE_SCHEDULE,
        completions: [],
        stepCount: {},
        error: "Fallback to defaults",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessions, schedule, completions, stepCount, quickWorkout, quickWorkouts } = body;

    const user = await getAuthUser();

    // Log individual or batch workouts to ActivityLog
    const workoutsToLog: Array<{ exerciseName: string; sets: number; reps: number; caloriesBurned?: number }> = [];
    if (Array.isArray(quickWorkouts)) {
      workoutsToLog.push(...quickWorkouts);
    } else if (quickWorkout && quickWorkout.exerciseName) {
      workoutsToLog.push(quickWorkout);
    }

    if (user && workoutsToLog.length > 0) {
      for (const w of workoutsToLog) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            type: "EXERCISE",
            loggedAt: new Date(),
            payload: {
              exerciseName: w.exerciseName,
              sets: Number(w.sets) || 3,
              reps: Number(w.reps) || 12,
              caloriesBurned: Number(w.caloriesBurned) || 100,
            },
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ success: true, isGuest: true, message: "Saved locally for guest" });
    }

    let routine = await prisma.routine.findFirst({
      where: {
        userId: user.id,
        type: "EXERCISE",
        name: "Weekly Exercise Schedule",
      },
    });

    if (!routine) {
      routine = await prisma.routine.create({
        data: {
          userId: user.id,
          type: "EXERCISE",
          name: "Weekly Exercise Schedule",
          isActive: true,
        },
      });
    }

    const existingItem = await prisma.routineItem.findFirst({
      where: { routineId: routine.id },
    });

    // Deduplicate completions by date + sessionId to avoid accidental duplicate entries
    const rawCompletions: any[] = Array.isArray(completions) ? completions : [];
    const compMap = new Map<string, any>();
    for (const c of rawCompletions) {
      if (!c || !c.date || !c.sessionId) continue;
      const key = `${c.date}|${c.sessionId}`;
      compMap.set(key, c);
    }
    const dedupedCompletions = Array.from(compMap.values());

    const payload = {
      sessions: sessions || DEFAULT_SESSIONS,
      schedule: schedule || DEFAULT_EXERCISE_SCHEDULE,
      completions: dedupedCompletions,
      stepCount: stepCount || {},
      updatedAt: new Date().toISOString(),
    };

    if (existingItem) {
      await prisma.routineItem.update({
        where: { id: existingItem.id },
        data: {
          payload,
          label: "Exercise Routine Configuration",
        },
      });
    } else {
      await prisma.routineItem.create({
        data: {
          routineId: routine.id,
          label: "Exercise Routine Configuration",
          order: 0,
          payload,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Exercise configuration updated" });
  } catch (error) {
    console.error("Error in POST /api/exercise:", error);
    return NextResponse.json({ error: "Failed to update exercise data" }, { status: 500 });
  }
}
