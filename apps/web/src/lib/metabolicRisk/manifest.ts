import type { Manifest, PreprocessingParams, Tier, TierManifest } from "./types";

/** Normalize Colab export variants into the shape our pipeline expects. */
export function normalizeManifest(raw: Record<string, unknown>): Manifest {
  const preprocessingRaw = (raw.preprocessing ?? {}) as Record<string, unknown>;

  const preprocessing: PreprocessingParams = {
    medians: (preprocessingRaw.medians ??
      preprocessingRaw.imputeMedians ??
      preprocessingRaw.impute_medians ??
      {}) as PreprocessingParams["medians"],
    winsor_bounds: (preprocessingRaw.winsor_bounds ??
      preprocessingRaw.winsorBounds ??
      {}) as PreprocessingParams["winsor_bounds"],
    scaler_mean: (preprocessingRaw.scaler_mean ??
      preprocessingRaw.scalerMean ??
      (preprocessingRaw.scaler as Record<string, unknown> | undefined)?.mean ??
      {}) as PreprocessingParams["scaler_mean"],
    scaler_std: (preprocessingRaw.scaler_std ??
      preprocessingRaw.scalerStd ??
      (preprocessingRaw.scaler as Record<string, unknown> | undefined)?.scale ??
      (preprocessingRaw.scaler as Record<string, unknown> | undefined)?.std ??
      {}) as PreprocessingParams["scaler_std"],
  };

  const tiers = (raw.tiers ?? {}) as Record<string, TierManifest>;
  const globalThresholds = (raw.thresholds ?? {}) as Record<string, number>;

  // Ensure each tier inherits global tuned thresholds when tier-specific ones are absent
  for (const tier of Object.keys(tiers) as Tier[]) {
    tiers[tier] = {
      ...tiers[tier],
      thresholds: {
        ...globalThresholds,
        ...tiers[tier]?.thresholds,
      },
    };
  }

  return {
    labels: raw.labels as Manifest["labels"],
    tiers,
    preprocessing,
    thresholds: globalThresholds,
  };
}

export function getThreshold(manifest: Manifest, tier: Tier, label: string): number {
  return manifest.thresholds[label] ?? manifest.tiers[tier]?.thresholds[label] ?? 0.5;
}
