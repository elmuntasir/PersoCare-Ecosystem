export interface ClinicalLabelInfo {
  displayName: string;
  description: string;
  keyIndices: string[];
  normalRange: string;
}

export const CLINICAL_INFO: Record<string, ClinicalLabelInfo> = {
  HighBodyFat_BMI: {
    displayName: "High Body Fat (BMI)",
    description:
      "Body fat percentage estimated from BMI. Elevated BMI indicates excess weight relative to height.",
    keyIndices: ["BMI", "Waist", "WHtR"],
    normalRange: "BMI 18.5–24.9 kg/m²",
  },
  Low_HDL: {
    displayName: "Low HDL",
    description:
      'Low levels of "good" cholesterol (HDL). Associated with increased cardiovascular risk.',
    keyIndices: ["HDL"],
    normalRange: "Male ≥40 mg/dL, Female ≥50 mg/dL",
  },
  Diabetes: {
    displayName: "Diabetes",
    description: "Elevated blood sugar (glucose/HbA1c) indicates risk of type 2 diabetes.",
    keyIndices: ["TyG", "HOMA-IR", "Glucose", "HbA1c"],
    normalRange: "Glucose <100 mg/dL, HbA1c <5.7%",
  },
  NAFLD: {
    displayName: "NAFLD",
    description:
      "Non-alcoholic fatty liver disease — elevated liver enzymes (ALT/AST) suggest liver fat accumulation.",
    keyIndices: ["ALT", "AST", "Liver_Fat"],
    normalRange: "ALT <40 U/L, AST <40 U/L",
  },
  Hypertension: {
    displayName: "Hypertension",
    description: "Elevated blood pressure readings.",
    keyIndices: ["Systolic_BP", "Diastolic_BP"],
    normalRange: "SBP <120 mmHg, DBP <80 mmHg",
  },
  InsulinResistance: {
    displayName: "Insulin Resistance",
    description: "Reduced sensitivity to insulin, often a precursor to diabetes.",
    keyIndices: ["HOMA-IR", "TyG", "Insulin"],
    normalRange: "HOMA-IR <2.5",
  },
  MetSyn: {
    displayName: "Metabolic Syndrome",
    description:
      "A cluster of risk factors (abdominal obesity, high triglycerides, low HDL, high blood pressure, high glucose).",
    keyIndices: ["Waist", "Triglycerides", "HDL", "Systolic_BP", "Glucose"],
    normalRange: "Meeting ≥3 of 5 criteria",
  },
};

export function getClinicalInfo(label: string): ClinicalLabelInfo {
  return (
    CLINICAL_INFO[label] ?? {
      displayName: label.replace(/_/g, " "),
      description: "",
      keyIndices: [],
      normalRange: "",
    }
  );
}
