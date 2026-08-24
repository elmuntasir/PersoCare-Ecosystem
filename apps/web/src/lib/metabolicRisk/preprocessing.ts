import type { DerivedIndices, Manifest, RawInputs, Tier } from "./types";
import { tierFeaturesForLabel } from "./featureRegistry";

const FEATURE_INPUT_MAP: Record<string, keyof RawInputs | null> = {
  Gender: "gender",
  Age: "age",
  BMI: null,
  Waist: "waistCm",
  Height: "heightCm",
  WHtR: null,
  Triglycerides: "triglycerides",
  HDL: "hdl",
  LDL: "ldl",
  VAI: null,
  LAP: null,
  Glucose: "glucose",
  HbA1c: "hba1c",
  Insulin: "insulin",
  HOMA_IR: null,
  TyG: null,
  Systolic_BP: "systolicBp",
  Diastolic_BP: "diastolicBp",
  ALT: "alt",
  AST: "ast",
  Liver_Fat: "liverFat",
};

const DERIVED_VALUE_MAP: Record<string, keyof DerivedIndices> = {
  BMI: "bmi",
  WHtR: "whtr",
  VAI: "vai",
  LAP: "lap",
  HOMA_IR: "homa_ir",
  TyG: "tyg",
};

function applyWinsorization(value: number, bounds: [number, number]): number {
  return Math.max(Math.min(value, bounds[1]), bounds[0]);
}

function getRawFeatureValue(
  featureName: string,
  raw: RawInputs,
  derived: DerivedIndices,
  medians: Record<string, number>
): number {
  const inputKey = FEATURE_INPUT_MAP[featureName];
  if (inputKey) {
    const val = raw[inputKey];
    if (val !== undefined && val !== null && !Number.isNaN(val)) {
      return val;
    }
    return medians[featureName] ?? 0;
  }

  const derivedKey = DERIVED_VALUE_MAP[featureName];
  if (derivedKey) {
    const val = derived[derivedKey];
    if (val !== undefined && !Number.isNaN(val)) {
      return val;
    }
    return medians[featureName] ?? 0;
  }

  return medians[featureName] ?? 0;
}

export function getFeatureList(manifest: Manifest, tier: Tier, label: string): string[] {
  const tierConfig = manifest.tiers[tier];
  return tierConfig.labelFeatures?.[label] ?? tierFeaturesForLabel(label, tier);
}

export function buildFeatureVector(
  raw: RawInputs,
  derived: DerivedIndices,
  tier: Tier,
  manifest: Manifest,
  label: string
): number[] {
  const featureNames = getFeatureList(manifest, tier, label);
  const { medians, winsor_bounds, scaler_mean, scaler_std } = manifest.preprocessing;

  return featureNames.map((name) => {
    let val = getRawFeatureValue(name, raw, derived, medians);

    const bounds = winsor_bounds[name];
    if (bounds) {
      val = applyWinsorization(val, bounds);
    }

    const mean = scaler_mean[name] ?? 0;
    const std = scaler_std[name] ?? 1;
    return (val - mean) / (std || 1);
  });
}
