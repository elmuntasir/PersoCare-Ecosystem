import type { RawInputs, Tier } from "./types";

const TIER_REQUIREMENTS: Record<Tier, (keyof RawInputs)[]> = {
  T0: ["gender", "age", "heightCm", "weightKg", "waistCm"],
  T1: ["gender", "age", "heightCm", "weightKg", "waistCm", "triglycerides", "hdl"],
  T2: [
    "gender",
    "age",
    "heightCm",
    "weightKg",
    "waistCm",
    "triglycerides",
    "hdl",
    "glucose",
    "hba1c",
    "insulin",
  ],
  T3: [
    "gender",
    "age",
    "heightCm",
    "weightKg",
    "waistCm",
    "triglycerides",
    "hdl",
    "glucose",
    "hba1c",
    "insulin",
    "systolicBp",
    "diastolicBp",
    "alt",
    "ast",
  ],
  T4: [
    "gender",
    "age",
    "heightCm",
    "weightKg",
    "waistCm",
    "triglycerides",
    "hdl",
    "glucose",
    "hba1c",
    "insulin",
    "systolicBp",
    "diastolicBp",
    "alt",
    "ast",
    "liverFat",
  ],
};

function hasValue(inputs: Partial<RawInputs>, field: keyof RawInputs): boolean {
  const value = inputs[field];
  return value !== undefined && value !== null && !Number.isNaN(value);
}

export function determineTier(inputs: Partial<RawInputs>): Tier {
  for (const tier of ["T4", "T3", "T2", "T1", "T0"] as Tier[]) {
    const required = TIER_REQUIREMENTS[tier];
    if (required.every((field) => hasValue(inputs, field))) {
      return tier;
    }
  }
  return "T0";
}

export function getTierRequirements(tier: Tier): (keyof RawInputs)[] {
  return TIER_REQUIREMENTS[tier];
}

export const TIER_LABELS: Record<Tier, string> = {
  T0: "Tape measure only",
  T1: "Basic lipids",
  T2: "Extended metabolic panel",
  T3: "Clinical panel",
  T4: "Enhanced (incl. liver fat)",
};
