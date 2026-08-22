"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CompletionStatus } from "@prisma/client";

// ─── Helpers ───────────────────────────────────────────────

function parseTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

// ─── 1. Add Prescription to Routine Action ──────────────────

const addPrescriptionToRoutineSchema = z.object({
  prescriptionMedicineId: z.string(),
});

export async function addPrescriptionToRoutineAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { prescriptionMedicineId } = addPrescriptionToRoutineSchema.parse({
    prescriptionMedicineId: formData.get("prescriptionMedicineId"),
  });

  // 1. Fetch prescription medicine with timing instructions
  const prescriptionMedicine = await prisma.prescriptionMedicine.findUnique({
    where: { id: prescriptionMedicineId },
    include: { prescription: true },
  });

  if (!prescriptionMedicine) throw new Error("Prescription medicine not found");
  if (prescriptionMedicine.prescription.patientId !== user.id) {
    throw new Error("Unauthorized");
  }
  if (prescriptionMedicine.addedToRoutine) {
    throw new Error("Already added to your routine");
  }

  const instructions = (prescriptionMedicine.timingInstructions as Array<{
    mealRelation: "PRE_MEAL" | "WITH_MEAL" | "POST_MEAL";
    mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
    dosage?: string;
  }>) || [];

  if (!instructions || instructions.length === 0) {
    throw new Error("No timing instructions found. Please ask your doctor to add them.");
  }

  // 2. Fetch user's food routine (meal schedule)
  const foodRoutine = await prisma.routine.findFirst({
    where: { userId: user.id, type: "FOOD", isActive: true },
    include: { items: true },
  });

  // 3. Fetch user settings for fallback times
  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  // 4. Get or create MEDICINE routine
  let medicineRoutine = await prisma.routine.findFirst({
    where: { userId: user.id, type: "MEDICINE", isActive: true },
  });

  if (!medicineRoutine) {
    medicineRoutine = await prisma.routine.create({
      data: {
        userId: user.id,
        type: "MEDICINE",
        name: "Daily Medicine Schedule",
        isActive: true,
      },
    });
  }

  // 5. Map meal types to actual meal times
  const defaultTimes = {
    BREAKFAST: settings?.defaultBreakfastTime || "08:00",
    LUNCH: settings?.defaultLunchTime || "13:00",
    DINNER: settings?.defaultDinnerTime || "20:00",
    SNACK: "16:00",
  };

  const createdItems = [];

  for (const instruction of instructions) {
    const { mealRelation, mealType, dosage } = instruction;

    // Find matching meal item
    const mealItem = foodRoutine?.items.find((item) =>
      item.label.toLowerCase().includes(mealType.toLowerCase())
    );
    let startTime: string;
    let endTime: string;

    if (mealItem && mealItem.startTime && mealItem.endTime) {
      const mealStart = parseTime(mealItem.startTime);
      const mealEnd = parseTime(mealItem.endTime);

      switch (mealRelation) {
        case "PRE_MEAL":
          const preStart = addMinutes(mealStart, -30);
          startTime = formatTime(preStart);
          endTime = formatTime(mealStart);
          break;
        case "WITH_MEAL":
          startTime = mealItem.startTime;
          endTime = mealItem.endTime;
          break;
        case "POST_MEAL":
          const postEnd = addMinutes(mealEnd, 30);
          startTime = formatTime(mealEnd);
          endTime = formatTime(postEnd);
          break;
        default:
          throw new Error(`Unknown mealRelation: ${mealRelation}`);
      }
    } else {
      // Fallback to default times
      const defaultTime = defaultTimes[mealType as keyof typeof defaultTimes] || "08:00";
      const dt = parseTime(defaultTime);
      const endDt = addMinutes(dt, 30);
      startTime = formatTime(dt);
      endTime = formatTime(endDt);
    }

    // 6. Build payload with prescription link
    const payload = {
      prescriptionMedicineId: prescriptionMedicine.id,
      dosage: dosage || prescriptionMedicine.dosage,
      medicineName: prescriptionMedicine.medicineName,
      isExternal: false,
      originalTiming: instruction,
    };

    // 7. Create RoutineItem
    const maxOrder = await prisma.routineItem.aggregate({
      where: { routineId: medicineRoutine.id },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const item = await prisma.routineItem.create({
      data: {
        routineId: medicineRoutine.id,
        order: nextOrder,
        label: `${prescriptionMedicine.medicineName} (${dosage || prescriptionMedicine.dosage})`,
        startTime,
        endTime,
        payload,
        isExternal: false,
      },
    });

    createdItems.push(item);
  }

  // 8. Mark prescription as added to routine
  await prisma.prescriptionMedicine.update({
    where: { id: prescriptionMedicineId },
    data: { addedToRoutine: true },
  });

  revalidatePath("/dashboard/medicine");
  revalidatePath("/medicine-log");
  revalidatePath("/prescriptions");

  return { success: true, createdCount: createdItems.length };
}

// ─── 2. Manual Medication Entry Action ──────────────────────

const addManualMedicineSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

export async function addManualMedicineAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const data = addManualMedicineSchema.parse({
    medicineName: formData.get("medicineName"),
    dosage: formData.get("dosage"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    frequency: formData.get("frequency") || undefined,
    duration: formData.get("duration") || undefined,
    notes: formData.get("notes") || undefined,
  });

  // Get or create MEDICINE routine
  let medicineRoutine = await prisma.routine.findFirst({
    where: { userId: user.id, type: "MEDICINE", isActive: true },
  });

  if (!medicineRoutine) {
    medicineRoutine = await prisma.routine.create({
      data: {
        userId: user.id,
        type: "MEDICINE",
        name: "Daily Medicine Schedule",
        isActive: true,
      },
    });
  }

  // If no times provided, set default
  const startTime = data.startTime || "09:00";
  const endTime = data.endTime || "10:00";

  const maxOrder = await prisma.routineItem.aggregate({
    where: { routineId: medicineRoutine.id },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const item = await prisma.routineItem.create({
    data: {
      routineId: medicineRoutine.id,
      order: nextOrder,
      label: `${data.medicineName} (${data.dosage})`,
      startTime,
      endTime,
      isExternal: true,
      payload: {
        medicineName: data.medicineName,
        dosage: data.dosage,
        frequency: data.frequency || "As needed",
        duration: data.duration || "Ongoing",
        notes: data.notes || "",
        isExternal: true,
        externalPrescribed: true,
      },
    },
  });

  revalidatePath("/dashboard/medicine");
  revalidatePath("/medicine-log");
  return { success: true, itemId: item.id };
}

// ─── 3. Mark Medicine Taken Action ──────────────────────────

const markMedicineTakenSchema = z.object({
  routineItemId: z.string(),
  date: z.string().optional(),
});

export async function markMedicineTakenAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { routineItemId, date } = markMedicineTakenSchema.parse({
    routineItemId: formData.get("routineItemId"),
    date: formData.get("date") || undefined,
  });

  const item = await prisma.routineItem.findUnique({
    where: { id: routineItemId },
    include: { routine: true },
  });

  if (!item || item.routine.userId !== user.id) {
    throw new Error("Medicine not found or unauthorized");
  }

  const now = new Date();
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  let isLate = false;
  if (item.endTime) {
    const [endH, endM] = item.endTime.split(":").map(Number);
    const endDateTime = new Date(targetDate);
    endDateTime.setHours(endH, endM, 0, 0);
    isLate = now > endDateTime;
  }

  await prisma.routineCompletion.upsert({
    where: {
      routineItemId_date: {
        routineItemId,
        date: targetDate,
      },
    },
    update: {
      completedAt: now,
      status: CompletionStatus.DONE,
    },
    create: {
      routineItemId,
      date: targetDate,
      completedAt: now,
      status: CompletionStatus.DONE,
    },
  });

  revalidatePath("/dashboard/medicine");
  revalidatePath("/medicine-log");

  return { success: true, status: isLate ? "LATE" : "DONE" };
}

// ─── 4. Update User Settings Modal Preference ───────────────

export async function updateUserSettingsModalAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const showConfirmModal = formData.get("showConfirmModal") === "true";

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { showConfirmModal },
    create: {
      userId: user.id,
      showConfirmModal,
    },
  });

  revalidatePath("/dashboard/medicine");
  revalidatePath("/medicine-log");
  return { success: true };
}
