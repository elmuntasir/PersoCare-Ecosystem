"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

export async function getReviewableDoctors(organizationId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: user.id,
      organizationId,
      status: "PRESCRIBED",
      reviews: { none: {} },
    },
    include: {
      doctors: {
        include: {
          doctor: { select: { id: true, name: true } },
        },
      },
    },
  });

  const doctorMap = new Map<string, { id: string; name: string; appointmentId: string }>();
  for (const appt of appointments) {
    for (const doc of appt.doctors) {
      if (!doctorMap.has(doc.doctorUserId)) {
        doctorMap.set(doc.doctorUserId, {
          id: doc.doctorUserId,
          name: doc.doctor?.name || "Doctor",
          appointmentId: appt.id,
        });
      }
    }
  }

  return Array.from(doctorMap.values());
}

const submitReviewSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  subjectId: z.string().min(1, "Doctor is required"),
  appointmentId: z.string().optional().nullable(),
  rating: z.coerce.number().min(1, "Minimum rating is 1").max(5, "Maximum rating is 5"),
  comment: z.string().optional().default(""),
});

export async function submitReview(formData: FormData) {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { organizationId, subjectId, appointmentId, rating, comment } = submitReviewSchema.parse({
    organizationId: formData.get("organizationId"),
    subjectId: formData.get("subjectId"),
    appointmentId: formData.get("appointmentId") || null,
    rating: formData.get("rating"),
    comment: formData.get("comment") || "",
  });

  // If appointmentId is not provided, find the most recent completed appointment with this doctor at this org
  let targetAppointmentId = appointmentId;
  if (!targetAppointmentId) {
    const recentAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: user.id,
        organizationId,
        doctors: { some: { doctorUserId: subjectId } },
        status: "PRESCRIBED",
        reviews: { none: {} },
      },
      orderBy: { bookedSlotTime: "desc" },
      select: { id: true },
    });

    if (recentAppointment) {
      targetAppointmentId = recentAppointment.id;
    } else {
      throw new Error(
        "No completed appointment found to review. You must have a completed checkup to leave a review."
      );
    }
  }

  // Verify the appointment belongs to this user and is PRESCRIBED
  const appointment = await prisma.appointment.findUnique({
    where: { id: targetAppointmentId },
    include: { reviews: true },
  });

  if (!appointment || appointment.patientId !== user.id) {
    throw new Error("Invalid appointment");
  }
  if (appointment.status !== "PRESCRIBED") {
    throw new Error("Appointment not completed");
  }
  if (appointment.reviews.length > 0) {
    throw new Error("You already reviewed this appointment");
  }

  const review = await prisma.review.create({
    data: {
      organizationId,
      authorId: user.id,
      subjectId,
      appointmentId: targetAppointmentId,
      rating,
      comment: comment.trim() || null,
      verified: true,
    },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/doctor/${subjectId}`);

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  if (org) {
    revalidatePath(`/dashboard/appointments/organization/${org.slug}`);
  }

  return { success: true, reviewId: review.id };
}
