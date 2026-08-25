"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";
import { initiateSSLCommerzPayment } from "@/lib/sslcommerz";

const PLATFORM_FEE = Number(process.env.PLATFORM_FEE_AMOUNT) || 10;

const schema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  date: z.string().datetime(),
  patientName: z.string().optional(),
  patientPhone: z.string().optional(),
  patientAge: z.number().optional(),
  patientGender: z.string().optional(),
  symptoms: z.string().optional(),
  referencePrescriptionId: z.string().optional(),
});

export async function initiateAppointmentPayment(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const rawAge = formData.get("patientAge");
  const parsedAge =
    rawAge !== null && rawAge !== "" && !Number.isNaN(Number(rawAge))
      ? Number(rawAge)
      : undefined;

  const data = schema.parse({
    scheduleId: formData.get("scheduleId"),
    doctorId: formData.get("doctorId"),
    organizationId: formData.get("organizationId"),
    date: formData.get("date"),
    patientName: (formData.get("patientName") as string) || undefined,
    patientPhone: (formData.get("patientPhone") as string) || undefined,
    patientAge: parsedAge,
    patientGender: (formData.get("patientGender") as string) || undefined,
    symptoms: (formData.get("symptoms") as string) || undefined,
    referencePrescriptionId:
      (formData.get("referencePrescriptionId") as string) || undefined,
  });

  // 1. Fetch consultation fee from doctor schedule for display & reference
  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: data.scheduleId },
    select: { consultationFee: true, doctorUserId: true },
  });
  if (!schedule) throw new Error("Doctor schedule not found");
  const consultationFee = schedule.consultationFee ?? 0;

  // 2. Create pending appointment record
  const appointmentDate = new Date(data.date);
  const appointment = await prisma.appointment.create({
    data: {
      organizationId: data.organizationId,
      patientId: user.id,
      status: "PENDING",
      bookingChannel: "SELF_BOOKED",
      bookedByStaffId: user.id,
      bookedSlotTime: appointmentDate,
      estimatedSlotTime: appointmentDate,
      patientName: data.patientName || user.name,
      patientPhone: data.patientPhone || user.phone || null,
      patientAge:
        data.patientAge ??
        (user.dob
          ? Math.floor(
              (Date.now() - new Date(user.dob).getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            )
          : null),
      patientGender: data.patientGender || user.gender || null,
      paymentStatus: "PENDING",
      consultationFee: consultationFee,
      platformFee: PLATFORM_FEE,
      paymentAmount: PLATFORM_FEE,
      prescriptionId: data.referencePrescriptionId || null,
      doctors: {
        create: {
          doctorUserId: data.doctorId,
          role: "PRIMARY",
          status: "CONFIRMED",
          assignedBy: user.id,
        },
      },
    },
    include: {
      organization: { select: { name: true } },
    },
  });

  // 3. Initiate SSLCommerz payment session (for platform fee)
  const tranId = `PERSOCARE_${appointment.id}_${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const paymentData = {
    tranId,
    amount: PLATFORM_FEE,
    currency: "BDT",
    customerName: user.name || "Patient",
    customerEmail: user.email,
    customerPhone: user.phone || "01700000000",
    successUrl: `${appUrl}/payment/success?appointmentId=${appointment.id}&tranId=${tranId}`,
    failUrl: `${appUrl}/payment/fail?appointmentId=${appointment.id}&tranId=${tranId}`,
    cancelUrl: `${appUrl}/payment/cancel?appointmentId=${appointment.id}&tranId=${tranId}`,
    ipnUrl: `${appUrl}/api/payment/ipn`,
  };

  const sslResponse = await initiateSSLCommerzPayment(paymentData);

  // Save transaction ID on appointment
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { paymentTransactionId: tranId },
  });

  return {
    success: true,
    redirectUrl: sslResponse.GatewayPageURL,
    appointmentId: appointment.id,
    platformFee: PLATFORM_FEE,
    consultationFee,
  };
}
