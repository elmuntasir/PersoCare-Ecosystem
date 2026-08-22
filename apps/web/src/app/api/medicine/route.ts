import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { CompletionStatus } from "@prisma/client";


// ─────────────────────────────────────────────────────────────
// Types (exported so the page can import them)
// ─────────────────────────────────────────────────────────────

export type MedicineDoseStatus = "PENDING" | "DONE" | "LATE" | "MISSED";

export type MedicineDose = {
  id: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  dosage: string;
  medicineName: string;
  isManualOverride: boolean;
  status: MedicineDoseStatus;
  completedAt: string | null;
};

export type WeeklyDoseEntry = {
  id: string;
  routineItemId: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  date: string;
  status: string;
};

export type PrescriptionMedicineWithTiming = {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  timingInstructions: TimingInstruction[] | null;
  alreadyAdded: boolean;
};

export type TimingInstruction = {
  mealRelation: "PRE_MEAL" | "WITH_MEAL" | "POST_MEAL";
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  dosage?: string;
};

// ─────────────────────────────────────────────────────────────
// Auth helper (same pattern as /api/diet and /api/exercise)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Time helpers
// ─────────────────────────────────────────────────────────────

function parseTimeToDate(timeStr: string, baseDate: Date): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5); // "HH:MM"
}

// ─────────────────────────────────────────────────────────────
// GET – today's doses + weekly completions + prescription meds
// ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({
        todayDoses: [],
        weeklyEntries: [],
        prescriptionMeds: [],
        isGuest: true,
      });
    }

    const now = new Date();

    // Weekly bounds (Monday–Sunday)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Fetch active MEDICINE routine with items + this week's completions
    const medicineRoutine = await prisma.routine.findFirst({
      where: { userId: user.id, type: "MEDICINE", isActive: true },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            completions: {
              where: { date: { gte: monday, lte: sunday } },
            },
          },
        },
      },
    });

    // Build today's doses with computed status
    const todayDoses: MedicineDose[] = (medicineRoutine?.items || []).map((item) => {
      const todayCompletion = item.completions.find(
        (c) => new Date(c.date).toDateString() === now.toDateString()
      );

      let status: MedicineDoseStatus = "PENDING";
      if (todayCompletion) {
        // LATE = completed after the end time window
        if (todayCompletion.completedAt && item.endTime) {
          const endDate = parseTimeToDate(item.endTime, new Date(todayCompletion.completedAt));
          status = todayCompletion.completedAt > endDate ? "LATE" : "DONE";
        } else {
          status = "DONE";
        }
      } else if (item.endTime) {
        const endDate = parseTimeToDate(item.endTime, now);
        if (now > endDate) status = "MISSED";
      }

      const payload = (item.payload as Record<string, unknown>) || {};
      return {
        id: item.id,
        label: item.label,
        startTime: item.startTime,
        endTime: item.endTime,
        dosage: String(payload.dosage ?? ""),
        medicineName: String(payload.medicineName ?? ""),
        isManualOverride: Boolean(payload.isManualOverride),
        status,
        completedAt: todayCompletion?.completedAt?.toISOString() ?? null,
      };
    });

    // Build weekly entries (completions this week)
    const weeklyEntries: WeeklyDoseEntry[] = [];
    for (const item of medicineRoutine?.items || []) {
      for (const comp of item.completions) {
        weeklyEntries.push({
          id: comp.id,
          routineItemId: item.id,
          label: item.label,
          startTime: item.startTime,
          endTime: item.endTime,
          date: comp.date.toISOString(),
          status: comp.status,
        });
      }
    }

    // Fetch prescriptions belonging to this patient
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: user.id },
      include: { medicines: true },
      orderBy: { createdAt: "desc" },
    });

    // Mark which medicines are already in the routine
    const addedIds = new Set(
      (medicineRoutine?.items || []).map((i) => {
        const p = i.payload as Record<string, unknown>;
        return String(p.prescriptionMedicineId ?? "");
      })
    );

    const prescriptionMeds: PrescriptionMedicineWithTiming[] = prescriptions.flatMap((rx) =>
      rx.medicines.map((med) => ({
        id: med.id,
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        timingInstructions: (med.timingInstructions as TimingInstruction[]) ?? null,
        alreadyAdded: addedIds.has(med.id),
      }))
    );

    return NextResponse.json({ todayDoses, weeklyEntries, prescriptionMeds, isGuest: false });
  } catch (error) {
    console.error("GET /api/medicine error:", error);
    return NextResponse.json({
      todayDoses: [],
      weeklyEntries: [],
      prescriptionMeds: [],
      error: "Failed to load",
    });
  }
}

// ─────────────────────────────────────────────────────────────
// POST – action dispatcher
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "addToRoutine":
        return handleAddToRoutine(user.id, body);
      case "markTaken":
        return handleMarkTaken(user.id, body);
      case "editDose":
        return handleEditDose(user.id, body);
      case "deleteDose":
        return handleDeleteDose(user.id, body);
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/medicine error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// Action: Add prescription medicine to MEDICINE routine
// ─────────────────────────────────────────────────────────────

async function handleAddToRoutine(userId: string, body: Record<string, unknown>) {
  const { prescriptionMedicineId } = body as { prescriptionMedicineId: string };
  if (!prescriptionMedicineId) {
    return NextResponse.json({ error: "prescriptionMedicineId required" }, { status: 400 });
  }

  const med = await prisma.prescriptionMedicine.findUnique({
    where: { id: prescriptionMedicineId },
    include: { prescription: true },
  });

  if (!med) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  if (med.prescription.patientId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructions = (med.timingInstructions as TimingInstruction[]) || [];
  if (instructions.length === 0) {
    return NextResponse.json(
      { error: "No timing instructions found. Ask your doctor to configure them." },
      { status: 400 }
    );
  }

  // Fetch food routine for meal-relative timing
  const foodRoutine = await prisma.routine.findFirst({
    where: { userId, type: "FOOD", isActive: true },
    include: { items: true },
  });

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  // Get or create the MEDICINE routine
  let medicineRoutine = await prisma.routine.findFirst({
    where: { userId, type: "MEDICINE", isActive: true },
  });
  if (!medicineRoutine) {
    medicineRoutine = await prisma.routine.create({
      data: { userId, type: "MEDICINE", name: "Daily Medicine Schedule", isActive: true },
    });
  }

  const mealItems = foodRoutine?.items || [];
  const now = new Date();

  const defaultTimes: Record<string, string> = {
    BREAKFAST: settings?.defaultBreakfastTime ?? "08:00",
    LUNCH: settings?.defaultLunchTime ?? "13:00",
    DINNER: settings?.defaultDinnerTime ?? "20:00",
    SNACK: "16:00",
  };

  const createdIds: string[] = [];

  for (const instruction of instructions) {
    const { mealRelation, mealType, dosage: instructionDosage } = instruction;

    let startTime: string;
    let endTime: string;

    const mealItem = mealItems.find((item) =>
      item.label.toLowerCase().includes(mealType.toLowerCase())
    );

    if (mealItem?.startTime && mealItem?.endTime) {
      const mealStart = parseTimeToDate(mealItem.startTime, now);
      const mealEnd = parseTimeToDate(mealItem.endTime, now);

      switch (mealRelation) {
        case "PRE_MEAL":
          startTime = formatTime(addMinutes(mealStart, -30));
          endTime = mealItem.startTime;
          break;
        case "POST_MEAL":
          startTime = mealItem.endTime;
          endTime = formatTime(addMinutes(mealEnd, 30));
          break;
        default: // WITH_MEAL
          startTime = mealItem.startTime;
          endTime = mealItem.endTime;
      }
    } else {
      const base = parseTimeToDate(defaultTimes[mealType] ?? "08:00", now);
      switch (mealRelation) {
        case "PRE_MEAL":
          startTime = formatTime(addMinutes(base, -30));
          endTime = formatTime(base);
          break;
        case "POST_MEAL":
          startTime = formatTime(addMinutes(base, 30));
          endTime = formatTime(addMinutes(base, 60));
          break;
        default:
          startTime = formatTime(base);
          endTime = formatTime(addMinutes(base, 30));
      }
    }

    const dosageValue = instructionDosage || med.dosage;
    const label = `${med.medicineName} (${dosageValue})`;
    const payload = {
      prescriptionMedicineId: med.id,
      dosage: dosageValue,
      medicineName: med.medicineName,
      isManualOverride: false,
      originalTiming: instruction,
    };

    const existing = await prisma.routineItem.findFirst({
      where: {
        routineId: medicineRoutine.id,
        payload: { path: ["prescriptionMedicineId"], equals: med.id },
      },
    });

    if (existing) {
      await prisma.routineItem.update({
        where: { id: existing.id },
        data: { label, startTime, endTime, payload },
      });
      createdIds.push(existing.id);
    } else {
      const agg = await prisma.routineItem.aggregate({
        where: { routineId: medicineRoutine.id },
        _max: { order: true },
      });
      const nextOrder = (agg._max.order ?? -1) + 1;
      const item = await prisma.routineItem.create({
        data: { routineId: medicineRoutine.id, order: nextOrder, label, startTime, endTime, payload },
      });
      createdIds.push(item.id);
    }
  }

  return NextResponse.json({ success: true, createdCount: createdIds.length });
}

// ─────────────────────────────────────────────────────────────
// Action: Mark a dose as taken
// ─────────────────────────────────────────────────────────────

async function handleMarkTaken(userId: string, body: Record<string, unknown>) {
  const { routineItemId, date } = body as { routineItemId: string; date: string };

  const item = await prisma.routineItem.findUnique({
    where: { id: routineItemId },
    include: { routine: true },
  });

  if (!item || item.routine.userId !== userId) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  const now = new Date();
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  // CompletionStatus only has DONE | SKIPPED | NOT_YET in the schema.
  // We always store DONE here; "LATE" is computed at read time by comparing
  // completedAt against endTime — so we return it in the JSON response only.
  const completionStatus = CompletionStatus.DONE;
  const isLate = item.endTime
    ? now > parseTimeToDate(item.endTime, now)
    : false;

  await prisma.routineCompletion.upsert({
    where: { routineItemId_date: { routineItemId, date: dateObj } },
    update: { completedAt: now, status: completionStatus },
    create: { routineItemId, date: dateObj, completedAt: now, status: completionStatus },
  });

  return NextResponse.json({ success: true, status: isLate ? "LATE" : "DONE" });
}

// ─────────────────────────────────────────────────────────────
// Action: Edit a dose (sets isManualOverride = true)
// ─────────────────────────────────────────────────────────────

async function handleEditDose(userId: string, body: Record<string, unknown>) {
  const { routineItemId, label, startTime, endTime, dosage } = body as {
    routineItemId: string;
    label?: string;
    startTime?: string;
    endTime?: string;
    dosage?: string;
  };

  const existing = await prisma.routineItem.findUnique({
    where: { id: routineItemId },
    include: { routine: true },
  });

  if (!existing || existing.routine.userId !== userId) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { ...(existing.payload as Record<string, unknown>), isManualOverride: true };
  if (dosage) payload.dosage = dosage;

  await prisma.routineItem.update({
    where: { id: routineItemId },
    data: {
      ...(label && { label }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      payload,
    },
  });

  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────
// Action: Delete a dose
// ─────────────────────────────────────────────────────────────

async function handleDeleteDose(userId: string, body: Record<string, unknown>) {
  const { routineItemId } = body as { routineItemId: string };

  const existing = await prisma.routineItem.findUnique({
    where: { id: routineItemId },
    include: { routine: true },
  });

  if (!existing || existing.routine.userId !== userId) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  await prisma.routineItem.delete({ where: { id: routineItemId } });
  return NextResponse.json({ success: true });
}
