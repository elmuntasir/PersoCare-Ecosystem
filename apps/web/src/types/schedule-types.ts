export type CourseDefinition = {
  id: string;
  name: string;
  defaultTime: string; // e.g. "08:30 AM"
  order: number;
};

export type MealScheduleEntry = {
  id: string;
  day: string;
  courseId: string;
  foodName: string;
  amountGrams: number;
};

export type MealCompletionRecord = {
  date: string; // YYYY-MM-DD
  courseId: string;
  confirmedAt: string; // "08:25 AM"
  status?: "DONE" | "LATE" | "MISSED";
};

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
