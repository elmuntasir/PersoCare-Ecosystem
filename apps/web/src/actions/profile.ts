"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  username: string | null;
  patientProfile: {
    bloodType: string | null;
    allergies: string[];
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    smokingStatus: string | null;
    alcoholConsumption: string | null;
    dietaryRestrictions: string[];
    languagePreference: string | null;
    requiresGuardianConsent: boolean;
  } | null;
  professions: Array<{
    id: string;
    professionType: string;
    code: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    verifiedAt: string | null;
    rejectedAt: string | null;
    rejectedReason: string | null;
    doctorCredential?: {
      bmdcRegistrationNumber: string;
      degreeInstitution: string;
      graduationYear: number;
      specialization: string | null;
    } | null;
    physiotherapistCredential?: {
      licenseNumber: string;
      licenseIssuingBody: string;
    } | null;
    radiologistCredential?: {
      bmdcRegistrationNumber: string;
      certificationBody: string;
    } | null;
  }>;
  adminRoles: Array<{
    id: string;
    organizationId: string;
    isPrimaryAdmin: boolean;
    isActive: boolean;
    organization: {
      id: string;
      name: string;
    };
  }>;
  isPlatformOwner?: boolean;
  activeRole: string;
  conditions: Array<{
    title: string;
    description: string | null;
    occurredAt: string | null;
    status: string;
  }>;
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

export async function getProfileData(): Promise<ProfileData> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch user with patientProfile, professions, credentials, and settings
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      platformOwner: true,
      patientProfile: true,
      adminRoles: {
        where: { isActive: true },
        include: { organization: true },
      },
      professions: {
        include: {
          professionType: true,
          doctorCredential: true,
          physiotherapistCredential: true,
          radiologistCredential: true,
        },
      },
      settings: true,
    },
  });

  if (!profile) throw new Error("User not found");

  const cookieStore = await cookies();
  const activeRoleCookie = cookieStore.get("persocare-active-role")?.value || "user";

  const patientProfile = profile.patientProfile
    ? {
        bloodType: profile.patientProfile.bloodType,
        allergies: profile.patientProfile.allergies,
        emergencyContactName: profile.patientProfile.emergencyContactName,
        emergencyContactPhone: profile.patientProfile.emergencyContactPhone,
        insuranceProvider: profile.patientProfile.insuranceProvider,
        insurancePolicyNumber: profile.patientProfile.insurancePolicyNumber,
        smokingStatus: profile.patientProfile.smokingStatus,
        alcoholConsumption: profile.patientProfile.alcoholConsumption,
        dietaryRestrictions: profile.patientProfile.dietaryRestrictions,
        languagePreference: profile.patientProfile.languagePreference,
        requiresGuardianConsent: profile.patientProfile.requiresGuardianConsent,
      }
    : null;

  // Medical conditions from HealthHistoryEvent (DIAGNOSIS or ILLNESS)
  const conditions = await prisma.healthHistoryEvent.findMany({
    where: {
      userId: user.id,
      eventType: { in: ["DIAGNOSIS", "ILLNESS"] },
    },
    select: {
      title: true,
      description: true,
      occurredAt: true,
      status: true,
    },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    dob: profile.dob ? profile.dob.toISOString() : null,
    gender: profile.gender,
    username: profile.username,
    patientProfile,
    isPlatformOwner: Boolean(profile.platformOwner),
    activeRole: activeRoleCookie,
    adminRoles: profile.adminRoles.map((a) => ({
      id: a.id,
      organizationId: a.organizationId,
      isPrimaryAdmin: a.isPrimaryAdmin,
      isActive: a.isActive,
      organization: {
        id: a.organization.id,
        name: a.organization.name,
      },
    })),
    professions: profile.professions.map((p) => ({
      id: p.id,
      professionType: p.professionType.name,
      code: p.professionType.code,
      status: p.status,
      verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
      rejectedAt: p.rejectedAt ? p.rejectedAt.toISOString() : null,
      rejectedReason: p.rejectedReason,
      doctorCredential: p.doctorCredential
        ? {
            bmdcRegistrationNumber: p.doctorCredential.bmdcRegistrationNumber,
            degreeInstitution: p.doctorCredential.degreeInstitution,
            graduationYear: p.doctorCredential.graduationYear,
            specialization: p.doctorCredential.specialization,
          }
        : null,
      physiotherapistCredential: p.physiotherapistCredential
        ? {
            licenseNumber: p.physiotherapistCredential.licenseNumber,
            licenseIssuingBody: p.physiotherapistCredential.licenseIssuingBody,
          }
        : null,
      radiologistCredential: p.radiologistCredential
        ? {
            bmdcRegistrationNumber: p.radiologistCredential.bmdcRegistrationNumber,
            certificationBody: p.radiologistCredential.certificationBody,
          }
        : null,
    })),
    conditions: conditions.map((c) => ({
      title: c.title,
      description: c.description,
      occurredAt: c.occurredAt ? c.occurredAt.toISOString() : null,
      status: c.status,
    })),
  };
}
