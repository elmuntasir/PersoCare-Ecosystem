"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const publicBookingContextSchema = z.object({
  orgId: z.string().min(1, "Organization is required"),
  doctorId: z.string().optional(),
});

export type PublicBookingDoctor = {
  id: string;
  name: string;
  specialization: string;
  schedules: Array<{
    scheduleId: string;
    startTime: string;
    endTime: string;
    workingDays: string[];
    approvalMode: string;
    assumedVisitDurationMinutes: number;
  }>;
};

export type PublicBookingContext = {
  organization: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    logo: string | null;
    specialties: string[];
  };
  selectedDoctor: PublicBookingDoctor | null;
  doctors: PublicBookingDoctor[];
};

export async function getPublicBookingContext(formData: FormData): Promise<PublicBookingContext> {
  const { orgId, doctorId } = publicBookingContextSchema.parse({
    orgId: formData.get("orgId"),
    doctorId: formData.get("doctorId") || undefined,
  });

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      logo: true,
      specialties: true,
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      organizationId: organization.id,
      isActive: true,
    },
    select: {
      id: true,
      doctorUserId: true,
      startTime: true,
      endTime: true,
      workingDays: true,
      approvalMode: true,
      assumedVisitDurationMinutes: true,
    },
  });

  const doctorIds = Array.from(new Set(schedules.map((schedule) => schedule.doctorUserId)));
  const doctors = await prisma.user.findMany({
    where: {
      id: { in: doctorIds },
    },
    select: {
      id: true,
      name: true,
      professions: {
        where: {
          professionType: { code: "DOCTOR" },
        },
        include: {
          doctorCredential: true,
        },
      },
    },
  });

  const doctorMap = new Map(
    doctors.map((doctor) => [
      doctor.id,
      {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.professions[0]?.doctorCredential?.specialization || "General Medicine",
        schedules: [] as PublicBookingDoctor["schedules"],
      },
    ])
  );

  for (const schedule of schedules) {
    const doctor = doctorMap.get(schedule.doctorUserId);
    if (!doctor) continue;

    doctor.schedules.push({
      scheduleId: schedule.id,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      workingDays: schedule.workingDays || [],
      approvalMode: schedule.approvalMode,
      assumedVisitDurationMinutes: schedule.assumedVisitDurationMinutes || 15,
    });
  }

  const doctorList = Array.from(doctorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const selectedDoctor = doctorId ? doctorMap.get(doctorId) || null : null;

  return {
    organization,
    selectedDoctor,
    doctors: doctorList,
  };
}
