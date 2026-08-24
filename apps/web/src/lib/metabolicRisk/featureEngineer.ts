import type { DerivedIndices, RawInputs } from "./types";

export function computeDerivedIndices(inputs: RawInputs): DerivedIndices {
  const { gender, heightCm, weightKg, waistCm, triglycerides, hdl, glucose, insulin } = inputs;

  const bmi = weightKg / (heightCm / 100) ** 2;
  const whtr = waistCm / heightCm;

  const derived: DerivedIndices = { bmi, whtr };

  if (triglycerides != null && hdl != null && hdl > 0) {
    if (gender === 1) {
      derived.vai =
        (waistCm / (39.68 + 1.88 * bmi)) * (triglycerides / 1.03) * (1.31 / hdl);
      derived.lap = Math.max((waistCm - 65) * (triglycerides / 88.57), 0);
    } else {
      derived.vai =
        (waistCm / (36.58 + 1.89 * bmi)) * (triglycerides / 0.81) * (1.52 / hdl);
      derived.lap = Math.max((waistCm - 58) * (triglycerides / 88.57), 0);
    }
  }

  if (glucose != null && insulin != null) {
    derived.homa_ir = ((glucose / 18) * insulin) / 22.5;
  }

  if (glucose != null && triglycerides != null && glucose > 0 && triglycerides > 0) {
    derived.tyg = Math.log((triglycerides * glucose) / 2);
  }

  return derived;
}
