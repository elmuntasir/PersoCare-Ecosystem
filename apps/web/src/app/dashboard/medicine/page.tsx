import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MedicineLogClient } from "@/components/medicine/MedicineLogClient";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Medicine Log - PersoCare",
  description: "Track your daily medications, stay on schedule, and integrate prescriptions seamlessly.",
};

export default async function MedicineLogPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = todayDate.toISOString().split("T")[0];

  // Fetch user settings
  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { showConfirmModal: true },
  });

  // Fetch MEDICINE routine with today's completions
  const medicineRoutine = await prisma.routine.findFirst({
    where: {
      userId: user.id,
      type: "MEDICINE",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      items: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          label: true,
          startTime: true,
          endTime: true,
          payload: true,
          isExternal: true,
          completions: {
            where: { date: todayDate },
            select: {
              completedAt: true,
              status: true,
            },
          },
        },
      },
    },
  });

  // Compute status for each item
  const medicineItems = (medicineRoutine?.items || []).map((item) => {
    const completion = item.completions[0];
    let status: "PENDING" | "DONE" | "LATE" | "MISSED" = "PENDING";

    const endTimeParts = item.endTime?.split(":").map(Number) || [23, 59];
    const endTimeDate = new Date(todayDate);
    endTimeDate.setHours(endTimeParts[0], endTimeParts[1], 0, 0);

    if (completion) {
      status = completion.completedAt && completion.completedAt > endTimeDate ? "LATE" : "DONE";
    } else {
      if (now > endTimeDate) {
        status = "MISSED";
      }
    }

    const payload = (item.payload as Record<string, unknown>) || {};

    return {
      id: item.id,
      label: item.label,
      startTime: item.startTime,
      endTime: item.endTime,
      payload,
      prescriptionMedicineId: payload.prescriptionMedicineId ? String(payload.prescriptionMedicineId) : null,
      status,
      dosage: String(payload.dosage || ""),
      medicineName: String(payload.medicineName || item.label),
      isExternal: Boolean(item.isExternal || payload.isExternal),
      hasTimingInstructions: Boolean(payload.originalTiming),
    };
  });

  // Fetch prescriptions that haven't been added to routine
  const prescriptionsRaw = await prisma.prescriptionMedicine.findMany({
    where: {
      prescription: {
        patientId: user.id,
      },
      addedToRoutine: false,
    },
    include: {
      prescription: {
        include: {
          doctor: { select: { name: true } },
        },
      },
    },
    orderBy: {
      prescription: {
        createdAt: "desc",
      },
    },
  });

  const prescriptions = prescriptionsRaw.map((rx) => ({
    id: rx.id,
    medicineName: rx.medicineName,
    dosage: rx.dosage,
    frequency: rx.frequency,
    duration: rx.duration,
    timingInstructions: (rx.timingInstructions as unknown as Array<{
      mealRelation: "PRE_MEAL" | "WITH_MEAL" | "POST_MEAL";
      mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
      dosage?: string;
    }>) || null,
    prescription: {
      doctor: rx.prescription.doctor,
    },
  }));

  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] font-bold tracking-[-0.01em] mb-1">
            Medicine Log
          </h1>
          <p className="font-body text-[var(--ink-soft)] text-sm md:text-base">
            Track your daily medications and stay on schedule with meal-based smart timing.
          </p>
        </div>

        <MedicineLogClient
          initialItems={medicineItems}
          initialPrescriptions={prescriptions}
          today={todayStr}
          showConfirmModal={settings?.showConfirmModal ?? true}
          routineId={medicineRoutine?.id}
        />
      </div>
    </main>
  );
}
