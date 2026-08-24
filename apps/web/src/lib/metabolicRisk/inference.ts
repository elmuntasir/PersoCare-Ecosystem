import * as ort from "onnxruntime-web";
import type { Manifest, RiskResult, RawInputs, Tier } from "./types";
import { computeDerivedIndices } from "./featureEngineer";
import { buildFeatureVector } from "./preprocessing";
import { getThreshold, normalizeManifest } from "./manifest";

let wasmConfigured = false;

function configureOrtWasm() {
  if (wasmConfigured || typeof window === "undefined") return;
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/";
  wasmConfigured = true;
}

const modelCache: Record<string, ort.InferenceSession> = {};

export async function loadManifest(): Promise<Manifest> {
  const res = await fetch("/models/metabolic_risk/manifest.json");
  if (!res.ok) {
    throw new Error("Failed to load model manifest. Ensure manifest.json is in public/models/metabolic_risk/");
  }
  return normalizeManifest(await res.json());
}

export async function loadModel(tier: Tier, label: string): Promise<ort.InferenceSession> {
  configureOrtWasm();
  const key = `${tier}/${label}`;
  if (modelCache[key]) return modelCache[key];

  const url = `/models/metabolic_risk/${tier}/${label}.onnx`;
  const session = await ort.InferenceSession.create(url, {
    executionProviders: ["wasm"],
  });
  modelCache[key] = session;
  return session;
}

function extractProbability(results: ort.InferenceSession.OnnxValueMapType): number {
  const probabilities = results.probabilities;
  if (probabilities) {
    const data = probabilities.data as Float32Array | number[];
    if (data.length === 2) return data[1];
    if (data.length === 1) return data[0];
  }

  const output = results.output ?? results.label ?? results[Object.keys(results)[0]];
  if (!output) return 0;

  const data = output.data as Float32Array | number[];
  if (data.length === 1) return data[0];
  if (data.length === 2) return data[1];
  return data[0];
}

export async function predictSingle(
  tier: Tier,
  label: string,
  features: number[],
  session?: ort.InferenceSession
): Promise<number> {
  const modelSession = session ?? (await loadModel(tier, label));
  const inputName = modelSession.inputNames[0] ?? "input";
  const inputTensor = new ort.Tensor("float32", features, [1, features.length]);
  const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };
  const results = await modelSession.run(feeds);
  return extractProbability(results);
}

export async function predictAllLabels(
  inputs: RawInputs,
  tier: Tier,
  manifest: Manifest
): Promise<RiskResult[]> {
  const derived = computeDerivedIndices(inputs);
  const results: RiskResult[] = [];

  for (const label of manifest.labels) {
    const features = buildFeatureVector(inputs, derived, tier, manifest, label);
    const threshold = getThreshold(manifest, tier, label);

    try {
      const probability = await predictSingle(tier, label, features);
      results.push({
        label,
        probability,
        threshold,
        risk: probability >= threshold ? "High" : "Low",
      });
    } catch (err) {
      console.error(`Prediction failed for ${label}:`, err);
      throw new Error(
        `Could not load model for ${label} (${tier}). Export ONNX files from Colab into public/models/metabolic_risk/${tier}/.`
      );
    }
  }

  return results;
}
