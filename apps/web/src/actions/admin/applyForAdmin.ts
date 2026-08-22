"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
 * Instantly creates/verifies a UserProfession record for the given role code.
 * Used by the "Done / Bypass (Test)" button in the eKYC modal.
 * Works for any role: admin, doctor, physiotherapist, radiologist.
 */
export async function applyForProfessionBypass(roleCode: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const key = roleCode.toLowerCase();
  const defaults = PROFESSION_DEFAULTS[key];

  if (!defaults) {
    throw new Error(`No profession defaults found for role: ${roleCode}`);
  }

  // Ensure ProfessionType exists
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

  // Upsert UserProfession → always VERIFIED
  const existing = await prisma.userProfession.findFirst({
    where: { userId: user.id, professionTypeId: professionType.id },
  });

  if (existing) {
    if (existing.status !== "VERIFIED") {
      await prisma.userProfession.update({
        where: { id: existing.id },
        data: { status: "VERIFIED", verifiedAt: new Date(), rejectedAt: null, rejectedReason: null },
      });
    }
    // If already VERIFIED, nothing to do
  } else {
    await prisma.userProfession.create({
      data: {
        userId: user.id,
        professionTypeId: professionType.id,
        status: "VERIFIED",
        verifiedAt: new Date(),
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
