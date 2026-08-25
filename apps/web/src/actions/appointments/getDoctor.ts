"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const getDoctorSchema = z.object({
  doctorId: z.string().min(1),
});

export type DoctorAffiliationDetail = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationAddress: string | null;
  organizationType: string;
  organizationRating: number;
  organizationReviewCount: number;
  scheduleId: string;
  workingDays: string[];
  startTime: string;
  endTime: string;
  approvalMode: string;
  assumedVisitDurationMinutes: number;
  consultationFee?: number | null;
};

export type DoctorProfileData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string;
  degreeInstitution: string | null;
  graduationYear: number | null;
  bmdcRegistrationNumber: string | null;
  bio: string | null;
  avgRating: number;
  reviewCount: number;
  organizations: DoctorAffiliationDetail[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    verified: boolean;
    authorName: string;
    organizationName: string;
  }>;
  canReview: boolean;
  eligibleOrganizationIdsForReview: string[];
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

export async function getDoctorProfile(formData: FormData): Promise<DoctorProfileData> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { doctorId } = getDoctorSchema.parse({
    doctorId: formData.get("doctorId"),
  });

  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: {
      professions: {
        where: {
          professionType: { code: "DOCTOR" },
        },
        include: {
          doctorCredential: true,
        },
      },
      reviewsReceived: {
        include: {
          author: { select: { name: true } },
          organization: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // 1. Fetch active schedules for this doctor
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorUserId: doctor.id,
      isActive: true,
    },
  });

  // 2. Fetch corresponding organizations
  const orgIds = Array.from(new Set(schedules.map((s) => s.organizationId)));
  const organizations = await prisma.organization.findMany({
    where: {
      id: { in: orgIds },
    },
    include: {
      organizationType: true,
      reviews: {
        select: { rating: true },
      },
    },
  });

  const orgMap = new Map(organizations.map((o) => [o.id, o]));

  const affiliations: DoctorAffiliationDetail[] = [];
  for (const s of schedules) {
    const org = orgMap.get(s.organizationId);
    if (!org) continue;

    const orgReviews = org.reviews || [];
    const orgRating =
      orgReviews.length > 0
        ? orgReviews.reduce((acc, r) => acc + r.rating, 0) / orgReviews.length
        : 0;

    affiliations.push({
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      organizationAddress: org.address,
      organizationType: org.organizationType?.name || "Healthcare Facility",
      organizationRating: orgRating,
      organizationReviewCount: orgReviews.length,
      scheduleId: s.id,
      workingDays: s.workingDays || [],
      startTime: s.startTime,
      endTime: s.endTime,
      approvalMode: s.approvalMode,
      assumedVisitDurationMinutes: s.assumedVisitDurationMinutes || 15,
      consultationFee: s.consultationFee,
    });
  }

  // 3. Compute Doctor Reviews
  const reviews = doctor.reviewsReceived || [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  // 4. Check if current user has an appointment with PRESCRIBED status with this doctor
  const completedAppointments = await prisma.appointment.findMany({
    where: {
      patientId: user.id,
      status: "PRESCRIBED",
      doctors: {
        some: { doctorUserId: doctor.id },
      },
    },
    select: { organizationId: true },
  });

  const eligibleOrgIds = Array.from(new Set(completedAppointments.map((a) => a.organizationId)));

  const cred = doctor.professions[0]?.doctorCredential;

  return {
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    specialization: cred?.specialization || "General Medicine",
    degreeInstitution: cred?.degreeInstitution || null,
    graduationYear: cred?.graduationYear || null,
    bmdcRegistrationNumber: cred?.bmdcRegistrationNumber || null,
    bio: cred?.bio || null,
    avgRating,
    reviewCount: reviews.length,
    organizations: affiliations,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      verified: r.verified,
      authorName: r.author.name,
      organizationName: r.organization.name,
    })),
    canReview: eligibleOrgIds.length > 0,
    eligibleOrganizationIdsForReview: eligibleOrgIds,
  };
}
