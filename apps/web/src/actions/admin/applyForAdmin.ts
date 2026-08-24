"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isUserVerified } from "@/actions/ekyc/didit";

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

// ─── Role code → ProfessionType defaults ──────────────────────────────────────

const PROFESSION_DEFAULTS: Record<
  string,
  { code: string; name: string; requiredDocuments: string[]; verifyingBody: string }
> = {
  admin: {
    code: "ADMIN",
    name: "Admin / Organization Lead",
    requiredDocuments: ["National ID", "Organization Authorization Letter"],
    verifyingBody: "PersoCare Administration",
  },
  doctor: {
    code: "DOCTOR",
    name: "Doctor",
    requiredDocuments: ["MBBS Certificate", "BMDC Registration"],
    verifyingBody: "Bangladesh Medical & Dental Council",
  },
  physiotherapist: {
    code: "PHYSIOTHERAPIST",
    name: "Physiotherapist",
    requiredDocuments: ["BPT Certificate", "Bangladesh Physiotherapy Association ID"],
    verifyingBody: "Bangladesh Physiotherapy Association",
  },
  radiologist: {
    code: "RADIOLOGIST",
    name: "Radiologist",
    requiredDocuments: ["MD Radiology Certificate", "BMDC Registration"],
    verifyingBody: "Bangladesh Medical & Dental Council",
  },
};

/**
 * Apply for a professional role. Requires Didit identity verification first.
 */
export async function applyForProfession(roleCode: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const verified = await isUserVerified();
  if (!verified) {
    throw new Error("You must verify your identity before applying for a professional role.");
  }

  return upsertProfession(user.id, roleCode, "PENDING");
}

/**
 * Instantly creates/verifies a UserProfession record for the given role code.
 * Used by the "Done / Bypass (Test)" button in the eKYC modal.
 * Still requires Didit identity verification — only profession credentials are bypassed.
 */
export async function applyForProfessionBypass(roleCode: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const verified = await isUserVerified();
  if (!verified) {
    throw new Error("You must verify your identity before applying for a professional role.");
  }

  return upsertProfession(user.id, roleCode, "VERIFIED");
}

async function upsertProfession(
  userId: string,
  roleCode: string,
  status: "PENDING" | "VERIFIED",
) {
  const key = roleCode.toLowerCase();
  const defaults = PROFESSION_DEFAULTS[key];

  if (!defaults) {
    throw new Error(`No profession defaults found for role: ${roleCode}`);
  }

  let professionType = await prisma.professionType.findUnique({
    where: { code: defaults.code },
  });

  if (!professionType) {
    professionType = await prisma.professionType.create({
      data: {
        code: defaults.code,
        name: defaults.name,
        requiredDocuments: defaults.requiredDocuments,
        verifyingBody: defaults.verifyingBody,
        isActive: true,
      },
    });
  }

  const existing = await prisma.userProfession.findFirst({
    where: { userId, professionTypeId: professionType.id },
  });

  if (existing) {
    if (existing.status !== status) {
      await prisma.userProfession.update({
        where: { id: existing.id },
        data: {
          status,
          verifiedAt: status === "VERIFIED" ? new Date() : null,
          rejectedAt: null,
          rejectedReason: null,
        },
      });
    }
  } else {
    await prisma.userProfession.create({
      data: {
        userId,
        professionTypeId: professionType.id,
        status,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
      },
    });
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/organization");
  return { success: true };
}

// ─── Legacy alias kept for any existing imports ───────────────────────────────
export async function applyForAdminBypass() {
  return applyForProfessionBypass("admin");
}
