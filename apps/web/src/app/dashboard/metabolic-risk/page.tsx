"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  ChevronRight,
  Loader2,
  Info,
  RotateCcw,
} from "lucide-react";
import type { Manifest, RawInputs, RiskResult, Tier } from "@/lib/metabolicRisk/types";
import { computeDerivedIndices } from "@/lib/metabolicRisk/featureEngineer";
import { determineTier, getTierRequirements, TIER_LABELS } from "@/lib/metabolicRisk/tiers";
import { loadManifest, predictAllLabels } from "@/lib/metabolicRisk/inference";
import { getClinicalInfo } from "@/lib/metabolicRisk/clinicalInfo";
import { saveMetabolicRiskAssessment } from "@/actions/metabolicRisk/saveAssessment";

type InputField = {
  key: keyof RawInputs;
  label: string;
  unit?: string;
  step?: string;
  optional?: boolean;
};

const TIER_STEPS: Tier[] = ["T0", "T1", "T2", "T3", "T4"];

const TIER_STEP_FIELDS: Record<Tier, InputField[]> = {
  T0: [
    { key: "age", label: "Age", unit: "years" },
    { key: "heightCm", label: "Height", unit: "cm" },
    { key: "weightKg", label: "Weight", unit: "kg" },
    { key: "waistCm", label: "Waist circumference", unit: "cm" },
  ],
  T1: [
    { key: "triglycerides", label: "Triglycerides", unit: "mg/dL" },
    { key: "hdl", label: "HDL cholesterol", unit: "mg/dL" },
    { key: "ldl", label: "LDL cholesterol", unit: "mg/dL", optional: true },
  ],
  T2: [
    { key: "glucose", label: "Fasting glucose", unit: "mg/dL" },
    { key: "hba1c", label: "HbA1c", unit: "%" },
    { key: "insulin", label: "Insulin", unit: "μIU/mL" },
  ],
  T3: [
    { key: "systolicBp", label: "Systolic BP", unit: "mmHg" },
    { key: "diastolicBp", label: "Diastolic BP", unit: "mmHg" },
    { key: "alt", label: "ALT", unit: "U/L" },
    { key: "ast", label: "AST", unit: "U/L" },
  ],
  T4: [{ key: "liverFat", label: "Liver fat (CAP)", unit: "dB/m" }],
};

const STEPPER_LABELS = ["Tier 0", "Tier 1", "Tier 2", "Tier 3", "Tier 4", "Results"];

function tierStepLabel(tier: Tier): string {
  return TIER_LABELS[tier];
}

function validateTierInputs(fullInputs: Partial<RawInputs>, tier: Tier): string | null {
  const required = getTierRequirements(tier).filter((field) => field !== "gender");
  for (const field of required) {
    const value = fullInputs[field];
    if (value === undefined || value === null || Number.isNaN(value)) {
      return `Please fill in all required fields for ${tier}.`;
    }
  }
  if (fullInputs.gender == null) {
    return "Please select your gender.";
  }
  return null;
}

export default function MetabolicRiskPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"layman" | "clinical">("layman");

  const [stepIndex, setStepIndex] = useState(0);
  const [gender, setGender] = useState<number>(1);
  const [inputs, setInputs] = useState<Partial<RawInputs>>({});

  const [tier, setTier] = useState<Tier>("T0");
  const [results, setResults] = useState<RiskResult[] | null>(null);
  const [derivedPreview, setDerivedPreview] = useState<ReturnType<typeof computeDerivedIndices> | null>(
    null
  );

  const isResultsStep = stepIndex === TIER_STEPS.length;
  const currentTierStep = TIER_STEPS[stepIndex] ?? "T0";
  const isLastTierStep = stepIndex === TIER_STEPS.length - 1;

  const fullInputs = useMemo(
    (): Partial<RawInputs> => ({ gender, ...inputs }),
    [gender, inputs]
  );

  const detectedTier = useMemo(() => determineTier(fullInputs), [fullInputs]);

  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch(() => setError("Failed to load model configuration."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof RawInputs, value: string) => {
    const num = parseFloat(value);
    setInputs((prev) => ({
      ...prev,
      [field]: value === "" || Number.isNaN(num) ? undefined : num,
    }));
  };

  const handlePredict = async () => {
    if (!manifest) return;

    const t0Error = validateTierInputs(fullInputs, "T0");
    if (t0Error) {
      setError(t0Error);
      return;
    }

    setPredicting(true);
    setError(null);
    setSaveWarning(null);

    try {
      const currentTier = determineTier(fullInputs);
      setTier(currentTier);

      const completeInputs = fullInputs as RawInputs;
      const derived = computeDerivedIndices(completeInputs);
      setDerivedPreview(derived);

      const labelResults = await predictAllLabels(completeInputs, currentTier, manifest);
      setResults(labelResults);
      setStepIndex(TIER_STEPS.length);

      setSaving(true);
      try {
        const saveResult = await saveMetabolicRiskAssessment({
          inputs: completeInputs,
          tier: currentTier,
          results: labelResults,
        });
        if (!saveResult.success) {
          setSaveWarning(saveResult.error);
        }
      } catch (saveErr) {
        console.error("Failed to save assessment:", saveErr);
        setSaveWarning("Could not save assessment to history.");
      } finally {
        setSaving(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed.");
    } finally {
      setPredicting(false);
    }
  };

  const handleSkipNextTier = () => {
    setError(null);
    const t0Error = validateTierInputs(fullInputs, "T0");
    if (t0Error) {
      setError(t0Error);
      return;
    }
    if (stepIndex < TIER_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleStartOver = () => {
    setStepIndex(0);
    setResults(null);
    setDerivedPreview(null);
    setError(null);
    setSaveWarning(null);
    setViewMode("layman");
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-900)]" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-[var(--teal-900)]" strokeWidth={1.6} />
            <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)]">
              Metabolic Risk Calculator
            </h1>
          </div>
          <p className="font-body text-sm text-[var(--ink-soft)]">
            Enter measurements tier by tier for a progressively richer assessment. All inference runs
            locally in your browser.
          </p>
        </div>

        {/* Stepper */}
        <nav aria-label="Assessment progress" className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm overflow-x-auto">
          <ol className="flex items-center min-w-max gap-1">
            {STEPPER_LABELS.map((label, index) => {
              const isComplete = index < stepIndex;
              const isCurrent = index === stepIndex;

              return (
                <li key={label} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-body transition-colors ${
                      isCurrent
                        ? "bg-[var(--teal-900)] text-white font-semibold"
                        : isComplete
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-[var(--ink-soft)]"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                        isCurrent
                          ? "bg-white/20"
                          : isComplete
                            ? "bg-emerald-200 text-emerald-900"
                            : "bg-[var(--sage-200)]"
                      }`}
                    >
                      {isComplete ? <Check className="w-3.5 h-3.5" /> : index}
                    </span>
                    <span className="whitespace-nowrap">{label}</span>
                  </div>
                  {index < STEPPER_LABELS.length - 1 && (
                    <ChevronRight
                      className={`w-4 h-4 mx-1 shrink-0 ${
                        index < stepIndex ? "text-emerald-500" : "text-[var(--sage-200)]"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {saveWarning && isResultsStep && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 font-body text-sm">
            {saveWarning} Your risk results are still valid.
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 font-body text-sm flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!isResultsStep ? (
          <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--coral)] mb-1">
                  Step {stepIndex + 1} of {TIER_STEPS.length}
                </p>
                <h2 className="font-body font-semibold text-[var(--ink)] text-lg">
                  {STEPPER_LABELS[stepIndex]}
                </h2>
                <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
                  {tierStepLabel(currentTierStep)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-body">
                <span className="text-[var(--ink-soft)]">Current data tier:</span>
                <span className="px-3 py-1 rounded-full bg-[var(--teal-900)] text-white font-mono text-xs">
                  {detectedTier}
                </span>
              </div>
            </div>

            {stepIndex === 0 && (
              <div>
                <label className="block text-sm font-body text-[var(--ink-soft)] mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(Number(e.target.value))}
                  className="w-full md:w-48 rounded-xl border border-[var(--sage-200)] px-4 py-2 font-body bg-white"
                >
                  <option value={1}>Male</option>
                  <option value={2}>Female</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TIER_STEP_FIELDS[currentTierStep].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-body text-[var(--ink-soft)] mb-1">
                    {field.label}
                    {field.optional && (
                      <span className="text-xs ml-1 opacity-70">(optional)</span>
                    )}
                    {field.unit && (
                      <span className="text-xs ml-1 opacity-70">({field.unit})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step={field.step ?? "any"}
                    value={inputs[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-xl border border-[var(--sage-200)] px-4 py-2 font-body focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] text-xs font-body text-[var(--ink-soft)]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[var(--teal-900)]" />
              <p>
                {isLastTierStep
                  ? "Enter all available measurements, then calculate your risk scores."
                  : "Add more biomarkers on the next tier for a richer assessment, or calculate now with what you have."}
              </p>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 ${isLastTierStep ? "" : ""}`}>
              {!isLastTierStep && (
                <button
                  type="button"
                  onClick={handleSkipNextTier}
                  disabled={predicting}
                  className="flex-1 py-3 rounded-full border border-[var(--sage-200)] bg-white text-[var(--ink)] font-medium hover:bg-[var(--paper)] disabled:opacity-60"
                >
                  Skip to next tier
                </button>
              )}
              <button
                type="button"
                onClick={handlePredict}
                disabled={predicting || !manifest}
                className={`py-3 rounded-full bg-[var(--coral)] text-white font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 ${
                  isLastTierStep ? "w-full" : "flex-1"
                }`}
              >
                {predicting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculating…
                  </>
                ) : (
                  "Calculate risk"
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--coral)] mb-1">
                  Assessment complete
                </p>
                <h2 className="font-body font-semibold text-[var(--ink)] text-lg">Your results</h2>
                <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
                  Tier {tier} · {TIER_LABELS[tier]}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartOver}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--sage-200)] text-sm font-body text-[var(--ink-soft)] hover:bg-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New assessment
              </button>
            </div>

            {derivedPreview && (
              <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm">
                <h3 className="font-body font-semibold text-[var(--teal-900)] mb-2 text-sm">
                  Derived indices
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono text-[var(--ink-soft)]">
                  <span>BMI: {derivedPreview.bmi.toFixed(2)}</span>
                  <span>WHtR: {derivedPreview.whtr.toFixed(3)}</span>
                  {derivedPreview.vai != null && (
                    <span>VAI: {derivedPreview.vai.toFixed(2)}</span>
                  )}
                  {derivedPreview.lap != null && (
                    <span>LAP: {derivedPreview.lap.toFixed(1)}</span>
                  )}
                  {derivedPreview.homa_ir != null && (
                    <span>HOMA-IR: {derivedPreview.homa_ir.toFixed(2)}</span>
                  )}
                  {derivedPreview.tyg != null && (
                    <span>TyG: {derivedPreview.tyg.toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-body font-medium text-[var(--ink)]">View:</span>
                  <button
                    type="button"
                    onClick={() => setViewMode("layman")}
                    className={`px-4 py-1.5 rounded-full text-sm font-body transition-colors ${
                      viewMode === "layman"
                        ? "bg-[var(--teal-900)] text-white"
                        : "bg-[var(--sage-200)] text-[var(--ink-soft)]"
                    }`}
                  >
                    Simple Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("clinical")}
                    className={`px-4 py-1.5 rounded-full text-sm font-body transition-colors ${
                      viewMode === "clinical"
                        ? "bg-[var(--teal-900)] text-white"
                        : "bg-[var(--sage-200)] text-[var(--ink-soft)]"
                    }`}
                  >
                    Clinical Details
                  </button>
                  {saving && (
                    <span className="text-xs font-body text-[var(--ink-soft)] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving to history…
                    </span>
                  )}
                </div>

                {viewMode === "layman" ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-[var(--sage-200)]">
                      <p className="font-body text-sm text-[var(--ink)]">
                        {results.some((r) => r.risk === "High")
                          ? "Based on your measurements, one or more risk scores are elevated. Consider speaking with a healthcare provider."
                          : "Your risk scores are generally within the normal range. Keep up a healthy lifestyle."}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)] mt-2">
                        This is a screening tool, not a diagnosis. Always consult a doctor for medical advice.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.map((res) => {
                        const info = getClinicalInfo(res.label);
                        return (
                          <div
                            key={res.label}
                            className={`p-4 rounded-xl border shadow-sm bg-white ${
                              res.risk === "High"
                                ? "border-rose-200 bg-rose-50/50"
                                : "border-emerald-200 bg-emerald-50/50"
                            }`}
                          >
                            <div className="flex justify-between gap-2">
                              <span className="font-body font-medium">{info.displayName}</span>
                              <span className="text-sm font-mono whitespace-nowrap">
                                {res.risk === "High" ? "High" : "Low"}
                              </span>
                            </div>
                            <div className="mt-2 w-full h-2 bg-[var(--sage-200)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--coral)] rounded-full transition-all"
                                style={{ width: `${Math.min(res.probability * 100, 100)}%` }}
                              />
                            </div>
                            <p className="text-sm text-[var(--ink-soft)] mt-1">
                              {Math.round(res.probability * 100)}% estimated risk
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-[var(--sage-200)] text-sm">
                      <p className="font-medium text-[var(--teal-900)]">Clinical interpretation</p>
                      <p className="text-[var(--ink-soft)] mt-1">
                        Risk estimates use tiered XGBoost models trained on NHANES Cycle J (2017–2018).
                        Your assessment tier is <strong>{tier}</strong> ({TIER_LABELS[tier]}).
                      </p>
                    </div>

                    {results.map((res) => {
                      const info = getClinicalInfo(res.label);
                      return (
                        <div
                          key={res.label}
                          className="border border-[var(--sage-200)] rounded-xl p-4 bg-white"
                        >
                          <div className="flex justify-between gap-2 flex-wrap">
                            <h4 className="font-body font-medium text-[var(--teal-900)]">
                              {info.displayName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                                res.risk === "High"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {res.risk === "High" ? "High Risk" : "Low Risk"}
                            </span>
                          </div>
                          {info.description && (
                            <p className="text-sm text-[var(--ink)] mt-1">{info.description}</p>
                          )}
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--ink-soft)]">
                            <div>
                              <span className="font-medium">Probability:</span>{" "}
                              {(res.probability * 100).toFixed(1)}%
                            </div>
                            <div>
                              <span className="font-medium">Threshold:</span>{" "}
                              {(res.threshold * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-4 bg-white rounded-xl border border-[var(--sage-200)] text-sm font-body">
                  <h4 className="font-medium text-[var(--teal-900)] mb-1">Understanding your results</h4>
                  <p className="text-[var(--ink-soft)]">
                    The percentage is an estimate — <strong>not a diagnosis</strong>. Consult a doctor if
                    any result is high.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
