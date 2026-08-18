"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const getOrgSchema = z.object({
  slug: z.string().min(1),
});

export type OrgDoctorSchedule = {
  scheduleId: string;
  startTime: string;
  endTime: string;
  workingDays: string[];
  approvalMode: string;
  assumedVisitDurationMinutes: number;
};

export type OrgShowcaseDoctor = {
  id: string;
  name: string;
  email: string | null;
  specialization: string;
  degreeInstitution: string | null;
  graduationYear: number | null;
  bmdcNumber: string | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
  schedules: OrgDoctorSchedule[];
};

export type OrgReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  verified: boolean;
  author: {
    name: string;
  };
  subject: {
    name: string;
  };
};

export type OrganizationShowcaseData = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  specialties: string[];
  status: string;
  verificationStatus: string;
  createdAt: string;
  organizationType: {
    code: string;
    name: string;
  };
  avgRating: number;
  ratingDistribution: number[];
  reviewCount: number;
  reviews: OrgReviewItem[];
  doctors: OrgShowcaseDoctor[];
  departments: Array<{ id: string; name: string; description: string | null; doctorCount: number }>;
  logo?: string | null;
  motto?: string | null;
  vision?: string | null;
  mission?: string | null;
  establishedYear?: number | null;
  patientServedCount?: number | null;
  canReview: boolean;
  eligibleDoctorIdsForReview: string[];
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

export async function getOrganizationBySlug(formData: FormData): Promise<OrganizationShowcaseData> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { slug } = getOrgSchema.parse({
    slug: formData.get("slug"),
  });

  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      organizationType: true,
      reviews: {
        where: { verified: true },
        include: {
          author: { select: { name: true } },
          subject: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      departments: {
        include: {
          employees: {
            where: { role: "DOCTOR", isActive: true },
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  // 1. Fetch all active schedules for this organization
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      organizationId: organization.id,
      isActive: true,
    },
  });

  // 1b. Fetch all active employee doctors for this organization
  const doctorEmployees = await prisma.organizationEmployee.findMany({
    where: {
      organizationId: organization.id,
      role: "DOCTOR",
      isActive: true,
    },
    select: {
      userId: true,
    },
  });

  // 2. Combine doctor IDs from both active schedules and employee roster
  const scheduleDoctorIds = schedules.map((s) => s.doctorUserId);
  const employeeDoctorIds = doctorEmployees.map((e) => e.userId);
  const doctorIds = Array.from(new Set([...scheduleDoctorIds, ...employeeDoctorIds]));

  const doctorUsers = await prisma.user.findMany({
    where: {
      id: { in: doctorIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
      professions: {
        where: {
          professionType: { code: "DOCTOR" },
        },
        include: {
          doctorCredential: true,
        },
      },
      reviewsReceived: {
        select: { rating: true },
      },
    },
  });

  // 3. Assemble doctor list
  const doctorList: OrgShowcaseDoctor[] = [];
  const deptsSet = new Set<string>(organization.specialties || []);

  for (const docUser of doctorUsers) {
    const docSchedules = schedules.filter((s) => s.doctorUserId === docUser.id);
    const cred = docUser.professions[0]?.doctorCredential;
    const specialization = cred?.specialization || "General Medicine";

    if (specialization) {
      deptsSet.add(specialization);
    }

    const reviews = docUser.reviewsReceived || [];
    const avgDocRating =
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    doctorList.push({
      id: docUser.id,
      name: docUser.name,
      email: docUser.email,
      specialization,
      degreeInstitution: cred?.degreeInstitution || null,
      graduationYear: cred?.graduationYear || null,
      bmdcNumber: cred?.bmdcRegistrationNumber || null,
      bio: cred?.bio || null,
      rating: avgDocRating,
      reviewCount: reviews.length,
      schedules: docSchedules.map((s) => ({
        scheduleId: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        workingDays: s.workingDays || [],
        approvalMode: s.approvalMode,
        assumedVisitDurationMinutes: s.assumedVisitDurationMinutes || 15,
      })),
    });
  }

  // 4. Calculate org review metrics & rating distribution
  const reviewsList = organization.reviews || [];
  const avgRating =
    reviewsList.length > 0
      ? reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length
      : 0;

  // Rating distribution: [1-star, 2-star, 3-star, 4-star, 5-star] (index 0 = 1 star)
  const ratingDistribution = [0, 0, 0, 0, 0];
  for (const r of reviewsList) {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating - 1]++;
    }
  }

  // 5. Check if current user can leave a review
  // Rule: Patient must have an appointment with status PRESCRIBED at this org with no reviews yet
  const completedAppointments = await prisma.appointment.findMany({
    where: {
      patientId: user.id,
      organizationId: organization.id,
      status: "PRESCRIBED",
      reviews: { none: {} },
    },
    include: {
      doctors: true,
    },
  });

  const eligibleDoctorIds = Array.from(
    new Set(
      completedAppointments.flatMap((a) => a.doctors.map((d) => d.doctorUserId))
    )
  );

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    address: organization.address,
    latitude: organization.latitude,
    longitude: organization.longitude,
    specialties: organization.specialties || [],
    status: organization.status,
    verificationStatus: organization.verificationStatus,
    createdAt: organization.createdAt.toISOString(),
    organizationType: {
      code: organization.organizationType?.code || "GENERAL",
      name: organization.organizationType?.name || "Healthcare Facility",
    },
    avgRating,
    ratingDistribution,
    reviewCount: reviewsList.length,
    reviews: reviewsList.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      verified: r.verified,
      author: { name: r.author.name },
      subject: { name: r.subject.name },
    })),
    doctors: doctorList,
    departments: (organization.departments || []).map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description || null,
      doctorCount: d.employees ? d.employees.length : 0,
    })),
    logo: organization.logo || null,
    motto: organization.motto || null,
    vision: organization.vision || null,
    mission: organization.mission || null,
    establishedYear: organization.establishedYear || null,
    patientServedCount: organization.patientServedCount || null,
    canReview: completedAppointments.length > 0,
    eligibleDoctorIdsForReview: eligibleDoctorIds,
  };
}
