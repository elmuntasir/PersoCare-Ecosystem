import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

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

const DEFAULT_COURSES: CourseDefinition[] = [
  { id: "c-breakfast", name: "Breakfast", defaultTime: "08:30 AM", order: 0 },
  { id: "c-lunch", name: "Lunch", defaultTime: "01:30 PM", order: 1 },
  { id: "c-dinner", name: "Dinner", defaultTime: "08:30 PM", order: 2 },
];

const DEFAULT_SCHEDULE: MealScheduleEntry[] = [
  // Monday
  { id: "s-1", day: "Monday", courseId: "c-breakfast", foodName: "Oatmeal & Milk", amountGrams: 200 },
  { id: "s-2", day: "Monday", courseId: "c-lunch", foodName: "Chicken breast & Rice", amountGrams: 350 },
  { id: "s-3", day: "Monday", courseId: "c-dinner", foodName: "Rohu Fish Curry & Spinach", amountGrams: 300 },

  // Tuesday
  { id: "s-4", day: "Tuesday", courseId: "c-breakfast", foodName: "Boiled Eggs & Whole Wheat Toast", amountGrams: 150 },
  { id: "s-5", day: "Tuesday", courseId: "c-lunch", foodName: "Lentil Soup & Steamed Rice", amountGrams: 300 },
  { id: "s-6", day: "Tuesday", courseId: "c-dinner", foodName: "Grilled Fish & Mixed Greens", amountGrams: 280 },

  // Wednesday
  { id: "s-7", day: "Wednesday", courseId: "c-breakfast", foodName: "Banana & Almond Smoothie", amountGrams: 250 },
  { id: "s-8", day: "Wednesday", courseId: "c-lunch", foodName: "Beef Steak & Roasted Potatoes", amountGrams: 320 },
  { id: "s-9", day: "Wednesday", courseId: "c-dinner", foodName: "Vegetable Khichdi & Salad", amountGrams: 300 },

  // Thursday
  { id: "s-10", day: "Thursday", courseId: "c-breakfast", foodName: "Chicken egg & Toast", amountGrams: 150 },
  { id: "s-11", day: "Thursday", courseId: "c-lunch", foodName: "Beef (lean, raw) & Rice", amountGrams: 300 },
  { id: "s-12", day: "Thursday", courseId: "c-dinner", foodName: "Mango & Yogurt (plain)", amountGrams: 250 },

  // Friday (Current day demo)
  { id: "s-13", day: "Friday", courseId: "c-breakfast", foodName: "Chicken egg & Whole Wheat Toast", amountGrams: 150 },
  { id: "s-14", day: "Friday", courseId: "c-lunch", foodName: "Chicken breast & White Rice", amountGrams: 350 },
  { id: "s-15", day: "Friday", courseId: "c-dinner", foodName: "Rohu Curry & Spinach", amountGrams: 300 },

  // Saturday
  { id: "s-16", day: "Saturday", courseId: "c-breakfast", foodName: "Pancake & Honey with Berries", amountGrams: 180 },
  { id: "s-17", day: "Saturday", courseId: "c-lunch", foodName: "Mutton Curry & Basmati Rice", amountGrams: 350 },
  { id: "s-18", day: "Saturday", courseId: "c-dinner", foodName: "Clear Chicken Soup & Crackers", amountGrams: 250 },

  // Sunday
  { id: "s-19", day: "Sunday", courseId: "c-breakfast", foodName: "Greek Yogurt & Granola", amountGrams: 200 },
  { id: "s-20", day: "Sunday", courseId: "c-lunch", foodName: "Grilled Salmon & Broccoli", amountGrams: 320 },
  { id: "s-21", day: "Sunday", courseId: "c-dinner", foodName: "Mixed Veggie Stew & Bread", amountGrams: 280 },
];

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const user = await prisma.user.findUnique({
      where: { authId: authUser.id },
    });

    return user;
  } catch (error) {
    console.error("Auth check failed in /api/diet:", error);
    return null;
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({
        courses: DEFAULT_COURSES,
        schedule: DEFAULT_SCHEDULE,
        completions: [],
        isGuest: true,
      });
    }

    const routine = await prisma.routine.findFirst({
      where: {
        userId: user.id,
        type: "FOOD",
        name: "Weekly Meal Schedule",
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!routine || routine.items.length === 0) {
      return NextResponse.json({
        courses: DEFAULT_COURSES,
        schedule: DEFAULT_SCHEDULE,
        completions: [],
        waterIntake: {},
        isGuest: false,
      });
    }

    const mainItem = routine.items[0];
    const payload = (mainItem.payload as any) || {};

    const courses: CourseDefinition[] =
      Array.isArray(payload.courses) && payload.courses.length > 0
        ? payload.courses
        : DEFAULT_COURSES;

    const schedule: MealScheduleEntry[] = Array.isArray(payload.schedule)
      ? payload.schedule
      : DEFAULT_SCHEDULE;

    const completions: MealCompletionRecord[] = Array.isArray(payload.completions)
      ? payload.completions
      : [];

    const waterIntake: Record<string, number> =
      payload.waterIntake && typeof payload.waterIntake === "object"
        ? payload.waterIntake
        : {};

    return NextResponse.json({
      courses,
      schedule,
      completions,
      waterIntake,
      isGuest: false,
    });
  } catch (error) {
    console.error("Error in GET /api/diet:", error);
    return NextResponse.json(
      {
        courses: DEFAULT_COURSES,
        schedule: DEFAULT_SCHEDULE,
        completions: [],
        waterIntake: {},
        error: "Fallback to defaults",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courses, schedule, completions, waterIntake, quickLog, quickLogs } = body;

    const user = await getAuthUser();

    // Support single quickLog or batch quickLogs
    const logsToSave: Array<{ foodId: string; amountGrams: number }> = [];
    if (Array.isArray(quickLogs)) {
      logsToSave.push(...quickLogs);
    } else if (quickLog && quickLog.foodId) {
      logsToSave.push(quickLog);
    }

    if (user && logsToSave.length > 0) {
      for (const log of logsToSave) {
        if (log.foodId) {
          await prisma.foodLogEntry.create({
            data: {
              userId: user.id,
              foodId: log.foodId,
              amountGrams: Number(log.amountGrams) || 100,
            },
          });
        }
      }
    }

    if (!user) {
      return NextResponse.json({ success: true, isGuest: true, message: "Saved locally for guest" });
    }

    let routine = await prisma.routine.findFirst({
      where: {
        userId: user.id,
        type: "FOOD",
        name: "Weekly Meal Schedule",
      },
    });

    if (!routine) {
      routine = await prisma.routine.create({
        data: {
          userId: user.id,
          type: "FOOD",
          name: "Weekly Meal Schedule",
          isActive: true,
        },
      });
    }

    const existingItem = await prisma.routineItem.findFirst({
      where: { routineId: routine.id },
    });

    // Deduplicate completions by date + courseId to avoid accidental duplicate entries
    const rawCompletions: any[] = Array.isArray(completions) ? completions : [];
    const compMap = new Map<string, any>();
    for (const c of rawCompletions) {
      if (!c || !c.date || !c.courseId) continue;
      const key = `${c.date}|${c.courseId}`;
      // Keep the most recent entry for a key (later in array overrides earlier)
      compMap.set(key, c);
    }
    const dedupedCompletions = Array.from(compMap.values());

    const payload = {
      courses: courses || DEFAULT_COURSES,
      schedule: schedule || DEFAULT_SCHEDULE,
      completions: dedupedCompletions,
      waterIntake: waterIntake || {},
      updatedAt: new Date().toISOString(),
    };

    if (existingItem) {
      await prisma.routineItem.update({
        where: { id: existingItem.id },
        data: {
          payload,
          label: "Diet Plan Configuration",
        },
      });
    } else {
      await prisma.routineItem.create({
        data: {
          routineId: routine.id,
          order: 0,
          label: "Diet Plan Configuration",
          payload,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Diet configuration updated" });
  } catch (error) {
    console.error("Error in POST /api/diet:", error);
    return NextResponse.json({ error: "Failed to update diet data" }, { status: 500 });
  }
}
