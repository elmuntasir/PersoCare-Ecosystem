import type { FeatureName } from "./types";

export const ALL_FEATURES: FeatureName[] = [
  "Gender",
  "Age",
  "BMI",
  "Waist",
  "Height",
  "Triglycerides",
  "HDL",
  "Glucose",
  "HbA1c",
  "Insulin",
  "Systolic_BP",
  "Diastolic_BP",
  "ALT",
  "AST",
  "Liver_Fat",
  "LDL",
  "WHtR",
  "VAI",
  "LAP",
  "HOMA_IR",
  "TyG",
];

export const WINSORIZE_COLS: FeatureName[] = [
  "Triglycerides",
  "Insulin",
  "VAI",
  "LAP",
  "HOMA_IR",
  "TyG",
];

const LEAKAGE_EXCLUSIONS: Record<string, FeatureName[]> = {
  Label_HighBodyFat_BMI: ["BMI"],
  Label_Low_HDL: ["HDL"],
  Label_Diabetes: ["Glucose", "HbA1c", "TyG", "HOMA_IR"],
  Label_NAFLD: ["ALT", "AST", "Liver_Fat"],
  Label_Hypertension: ["Systolic_BP", "Diastolic_BP"],
  Label_InsulinResistance: ["HOMA_IR", "Glucose", "Insulin", "TyG"],
  Label_MetSyn: [
    "Waist",
    "Triglycerides",
    "HDL",
    "Systolic_BP",
    "Diastolic_BP",
    "Glucose",
    "WHtR",
    "VAI",
    "LAP",
    "TyG",
    "HOMA_IR",
  ],
};

const TIERS: Record<string, FeatureName[]> = {
  T0: ["Gender", "Age", "BMI", "Waist", "Height", "WHtR"],
  T1: [
    "Gender",
    "Age",
    "BMI",
    "Waist",
    "Height",
    "WHtR",
    "Triglycerides",
    "HDL",
    "LDL",
    "VAI",
    "LAP",
  ],
  T2: [
    "Gender",
    "Age",
    "BMI",
    "Waist",
    "Height",
    "WHtR",
    "Triglycerides",
    "HDL",
    "LDL",
    "VAI",
    "LAP",
    "Glucose",
    "HbA1c",
    "Insulin",
    "HOMA_IR",
    "TyG",
  ],
  T3: ALL_FEATURES.filter((f) => f !== "Liver_Fat"),
  T4: [...ALL_FEATURES],
};

function leakageFreeFeatures(label: string, featurePool: FeatureName[]): FeatureName[] {
  const exclusions = new Set(LEAKAGE_EXCLUSIONS[label] ?? []);
  return featurePool.filter((feature) => !exclusions.has(feature));
}

export function tierFeaturesForLabel(label: string, tier: string): FeatureName[] {
  const pool = TIERS[tier];
  if (!pool) {
    throw new Error(`Unknown tier: ${tier}`);
  }
  const labelKey = label.startsWith("Label_") ? label : `Label_${label}`;
  return leakageFreeFeatures(labelKey, pool);
}
