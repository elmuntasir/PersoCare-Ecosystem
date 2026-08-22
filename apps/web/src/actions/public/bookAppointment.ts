"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/actions/appointments/getAvailableSlots";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const publicBookSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  organizationId: z.string().min(1, "Organization is required"),
  date: z.string().datetime(),
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: z.string().min(1, "Phone is required"),
  patientAge: z.coerce.number().int().min(1).max(150),
  patientGender: z.string().optional().default(""),
  symptoms: z.string().optional().default(""),
});

function buildGuestEmail(phone: string) {
  const safePhone = phone.replace(/[^a-zA-Z0-9]/g, "");
  return `guest-${safePhone || "patient"}-${Date.now()}@public.persocare.local`;
}

export async function publicBookAppointment(formData: FormData) {
  const data = publicBookSchema.parse({
    doctorId: formData.get("doctorId"),
    organizationId: formData.get("organizationId"),
    date: formData.get("date"),
    patientName: formData.get("patientName"),
    patientPhone: formData.get("patientPhone"),
    patientAge: formData.get("patientAge"),
    patientGender: formData.get("patientGender") || "",
    symptoms: formData.get("symptoms") || "",
  });

  const appointmentDate = new Date(data.date);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new Error("Invalid appointment date and time format");
  }

  const dateStr = appointmentDate.toISOString().split("T")[0];
  const slotFormData = new FormData();
  slotFormData.append("doctorId", data.doctorId);
  slotFormData.append("organizationId", data.organizationId);
  slotFormData.append("date", dateStr);

  const { slots } = await getAvailableSlots(slotFormData);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const timeStr = `${pad(appointmentDate.getHours())}:${pad(appointmentDate.getMinutes())}`;
  const slot = slots.find((item) => item.startTime === timeStr);

  if (!slot) {
    throw new Error("Invalid time slot selected.");
  }

  if (!slot.isAvailable) {
    if (slot.isLunch) {
      throw new Error("This time is during the doctor's lunch break. Please select another time.");
    }
    throw new Error("This time slot is already booked. Please select another time.");
  }

  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      organizationId: data.organizationId,
      doctors: { some: { doctorUserId: data.doctorId } },
      status: { in: ["BOOKED", "PENDING"] },
      bookedSlotTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (existingAppointment) {
    throw new Error("You already have an appointment with this doctor on this day.");
  }

  const queueDate = new Date(appointmentDate);
  queueDate.setHours(0, 0, 0, 0);

  let queue = await prisma.appointmentQueue.findUnique({
    where: {
      doctorUserId_organizationId_queueDate: {
        doctorUserId: data.doctorId,
        organizationId: data.organizationId,
        queueDate,
      },
    },
  });

  if (!queue) {
    queue = await prisma.appointmentQueue.create({
      data: {
        doctorUserId: data.doctorId,
        organizationId: data.organizationId,
        queueDate,
        nextSerialNumber: 1,
        currentQueuePosition: 0,
      },
    });
  }

  const serialNumber = queue.nextSerialNumber;
  await prisma.appointmentQueue.update({
    where: { id: queue.id },
    data: { nextSerialNumber: { increment: 1 } },
  });

  const guestUser = await prisma.user.create({
    data: {
      name: data.patientName,
      email: buildGuestEmail(data.patientPhone),
      phone: data.patientPhone,
      gender: data.patientGender || null,
      authId: null,
    },
  });

  const patientAge = Number.isFinite(data.patientAge) ? data.patientAge : null;

  const appointment = await prisma.appointment.create({
    data: {
      organizationId: data.organizationId,
      patientId: guestUser.id,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      patientAge,
      patientGender: data.patientGender || null,
      queueId: queue.id,
      serialNumber,
      queuePosition: serialNumber,
      status: "BOOKED",
      bookingChannel: "PUBLIC_FORM",
      bookedByStaffId: null,
      bookedSlotTime: appointmentDate,
      estimatedSlotTime: appointmentDate,
      doctors: {
        create: {
          doctorUserId: data.doctorId,
          role: "PRIMARY",
          status: "CONFIRMED",
          assignedBy: null,
        },
      },
    },
    include: {
      organization: { select: { name: true, slug: true } },
    },
  });

  revalidatePath("/public-book");
  revalidatePath("/dashboard/doctor/appointments");
  revalidatePath("/dashboard/appointments");

  return {
    success: true,
    appointmentId: appointment.id,
    serialNumber,
    status: appointment.status,
    organizationName: appointment.organization.name,
  };
}
