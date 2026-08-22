"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

export type PatientAppointmentItem = {
  id: string;
  serialNumber: number | null;
  queuePosition: number | null;
  currentQueuePosition: number;
  status: string;
  requestedAt: string;
  bookedSlotTime: string | null;
  estimatedSlotTime: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string | null;
  } | null;
  prescriptionId: string | null;
  canReview: boolean;
  hasReviewed: boolean;
};

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

export async function getMyAppointments(): Promise<PatientAppointmentItem[]> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: user.id,
    },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, address: true },
      },
      queue: {
        select: { currentQueuePosition: true, nextSerialNumber: true },
      },
      doctors: {
        select: {
          doctorUserId: true,
          role: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  const doctorUserIds = Array.from(
    new Set(appointments.flatMap((a) => a.doctors.map((d) => d.doctorUserId)))
  );

  const [doctorUsers, existingReviews] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: doctorUserIds } },
      select: {
        id: true,
        name: true,
        professions: {
          where: { professionType: { code: "DOCTOR" } },
          include: { doctorCredential: true },
        },
      },
    }),
    prisma.review.findMany({
      where: { authorId: user.id },
      select: { organizationId: true, subjectId: true },
    }),
  ]);

  const doctorMap = new Map(doctorUsers.map((d) => [d.id, d]));
  const reviewSet = new Set(existingReviews.map((r) => `${r.organizationId}_${r.subjectId}`));

  return appointments.map((appt) => {
    const primaryDoctorId = appt.doctors[0]?.doctorUserId;
    const doc = primaryDoctorId ? doctorMap.get(primaryDoctorId) : null;
    const specialization = doc?.professions[0]?.doctorCredential?.specialization || "General";

    const hasReviewed = primaryDoctorId
      ? reviewSet.has(`${appt.organizationId}_${primaryDoctorId}`)
      : false;

    const canReview = appt.status === "PRESCRIBED" && !hasReviewed;

    return {
      id: appt.id,
      serialNumber: appt.serialNumber,
      queuePosition: appt.queuePosition,
      currentQueuePosition: appt.queue?.currentQueuePosition || 0,
      status: appt.status,
      requestedAt: appt.requestedAt.toISOString(),
      bookedSlotTime: appt.bookedSlotTime ? appt.bookedSlotTime.toISOString() : null,
      estimatedSlotTime: appt.estimatedSlotTime ? appt.estimatedSlotTime.toISOString() : null,
      organization: {
        id: appt.organization.id,
        name: appt.organization.name,
        slug: appt.organization.slug,
        address: appt.organization.address,
      },
      doctor: doc
        ? {
            id: doc.id,
            name: doc.name,
            specialization,
          }
        : null,
      prescriptionId: appt.prescriptionId,
      canReview,
      hasReviewed,
    };
  });
}

const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().optional(),
});

export async function cancelAppointment(formData: FormData) {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { appointmentId, reason } = cancelAppointmentSchema.parse({
    appointmentId: formData.get("appointmentId"),
    reason: formData.get("reason") || "Cancelled by patient",
  });

  const appt = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: user.id,
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctors: { include: { doctor: { select: { id: true, name: true } } } },
    },
  });

  if (!appt) {
    throw new Error("Appointment not found");
  }

  if (appt.status === "PRESCRIBED") {
    throw new Error("Cannot cancel a completed visit with prescription");
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledReason: reason,
    },
  });

  const doctorId = appt.doctors[0]?.doctorUserId;
  const doctorName = appt.doctors[0]?.doctor.name ?? "your doctor";
  await Promise.allSettled([
    doctorId
      ? createNotification({
          userId: doctorId,
          title: "Appointment cancelled",
          message: `${user.name} cancelled the appointment scheduled with ${doctorName}.`,
          type: "WARNING",
          link: "/dashboard/doctor/appointments",
        })
      : Promise.resolve(),
    createNotification({
      userId: user.id,
      title: "Appointment cancelled",
      message: `Your appointment with ${doctorName} has been cancelled.`,
      type: "INFO",
      link: "/dashboard/appointments/my",
    }),
  ]);

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/appointments/my");

  return { success: true };
}
