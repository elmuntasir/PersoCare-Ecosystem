import { NextRequest, NextResponse } from "next/server";
import { verifySSLCommerzSignature } from "@/lib/sslcommerz";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries()) as Record<string, string>;

    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    if (!storePassword) {
      console.error("[IPN] SSLCOMMERZ_STORE_PASSWORD is not configured");
      return new NextResponse("Store configuration error", { status: 500 });
    }

    // Verify signature
    if (!verifySSLCommerzSignature(data, storePassword)) {
      console.warn("[IPN] Invalid SSLCommerz signature received", data);
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const status = data.status;
    const tranId = data.tran_id;

    if (!tranId) {
      return new NextResponse("Missing tran_id", { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { paymentTransactionId: tranId },
      include: {
        doctors: true,
      },
    });

    if (!appointment) {
      console.warn(`[IPN] No appointment found for tran_id: ${tranId}`);
      return new NextResponse("Appointment not found", { status: 404 });
    }

    if (status === "VALID" || status === "VALIDATED") {
      // If not yet confirmed, confirm and assign queue serial
      if (appointment.paymentStatus !== "PAID" || !appointment.queueId) {
        const queueDate = new Date(appointment.bookedSlotTime || new Date());
        queueDate.setHours(0, 0, 0, 0);

        const doctorUserId = appointment.doctors[0]?.doctorUserId;
        if (doctorUserId) {
          let queue = await prisma.appointmentQueue.findUnique({
            where: {
              doctorUserId_organizationId_queueDate: {
                doctorUserId,
                organizationId: appointment.organizationId,
                queueDate,
              },
            },
          });

          if (!queue) {
            queue = await prisma.appointmentQueue.create({
              data: {
                doctorUserId,
                organizationId: appointment.organizationId,
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

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              queueId: queue.id,
              serialNumber,
              queuePosition: serialNumber,
              status: "BOOKED",
              paymentStatus: "PAID",
            },
          });

          // Send notification
          await createNotification({
            userId: appointment.patientId,
            title: "Payment Confirmed via IPN",
            message: `Your booking is confirmed with Serial #${serialNumber}.`,
            type: "SUCCESS",
            link: "/dashboard/appointments/my",
          });
        }
      }
    } else if (status === "FAILED" || status === "CANCELLED") {
      if (appointment.paymentStatus !== "PAID") {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            paymentStatus: "FAILED",
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledReason: `SSLCommerz IPN status: ${status}`,
          },
        });
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[IPN] Error handling IPN webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
