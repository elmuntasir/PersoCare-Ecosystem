"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateHealthSchema = z.object({
  bloodType: z.string().optional().nullable(),
  allergies: z.array(z.string()).optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insurancePolicyNumber: z.string().optional().nullable(),
  smokingStatus: z.string().optional().nullable(),
  alcoholConsumption: z.string().optional().nullable(),
  dietaryRestrictions: z.array(z.string()).optional().nullable(),
  languagePreference: z.string().optional().nullable(),
  requiresGuardianConsent: z.boolean().optional().nullable(),
});

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

export async function updateHealthInfo(formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const rawBlood = formData.get("bloodType") as string | null;
  const rawAllergies = formData.getAll("allergies").map((a) => String(a).trim()).filter(Boolean);
  const rawDiet = formData.getAll("dietaryRestrictions").map((d) => String(d).trim()).filter(Boolean);
  const emName = formData.get("emergencyContactName") as string | null;
  const emPhone = formData.get("emergencyContactPhone") as string | null;
  const insProv = formData.get("insuranceProvider") as string | null;
  const insNum = formData.get("insurancePolicyNumber") as string | null;
  const smoke = formData.get("smokingStatus") as string | null;
  const alcohol = formData.get("alcoholConsumption") as string | null;
  const lang = formData.get("languagePreference") as string | null;
  const guardian = formData.get("requiresGuardianConsent") === "on";

  const data = updateHealthSchema.parse({
    bloodType: rawBlood?.trim() || null,
    allergies: rawAllergies,
    emergencyContactName: emName?.trim() || null,
    emergencyContactPhone: emPhone?.trim() || null,
    insuranceProvider: insProv?.trim() || null,
    insurancePolicyNumber: insNum?.trim() || null,
    smokingStatus: smoke?.trim() || null,
    alcoholConsumption: alcohol?.trim() || null,
    dietaryRestrictions: rawDiet,
    languagePreference: lang?.trim() || null,
    requiresGuardianConsent: guardian,
  });

  await prisma.patientProfile.upsert({
    where: { userId: user.id },
    update: {
      bloodType: data.bloodType,
      allergies: data.allergies || [],
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      insuranceProvider: data.insuranceProvider,
      insurancePolicyNumber: data.insurancePolicyNumber,
      smokingStatus: data.smokingStatus,
      alcoholConsumption: data.alcoholConsumption,
      dietaryRestrictions: data.dietaryRestrictions || [],
      languagePreference: data.languagePreference,
      requiresGuardianConsent: data.requiresGuardianConsent ?? false,
    },
    create: {
      userId: user.id,
      bloodType: data.bloodType,
      allergies: data.allergies || [],
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      insuranceProvider: data.insuranceProvider,
      insurancePolicyNumber: data.insurancePolicyNumber,
      smokingStatus: data.smokingStatus,
      alcoholConsumption: data.alcoholConsumption,
      dietaryRestrictions: data.dietaryRestrictions || [],
      languagePreference: data.languagePreference,
      requiresGuardianConsent: data.requiresGuardianConsent ?? false,
    },
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}
