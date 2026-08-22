"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAvailableSlots } from "./getAvailableSlots";
import { createNotification } from "@/lib/notifications";

const bookSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  organizationId: z.string().min(1, "Organization is required"),
  date: z.string().datetime(),
  symptoms: z.string().optional().default(""),
});

export async function bookAppointment(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { doctorId, organizationId, date, symptoms } = bookSchema.parse({
    doctorId: formData.get("doctorId"),
    organizationId: formData.get("organizationId"),
    date: formData.get("date"),
    symptoms: formData.get("symptoms") || "",
  });

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    throw new Error("Invalid appointment date and time format");
  }

  // 1. Get the slot validation data
  const dateStr = appointmentDate.toISOString().split("T")[0];
  const slotFormData = new FormData();
  slotFormData.append("doctorId", doctorId);
  slotFormData.append("organizationId", organizationId);
  slotFormData.append("date", dateStr);

  const { slots } = await getAvailableSlots(slotFormData);

  // 2. Find the slot that matches the requested time
  const pad = (n: number) => n.toString().padStart(2, "0");
  const timeStr = `${pad(appointmentDate.getHours())}:${pad(appointmentDate.getMinutes())}`;
  const slot = slots.find((s) => s.startTime === timeStr);

  if (!slot) {
    throw new Error("Invalid time slot selected.");
  }

  if (!slot.isAvailable) {
    if (slot.isLunch) {
      throw new Error("This time is during the doctor's lunch break. Please select another time.");
    }
    throw new Error("This time slot is already booked. Please select another time.");
  }

  // Check if the patient already has a BOOKED or PENDING appointment with this doctor on this date
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: user.id,
      doctors: { some: { doctorUserId: doctorId } },
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

  // 3. Get or create the queue for that day
  const queueDate = new Date(appointmentDate);
  queueDate.setHours(0, 0, 0, 0);

  let queue = await prisma.appointmentQueue.findUnique({
    where: {
      doctorUserId_organizationId_queueDate: {
        doctorUserId: doctorId,
        organizationId,
        queueDate,
      },
    },
  });

  if (!queue) {
    queue = await prisma.appointmentQueue.create({
      data: {
        doctorUserId: doctorId,
        organizationId,
        queueDate,
        nextSerialNumber: 1,
        currentQueuePosition: 0,
      },
    });
  }

  // 4. Create the appointment with serial number
  const serialNumber = queue.nextSerialNumber;
  await prisma.appointmentQueue.update({
    where: { id: queue.id },
    data: { nextSerialNumber: { increment: 1 } },
  });

  const appointment = await prisma.appointment.create({
    data: {
      organizationId,
      patientId: user.id,
      patientName: user.name,
      patientPhone: user.phone || null,
      patientAge: user.dob
        ? Math.floor((Date.now() - new Date(user.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null,
      patientGender: user.gender || null,
      queueId: queue.id,
      serialNumber,
      queuePosition: serialNumber,
      status: "BOOKED",
      bookingChannel: "SELF_BOOKED",
      bookedByStaffId: user.id,
      bookedSlotTime: appointmentDate,
      estimatedSlotTime: appointmentDate,
      doctors: {
        create: {
          doctorUserId: doctorId,
          role: "PRIMARY",
          status: "CONFIRMED",
          assignedBy: user.id,
        },
      },
    },
    include: {
      organization: { select: { name: true, slug: true } },
      doctors: {
        include: { doctor: { select: { id: true, name: true } } },
      },
    },
  });

  const doctorName = appointment.doctors[0]?.doctor.name ?? "your doctor";
  await Promise.allSettled([
    createNotification({
      userId: user.id,
      title: "Appointment booked",
      message: `Your visit with ${doctorName} is confirmed for ${appointmentDate.toLocaleString()}${symptoms ? ` (${symptoms})` : ""}.`,
      type: "SUCCESS",
      link: "/dashboard/appointments/my",
    }),
    createNotification({
      userId: doctorId,
      title: "New appointment booked",
      message: `${user.name} booked an appointment for ${appointmentDate.toLocaleString()}.`,
      type: "INFO",
      link: "/dashboard/doctor/appointments",
    }),
  ]);

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/appointments/my");
  revalidatePath("/dashboard/doctor/appointments");

  return {
    success: true,
    appointmentId: appointment.id,
    serialNumber,
    status: appointment.status,
    estimatedSlotTime: appointmentDate.toISOString(),
    organizationName: appointment.organization.name,
  };
}
