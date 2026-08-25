"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

const verifySchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  tranId: z.string().min(1, "Transaction ID is required"),
  status: z.enum(["success", "fail", "cancel"]),
});

export async function verifyPayment(formData: FormData) {
  const data = verifySchema.parse({
    appointmentId: formData.get("appointmentId"),
    tranId: formData.get("tranId"),
    status: formData.get("status"),
  });

  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
    include: {
      queue: true,
      doctors: {
        include: {
          doctor: { select: { id: true, name: true } },
        },
      },
      organization: {
        select: { id: true, name: true, slug: true },
      },
      patient: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!appointment) {
    throw new Error("Appointment record not found");
  }

  if (data.status === "success") {
    // If already marked as paid & booked, return existing details
    if (appointment.paymentStatus === "PAID" && appointment.status === "BOOKED" && appointment.queueId) {
      return {
        success: true,
        appointmentId: appointment.id,
        serialNumber: appointment.serialNumber,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        paymentAmount: appointment.paymentAmount,
        consultationFee: appointment.consultationFee,
        organizationName: appointment.organization.name,
        doctorName: appointment.doctors[0]?.doctor.name || "Doctor",
        bookedSlotTime: appointment.bookedSlotTime?.toISOString(),
      };
    }

    if (!appointment.doctors[0]?.doctorUserId || !appointment.bookedSlotTime) {
      throw new Error("Appointment is missing doctor or schedule details");
    }

    // 1. Get or create the queue for the appointment date and doctor
    const queueDate = new Date(appointment.bookedSlotTime);
    queueDate.setHours(0, 0, 0, 0);

    let queue = await prisma.appointmentQueue.findUnique({
      where: {
        doctorUserId_organizationId_queueDate: {
          doctorUserId: appointment.doctors[0].doctorUserId,
          organizationId: appointment.organizationId,
          queueDate,
        },
      },
    });

    if (!queue) {
      queue = await prisma.appointmentQueue.create({
        data: {
          doctorUserId: appointment.doctors[0].doctorUserId,
          organizationId: appointment.organizationId,
          queueDate,
          nextSerialNumber: 1,
          currentQueuePosition: 0,
        },
      });
    }

    // 2. Assign serial number atomically
    const serialNumber = queue.nextSerialNumber;
    await prisma.appointmentQueue.update({
      where: { id: queue.id },
      data: { nextSerialNumber: { increment: 1 } },
    });

    // 3. Update appointment to BOOKED and PAID
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        queueId: queue.id,
        serialNumber,
        queuePosition: serialNumber,
        status: "BOOKED",
        paymentStatus: "PAID",
      },
    });

    // 4. Send in-app notifications
    const doctorName = appointment.doctors[0]?.doctor?.name || "your doctor";
    const apptDateStr = appointment.bookedSlotTime.toLocaleString();

    await Promise.allSettled([
      createNotification({
        userId: appointment.patientId,
        title: "Appointment & Payment Confirmed",
        message: `Your booking with Dr. ${doctorName} is confirmed (Serial #${serialNumber}) for ${apptDateStr}. Platform fee paid: ${appointment.platformFee || 10} BDT.`,
        type: "SUCCESS",
        link: "/dashboard/appointments/my",
      }),
      createNotification({
        userId: appointment.doctors[0].doctorUserId,
        title: "New Appointment Booked",
        message: `${appointment.patientName || "Patient"} booked an appointment for ${apptDateStr} (Serial #${serialNumber}).`,
        type: "INFO",
        link: "/dashboard/doctor/appointments",
      }),
    ]);

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/appointments/my");
    revalidatePath("/dashboard/doctor/appointments");

    return {
      success: true,
      appointmentId: updatedAppointment.id,
      serialNumber,
      status: updatedAppointment.status,
      paymentStatus: updatedAppointment.paymentStatus,
      paymentAmount: updatedAppointment.paymentAmount,
      consultationFee: updatedAppointment.consultationFee,
      organizationName: appointment.organization.name,
      doctorName,
      bookedSlotTime: appointment.bookedSlotTime.toISOString(),
    };
  } else {
    // Payment failed or was cancelled
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        paymentStatus: data.status === "cancel" ? "FAILED" : "FAILED",
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledReason:
          data.status === "cancel"
            ? "Payment cancelled by patient"
            : "Payment failed during SSLCommerz processing",
      },
    });

    return {
      success: false,
      status: "CANCELLED",
      paymentStatus: "FAILED",
      reason: data.status === "cancel" ? "Payment Cancelled" : "Payment Failed",
    };
  }
}
