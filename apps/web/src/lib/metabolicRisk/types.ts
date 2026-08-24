export interface RawInputs {
  gender: number; // 1 = male, 2 = female
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  triglycerides?: number;
  hdl?: number;
  ldl?: number;
  glucose?: number;
  hba1c?: number;
  insulin?: number;
  systolicBp?: number;
  diastolicBp?: number;
  alt?: number;
  ast?: number;
  liverFat?: number;
}

export interface DerivedIndices {
  bmi: number;
  whtr: number;
  vai?: number;
  lap?: number;
  homa_ir?: number;
  tyg?: number;
}

export type Tier = "T0" | "T1" | "T2" | "T3" | "T4";

export interface PreprocessingParams {
  medians: Record<string, number>;
  winsor_bounds: Record<string, [number, number]>;
  scaler_mean: Record<string, number>;
  scaler_std: Record<string, number>;
}

export interface TierManifest {
  features: string[];
  /** Per-label feature lists when leakage exclusions apply */
  labelFeatures?: Record<string, string[]>;
  thresholds: Record<string, number>;
}

export interface Manifest {
  labels: string[];
  tiers: Record<Tier, TierManifest>;
  preprocessing: PreprocessingParams;
  thresholds: Record<string, number>;
}

export interface RiskResult {
  label: string;
  probability: number;
  threshold: number;
  risk: "High" | "Low";
}

export type FeatureName =
  | "Gender"
  | "Age"
  | "BMI"
  | "Waist"
  | "Height"
  | "WHtR"
  | "Triglycerides"
  | "HDL"
  | "LDL"
  | "VAI"
  | "LAP"
  | "Glucose"
  | "HbA1c"
  | "Insulin"
  | "HOMA_IR"
  | "TyG"
  | "Systolic_BP"
  | "Diastolic_BP"
  | "ALT"
  | "AST"
  | "Liver_Fat";
