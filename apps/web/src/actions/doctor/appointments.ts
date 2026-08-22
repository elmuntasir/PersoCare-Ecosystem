"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getVerifiedDoctorUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const doctorProfession = await prisma.userProfession.findFirst({
    where: {
      userId: user.id,
      professionType: { code: "DOCTOR" },
      status: "VERIFIED",
    },
  });

  if (!doctorProfession) throw new Error("You are not a verified doctor");
  return user;
}

// ─── Get Doctor Appointments ──────────────────────────────────────────────────

const filtersSchema = z.object({
  organizationId: z.string().optional(),
  status: z
    .enum(["PENDING", "BOOKED", "PRESCRIBED", "CANCELLED", "DID_NOT_VISIT"])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  patientName: z.string().optional(),
});

export async function getDoctorAppointments(formData: FormData) {
  const user = await getVerifiedDoctorUser();

  const { organizationId, status, dateFrom, dateTo, patientName } =
    filtersSchema.parse({
      organizationId: formData.get("organizationId") || undefined,
      status: formData.get("status") || undefined,
      dateFrom: formData.get("dateFrom") || undefined,
      dateTo: formData.get("dateTo") || undefined,
      patientName: formData.get("patientName") || undefined,
    });

  return prisma.appointment.findMany({
    where: {
      doctors: { some: { doctorUserId: user.id } },
      ...(organizationId ? { organizationId } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo
        ? {
            bookedSlotTime: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
      ...(patientName
        ? {
            OR: [
              { patient: { name: { contains: patientName, mode: "insensitive" as const } } },
              { patientName: { contains: patientName, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      organization: { select: { id: true, name: true } },
      queue: true,
      doctors: {
        include: { doctor: { select: { id: true, name: true } } },
      },
      prescriptions: true,
    },
    orderBy: { bookedSlotTime: "asc" },
  });
}

// ─── Get Single Appointment ───────────────────────────────────────────────────

export async function getAppointmentById(appointmentId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          dob: true,
          gender: true,
        },
      },
      organization: true,
      queue: true,
      doctors: {
        include: { doctor: { select: { id: true, name: true } } },
      },
      prescriptions: {
        include: { medicines: true, items: true },
        take: 1,
      },
    },
  });

  if (!appointment) throw new Error("Appointment not found");

  const isAssigned = appointment.doctors.some((d) => d.doctorUserId === user.id);
  if (!isAssigned) throw new Error("Unauthorized");

  return appointment;
}

// ─── Create Prescription ──────────────────────────────────────────────────────

const createPrescriptionSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  organizationId: z.string(),
  medicines: z.array(
    z.object({
      medicineName: z.string().min(1),
      dosage: z.string().min(1),
      frequency: z.string().min(1),
      duration: z.string().min(1),
      drugProfile: z
        .object({
          brandId: z.string().optional(),
          slug: z.string().optional(),
          url: z.string().optional(),
          brandName: z.string().optional(),
          company: z.string().optional(),
          genericName: z.string().optional(),
          rxnormRxcui: z.string().optional(),
          rxnormName: z.string().optional(),
          highlights: z.array(z.string()).optional(),
        })
        .optional()
        .nullable(),
      timingInstructions: z
        .array(
          z.object({
            mealRelation: z.enum(["PRE_MEAL", "WITH_MEAL", "POST_MEAL"]),
            mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
            dosage: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  items: z
    .array(
      z.object({
        category: z.enum(["diet", "habit", "medicalTest", "supplement"]),
        value: z.string().min(1),
      })
    )
    .optional(),
  patientStatedIssues: z.string().optional(),
  doctorDiscovery: z.string().optional(),
});

export async function createPrescription(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const validated = createPrescriptionSchema.parse({
    appointmentId: formData.get("appointmentId"),
    patientId: formData.get("patientId"),
    doctorId: formData.get("doctorId"),
    organizationId: formData.get("organizationId"),
    medicines: JSON.parse((formData.get("medicines") as string) || "[]"),
    items: JSON.parse((formData.get("items") as string) || "[]"),
    patientStatedIssues: formData.get("patientStatedIssues") || "",
    doctorDiscovery: formData.get("doctorDiscovery") || "",
  });

  // Verify doctor is assigned to appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: validated.appointmentId },
    include: {
      patient: { select: { id: true, name: true } },
      doctors: { include: { doctor: { select: { id: true, name: true } } } },
    },
  });
  if (!appointment) throw new Error("Appointment not found");
  if (!appointment.doctors.some((d) => d.doctorUserId === user.id))
    throw new Error("Unauthorized");

  // Prevent duplicate prescriptions
  const existing = await prisma.prescription.findUnique({
    where: { appointmentId: validated.appointmentId },
  });
  if (existing) throw new Error("Prescription already exists for this appointment");

  const prescription = await prisma.prescription.create({
    data: {
      appointmentId: validated.appointmentId,
      organizationId: validated.organizationId,
      patientId: validated.patientId,
      doctorId: validated.doctorId,
      clinicalNotes: {
        patientStatedIssues: validated.patientStatedIssues ?? "",
        doctorDiscovery: validated.doctorDiscovery ?? "",
      },
    },
  });

  // Create medicines with timing instructions
  for (const med of validated.medicines) {
    const drugMetadata = med.drugProfile
      ? {
          source: "MEDEX",
          brandId: med.drugProfile.brandId ?? null,
          slug: med.drugProfile.slug ?? null,
          url: med.drugProfile.url ?? null,
          brandName: med.drugProfile.brandName ?? null,
          company: med.drugProfile.company ?? null,
          genericName: med.drugProfile.genericName ?? null,
          rxnormRxcui: med.drugProfile.rxnormRxcui ?? null,
          rxnormName: med.drugProfile.rxnormName ?? null,
          highlights: med.drugProfile.highlights ?? [],
        }
      : null;

    await prisma.prescriptionMedicine.create({
      data: {
        prescriptionId: prescription.id,
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        medexBrandId: med.drugProfile?.brandId,
        medexSlug: med.drugProfile?.slug,
        medexUrl: med.drugProfile?.url,
        genericName: med.drugProfile?.genericName,
        rxnormRxcui: med.drugProfile?.rxnormRxcui,
        rxnormName: med.drugProfile?.rxnormName,
        drugMetadata: drugMetadata ? (drugMetadata as any) : undefined,
        timingInstructions: med.timingInstructions || [],
        addedToRoutine: false,
      },
    });
  }

  // Create items
  if (validated.items && validated.items.length > 0) {
    await prisma.prescriptionItem.createMany({
      data: validated.items.map((item) => ({
        prescriptionId: prescription.id,
        category: item.category,
        value: item.value,
      })),
    });
  }

  // Update appointment status
  await prisma.appointment.update({
    where: { id: validated.appointmentId },
    data: { status: "PRESCRIBED" },
  });

  const patientName = appointment.patientName || appointment.patient?.name || "Guest patient";
  const doctorName = user.name;
  const appointmentLink = `/dashboard/doctor/appointments/${validated.appointmentId}`;
  await Promise.allSettled([
    createNotification({
      userId: validated.patientId,
      title: "Prescription issued",
      message: `Dr. ${doctorName} has added your prescription for ${patientName}.`,
      type: "SUCCESS",
      link: "/dashboard/records",
    }),
    createNotification({
      userId: validated.doctorId,
      title: "Prescription saved",
      message: `Your prescription for ${patientName} has been stored successfully.`,
      type: "INFO",
      link: appointmentLink,
    }),
  ]);

  revalidatePath("/dashboard/doctor/appointments");
  revalidatePath(`/dashboard/doctor/appointments/${validated.appointmentId}`);
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard/medicine");
  revalidatePath("/medicine-log");

  return { success: true, prescriptionId: prescription.id };
}
