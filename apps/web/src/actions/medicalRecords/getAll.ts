"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function getPatientMedicalRecords() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Prescriptions from appointments (only PRESCRIBED)
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: user.id,
      status: "PRESCRIBED",
    },
    include: {
      prescriptions: {
        include: {
          medicines: true,
          items: true,
        },
      },
      doctors: {
        include: {
          doctor: {
            select: {
              name: true,
              professions: {
                where: { status: "VERIFIED" },
                take: 1,
                include: {
                  professionType: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
      organization: { select: { name: true, logo: true } },
    },
    orderBy: { bookedSlotTime: "desc" },
  });

  const prescriptions = appointments.flatMap((a) => {
    const rxList = a.prescriptions || [];
    return rxList.map((rx) => ({
      id: rx.id,
      date: a.bookedSlotTime?.toISOString() || rx.createdAt.toISOString(),
      doctorName: a.doctors[0]?.doctor.name || "Unknown Doctor",
      doctorSpecialization:
        a.doctors[0]?.doctor.professions[0]?.professionType.name || undefined,
      organizationName: a.organization.name,
      organizationLogo: a.organization.logo || null,
      patientName: user.name || "Patient",
      patientAge: user.dob
        ? Math.floor((Date.now() - new Date(user.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : undefined,
      patientGender: user.gender || undefined,
      medicines: rx.medicines,
      items: rx.items,
      clinicalNotes: {
        patientStatedIssues: (rx as any).patientStatedIssues ?? undefined,
        doctorDiscovery: (rx as any).doctorDiscovery ?? undefined,
      },
    }));
  });

  // 2. Clinical Measurements
  const measurements = await prisma.clinicalMeasurement.findMany({
    where: { patientId: user.id },
    orderBy: { measuredAt: "desc" },
  });

  // 3. Health History Events
  const healthEvents = await prisma.healthHistoryEvent.findMany({
    where: { userId: user.id },
    include: { documents: true },
    orderBy: { occurredAt: "desc" },
  });

  // 4. Vaccinations
  const vaccinations = await prisma.vaccination.findMany({
    where: { patientId: user.id },
    orderBy: { administeredAt: "desc" },
  });

  // 5. Medical Documents
  let documents: Array<{
    id: string;
    userId: string;
    title: string;
    description: string | null;
    fileUrl: string;
    documentType: string;
    uploadedAt: Date;
    appointmentId: string | null;
    isVerified: boolean;
  }> = [];

  try {
    if ("medicalDocument" in prisma && typeof (prisma as any).medicalDocument?.findMany === "function") {
      documents = await (prisma as any).medicalDocument.findMany({
        where: { userId: user.id },
        orderBy: { uploadedAt: "desc" },
      });
    }
  } catch {
    documents = [];
  }

  return {
    prescriptions,
    measurements: measurements.map((m) => ({
      ...m,
      measuredAt: m.measuredAt.toISOString(),
    })),
    healthEvents: healthEvents.map((h) => ({
      ...h,
      occurredAt: h.occurredAt?.toISOString() || null,
      createdAt: h.createdAt.toISOString(),
      documents: h.documents.map((d) => ({
        ...d,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
    })),
    vaccinations: vaccinations.map((v) => ({
      ...v,
      administeredAt: v.administeredAt?.toISOString() || null,
    })),
    documents: documents.map((d) => ({
      ...d,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  };
}
