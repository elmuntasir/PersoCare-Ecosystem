import { NextResponse } from "next/server";

export type ExerciseItem = {
  id: string;
  name: string;
  category: "Strength" | "Cardio" | "Flexibility" | "Core" | "Calisthenics";
  muscleGroup: string;
  benefits: string;
  calPerRepKg: number; // kcal per rep per kg (for repetition based)
  calPerMinKg: number; // kcal per min per kg (for time based)
  defaultReps: number;
  defaultSets: number;
};

export const EXERCISE_DATABASE: ExerciseItem[] = [
  {
    id: "ex-pushups",
    name: "Push-ups",
    category: "Calisthenics",
    muscleGroup: "Chest, Triceps, Core",
    benefits: "Upper body strength, core stability",
    calPerRepKg: 0.0055,
    calPerMinKg: 0.09,
    defaultReps: 15,
    defaultSets: 3,
  },
  {
    id: "ex-squats",
    name: "Bodyweight Squats",
    category: "Strength",
    muscleGroup: "Quadriceps, Glutes, Hamstrings",
    benefits: "Lower body power, knee & hip mobility",
    calPerRepKg: 0.0065,
    calPerMinKg: 0.085,
    defaultReps: 20,
    defaultSets: 3,
  },
  {
    id: "ex-pullups",
    name: "Pull-ups / Chin-ups",
    category: "Calisthenics",
    muscleGroup: "Latissimus Dorsi, Biceps, Upper Back",
    benefits: "Back width, grip strength, posture",
    calPerRepKg: 0.0085,
    calPerMinKg: 0.10,
    defaultReps: 8,
    defaultSets: 3,
  },
  {
    id: "ex-bench-press",
    name: "Barbell Bench Press",
    category: "Strength",
    muscleGroup: "Pectorals, Anterior Deltoids, Triceps",
    benefits: "Compound upper body pushing power",
    calPerRepKg: 0.0075,
    calPerMinKg: 0.095,
    defaultReps: 10,
    defaultSets: 4,
  },
  {
    id: "ex-deadlift",
    name: "Deadlift",
    category: "Strength",
    muscleGroup: "Erector Spinae, Glutes, Hamstrings, Traps",
    benefits: "Full body pulling power, spinal resilience",
    calPerRepKg: 0.0095,
    calPerMinKg: 0.11,
    defaultReps: 8,
    defaultSets: 3,
  },
  {
    id: "ex-dumbbell-rows",
    name: "Dumbbell Rows",
    category: "Strength",
    muscleGroup: "Rhomboids, Lats, Biceps",
    benefits: "Upper back thickness and shoulder balance",
    calPerRepKg: 0.006,
    calPerMinKg: 0.08,
    defaultReps: 12,
    defaultSets: 3,
  },
  {
    id: "ex-plank",
    name: "Standard Plank",
    category: "Core",
    muscleGroup: "Rectus Abdominis, Transverse Abdominis",
    benefits: "Core endurance, prevents lower back pain",
    calPerRepKg: 0.003,
    calPerMinKg: 0.07,
    defaultReps: 60, // seconds
    defaultSets: 3,
  },
  {
    id: "ex-lunges",
    name: "Walking Lunges",
    category: "Strength",
    muscleGroup: "Quads, Glutes, Calves",
    benefits: "Unilateral leg strength & balance",
    calPerRepKg: 0.006,
    calPerMinKg: 0.085,
    defaultReps: 12,
    defaultSets: 3,
  },
  {
    id: "ex-bicep-curls",
    name: "Dumbbell Bicep Curls",
    category: "Strength",
    muscleGroup: "Biceps Brachii, Brachialis",
    benefits: "Arm pulling strength & elbow stability",
    calPerRepKg: 0.004,
    calPerMinKg: 0.06,
    defaultReps: 12,
    defaultSets: 3,
  },
  {
    id: "ex-shoulder-press",
    name: "Overhead Shoulder Press",
    category: "Strength",
    muscleGroup: "Deltoids, Upper Chest, Triceps",
    benefits: "Overhead pushing strength, posture",
    calPerRepKg: 0.0065,
    calPerMinKg: 0.08,
    defaultReps: 10,
    defaultSets: 3,
  },
  {
    id: "ex-running",
    name: "Running / Jogging",
    category: "Cardio",
    muscleGroup: "Cardiovascular, Calves, Legs",
    benefits: "Aerobic capacity, fat loss, heart health",
    calPerRepKg: 0.015,
    calPerMinKg: 0.13,
    defaultReps: 20, // mins
    defaultSets: 1,
  },
  {
    id: "ex-cycling",
    name: "Stationary / Road Cycling",
    category: "Cardio",
    muscleGroup: "Quads, Glutes, Heart & Lungs",
    benefits: "Low-impact endurance & knee health",
    calPerRepKg: 0.012,
    calPerMinKg: 0.11,
    defaultReps: 30, // mins
    defaultSets: 1,
  },
  {
    id: "ex-jumping-jacks",
    name: "Jumping Jacks",
    category: "Cardio",
    muscleGroup: "Full Body, Calves, Shoulders",
    benefits: "Warm-up, lymphatic flow, conditioning",
    calPerRepKg: 0.0045,
    calPerMinKg: 0.10,
    defaultReps: 30,
    defaultSets: 3,
  },
  {
    id: "ex-burpees",
    name: "Burpees",
    category: "Cardio",
    muscleGroup: "Full Body, Chest, Core, Quads",
    benefits: "Metabolic conditioning & explosive power",
    calPerRepKg: 0.012,
    calPerMinKg: 0.14,
    defaultReps: 10,
    defaultSets: 3,
  },
  {
    id: "ex-yoga",
    name: "Yoga & Dynamic Stretching",
    category: "Flexibility",
    muscleGroup: "Hamstrings, Hip Flexors, Spine",
    benefits: "Mobility, blood flow, stress reduction",
    calPerRepKg: 0.002,
    calPerMinKg: 0.045,
    defaultReps: 15, // mins
    defaultSets: 1,
  },
];

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();

  try {
    const cached = await prisma.cachedExercise.findMany({
      where: q
        ? {
            name: {
              contains: q,
              mode: "insensitive",
            },
          }
        : undefined,
      take: 20,
      orderBy: { popularity: "desc" },
    });

    if (cached.length > 0) {
      const mapped = cached.map((ex) => ({
        id: ex.id,
        name: ex.name,
        category: (ex.type?.charAt(0).toUpperCase() + ex.type?.slice(1)) as any,
        muscleGroup: ex.muscle || "Full Body",
        benefits: ex.instructions || "Fitness and endurance",
        calPerRepKg: 0.007,
        calPerMinKg: ((ex.metBase || 5) * 3.5) / 200,
        defaultReps: 12,
        defaultSets: 3,
      }));
      return NextResponse.json(mapped);
    }
  } catch (err) {
    console.error("Error fetching cached exercises:", err);
  }

  if (!q) {
    return NextResponse.json(EXERCISE_DATABASE);
  }

  const filtered = EXERCISE_DATABASE.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q) ||
      ex.category.toLowerCase().includes(q)
  );

  return NextResponse.json(filtered);
}
