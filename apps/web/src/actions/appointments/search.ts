"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().optional().default(""),
  organizationType: z.string().optional().default(""),
  department: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchOrganizationResult = {
  id: string;
  name: string;
  slug: string;
  type: string;
  typeCode: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  reviewCount: number;
  specialties: string[];
  doctorsCount: number;
};

export type DoctorAffiliatedOrg = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  workingDays: string[];
  startTime: string;
  endTime: string;
  approvalMode: string;
  scheduleId?: string;
  consultationFee?: number | null;
};

export type SearchDoctorResult = {
  id: string;
  name: string;
  specialization: string | null;
  degreeInstitution: string | null;
  bmdcNumber: string | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
  organizations: DoctorAffiliatedOrg[];
};

export type SearchAppointmentsResult = {
  organizations: SearchOrganizationResult[];
  doctors: SearchDoctorResult[];
  availableDepartments: string[];
  availableOrgTypes: { code: string; name: string }[];
  pagination: {
    total: number;
    totalOrgs: number;
    totalDoctors: number;
    page: number;
    totalPages: number;
  };
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

export async function searchAppointments(formData: FormData): Promise<SearchAppointmentsResult> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { query, organizationType, department, page, limit } = searchSchema.parse({
    query: formData.get("query") || "",
    organizationType: formData.get("organizationType") || "",
    department: formData.get("department") || "",
    page: formData.get("page") || 1,
    limit: formData.get("limit") || 20,
  });

  const trimmedQuery = query.trim();
  const trimmedDept = department.trim();
  const skip = (page - 1) * limit;

  // ─────────────────────────────────────────────────────────────
  // 1. Available Filter Meta (for Quick Filter Pills & Dropdowns)
  // ─────────────────────────────────────────────────────────────
  const [orgTypes, allCredentials] = await Promise.all([
    prisma.organizationType.findMany({
      where: { isActive: true },
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.doctorCredential.findMany({
      where: { specialization: { not: null } },
      select: { specialization: true },
      distinct: ["specialization"],
    }),
  ]);

  const rawDepts = allCredentials
    .map((c) => c.specialization?.trim())
    .filter((s): s is string => Boolean(s && s.length > 0));
  const availableDepartments = Array.from(new Set(rawDepts)).sort();

  // ─────────────────────────────────────────────────────────────
  // 2. Search Organizations
  // ─────────────────────────────────────────────────────────────
  const orgWhere: any = {
    verificationStatus: "verified",
    status: "ACTIVE",
  };

  if (trimmedQuery) {
    orgWhere.OR = [
      { name: { contains: trimmedQuery, mode: "insensitive" } },
      { slug: { contains: trimmedQuery, mode: "insensitive" } },
      { address: { contains: trimmedQuery, mode: "insensitive" } },
      { specialties: { has: trimmedQuery } },
    ];
  }

  if (organizationType) {
    orgWhere.organizationType = { code: organizationType };
  }

  if (trimmedDept) {
    const matchingDoctorProfessions = await prisma.userProfession.findMany({
      where: {
        professionType: { code: "DOCTOR" },
        doctorCredential: {
          specialization: { contains: trimmedDept, mode: "insensitive" },
        },
      },
      select: { userId: true },
    });

    const matchingDoctorUserIds = matchingDoctorProfessions.map((p) => p.userId);

    const matchingSchedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorUserId: { in: matchingDoctorUserIds },
        isActive: true,
      },
      select: { organizationId: true },
    });

    const orgIdsFromDept = Array.from(new Set(matchingSchedules.map((s) => s.organizationId)));

    if (orgWhere.OR) {
      orgWhere.AND = [
        {
          OR: [
            { specialties: { has: trimmedDept } },
            { id: { in: orgIdsFromDept } },
          ],
        },
      ];
    } else {
      orgWhere.OR = [
        { specialties: { has: trimmedDept } },
        { id: { in: orgIdsFromDept } },
      ];
    }
  }

  const [orgs, orgCount] = await Promise.all([
    prisma.organization.findMany({
      where: orgWhere,
      include: {
        organizationType: true,
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.organization.count({ where: orgWhere }),
  ]);

  const orgIds = orgs.map((o) => o.id);
  const [activeSchedulesForOrgs, doctorEmployeesForOrgs] = await Promise.all([
    prisma.doctorSchedule.findMany({
      where: {
        organizationId: { in: orgIds },
        isActive: true,
      },
      select: { organizationId: true, doctorUserId: true },
    }),
    prisma.organizationEmployee.findMany({
      where: {
        organizationId: { in: orgIds },
        role: "DOCTOR",
        isActive: true,
      },
      select: { organizationId: true, userId: true },
    }),
  ]);

  const doctorsByOrgMap = new Map<string, Set<string>>();
  for (const s of activeSchedulesForOrgs) {
    if (!doctorsByOrgMap.has(s.organizationId)) {
      doctorsByOrgMap.set(s.organizationId, new Set());
    }
    doctorsByOrgMap.get(s.organizationId)!.add(s.doctorUserId);
  }
  for (const e of doctorEmployeesForOrgs) {
    if (!doctorsByOrgMap.has(e.organizationId)) {
      doctorsByOrgMap.set(e.organizationId, new Set());
    }
    doctorsByOrgMap.get(e.organizationId)!.add(e.userId);
  }

  const transformedOrgs: SearchOrganizationResult[] = orgs.map((org) => {
    const reviews = org.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.organizationType?.name || "Healthcare Facility",
      typeCode: org.organizationType?.code || "GENERAL",
      address: org.address,
      latitude: org.latitude,
      longitude: org.longitude,
      rating: avgRating,
      reviewCount: reviews.length,
      specialties: org.specialties || [],
      doctorsCount: doctorsByOrgMap.get(org.id)?.size || 0,
    };
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Search Doctors (Multi-Organization Practicing Support)
  // ─────────────────────────────────────────────────────────────
  const doctorWhere: any = {
    professions: {
      some: {
        professionType: { code: "DOCTOR" },
        status: "VERIFIED",
      },
    },
  };

  const doctorOrConditions: any[] = [];

  if (trimmedQuery) {
    doctorOrConditions.push(
      { name: { contains: trimmedQuery, mode: "insensitive" } },
      { username: { contains: trimmedQuery, mode: "insensitive" } },
      {
        professions: {
          some: {
            doctorCredential: {
              specialization: { contains: trimmedQuery, mode: "insensitive" },
            },
          },
        },
      }
    );
  }

  if (trimmedDept) {
    doctorWhere.professions = {
      some: {
        professionType: { code: "DOCTOR" },
        status: "VERIFIED",
        doctorCredential: {
          specialization: { contains: trimmedDept, mode: "insensitive" },
        },
      },
    };
  }

  if (doctorOrConditions.length > 0) {
    doctorWhere.OR = doctorOrConditions;
  }

  const [matchingDoctorUsers, doctorCount] = await Promise.all([
    prisma.user.findMany({
      where: doctorWhere,
      select: {
        id: true,
        name: true,
        username: true,
        professions: {
          where: {
            professionType: { code: "DOCTOR" },
            status: "VERIFIED",
          },
          include: {
            doctorCredential: true,
          },
        },
        reviewsReceived: {
          select: { rating: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: doctorWhere }),
  ]);

  const doctorIds = matchingDoctorUsers.map((d) => d.id);
  const [doctorSchedules, doctorEmployees] = await Promise.all([
    prisma.doctorSchedule.findMany({
      where: {
        doctorUserId: { in: doctorIds },
        isActive: true,
      },
    }),
    prisma.organizationEmployee.findMany({
      where: {
        userId: { in: doctorIds },
        role: "DOCTOR",
        isActive: true,
      },
    }),
  ]);

  const scheduleOrgIds = doctorSchedules.map((s) => s.organizationId);
  const employeeOrgIds = doctorEmployees.map((e) => e.organizationId);
  const allOrgIds = Array.from(new Set([...scheduleOrgIds, ...employeeOrgIds]));

  const affiliatedOrgsData = await prisma.organization.findMany({
    where: {
      id: { in: allOrgIds },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
    },
  });

  const orgMap = new Map(affiliatedOrgsData.map((o) => [o.id, o]));

  const transformedDoctors: SearchDoctorResult[] = matchingDoctorUsers.map((doc) => {
    const reviews = doc.reviewsReceived || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    const cred = doc.professions[0]?.doctorCredential;

    const schedulesForDoctor = doctorSchedules.filter((s) => s.doctorUserId === doc.id);
    const employeesForDoctor = doctorEmployees.filter((e) => e.userId === doc.id);

    const affiliatedOrgs: DoctorAffiliatedOrg[] = [];
    const addedOrgIds = new Set<string>();

    for (const s of schedulesForDoctor) {
      const org = orgMap.get(s.organizationId);
      if (!org) continue;
      addedOrgIds.add(org.id);
      affiliatedOrgs.push({
        id: org.id,
        name: org.name,
        slug: org.slug,
        address: org.address,
        workingDays: s.workingDays || [],
        startTime: s.startTime,
        endTime: s.endTime,
        approvalMode: s.approvalMode,
        scheduleId: s.id,
        consultationFee: s.consultationFee,
      });
    }

    // Add organizations from employee records if not already added by schedule
    for (const emp of employeesForDoctor) {
      if (addedOrgIds.has(emp.organizationId)) continue;
      const org = orgMap.get(emp.organizationId);
      if (!org) continue;
      addedOrgIds.add(org.id);
      affiliatedOrgs.push({
        id: org.id,
        name: org.name,
        slug: org.slug,
        address: org.address,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        startTime: "09:00",
        endTime: "17:00",
        approvalMode: "AUTO",
      });
    }

    return {
      id: doc.id,
      name: doc.name,
      specialization: cred?.specialization || "General Medicine",
      degreeInstitution: cred?.degreeInstitution || null,
      bmdcNumber: cred?.bmdcRegistrationNumber || null,
      bio: cred?.bio || null,
      rating: avgRating,
      reviewCount: reviews.length,
      organizations: affiliatedOrgs,
    };
  });

  const total = orgCount + doctorCount;

  return {
    organizations: transformedOrgs,
    doctors: transformedDoctors,
    availableDepartments,
    availableOrgTypes: orgTypes,
    pagination: {
      total,
      totalOrgs: orgCount,
      totalDoctors: doctorCount,
      page,
      totalPages: Math.ceil(Math.max(orgCount, doctorCount, 1) / limit),
    },
  };
}
