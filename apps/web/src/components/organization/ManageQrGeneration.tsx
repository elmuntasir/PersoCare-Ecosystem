"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Shield, Sparkles, QrCode, Save } from "lucide-react";
import { updateOrganizationQrConfiguration } from "@/actions/admin/organizationQr";

type QrLevel = "organization" | "department" | "employee";
type QrUseCase = "booking" | "profile";

type ManageQrGenerationProps = {
  organization: {
    id: string;
    name: string;
    slug: string;
    aiConfiguration: {
      mode: string;
      qrLevels: string[];
      qrUseCases: string[];
    } | null;
  };
};

const levelOptions: Array<{
  id: QrLevel;
  label: string;
  description: string;
}> = [
  {
    id: "organization",
    label: "Organization level",
    description: "Use the main public profile and booking entry point.",
  },
  {
    id: "department",
    label: "Department level",
    description: "Support QR handouts for specialty or clinic departments.",
  },
  {
    id: "employee",
    label: "Employee level",
    description: "Let staff share a quick public entry from their profile.",
  },
];

const useCaseOptions: Array<{
  id: QrUseCase;
  label: string;
  description: string;
}> = [
  {
    id: "booking",
    label: "Booking",
    description: "Send visitors directly to the public appointment flow.",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Show the public organization landing page and details.",
  },
];

type QrMatrix = Record<QrLevel, Record<QrUseCase, boolean>>;

function createInitialMatrix(
  qrLevels: string[] | undefined,
  qrUseCases: string[] | undefined
): QrMatrix {
  const matrix: QrMatrix = {
    organization: { booking: false, profile: false },
    department: { booking: false, profile: false },
    employee: { booking: false, profile: false },
  };

  const levels = (qrLevels || []).filter((value): value is QrLevel =>
    ["organization", "department", "employee"].includes(value)
  );
  const useCases = (qrUseCases || []).filter((value): value is QrUseCase =>
    ["booking", "profile"].includes(value)
  );

  if (levels.length === 0 && useCases.length === 0) {
    matrix.organization.booking = true;
    return matrix;
  }

  const activeLevels: QrLevel[] = levels.length > 0 ? levels : ["organization"];
  const activeUseCases: QrUseCase[] = useCases.length > 0 ? useCases : ["booking"];

  for (const level of activeLevels) {
    for (const useCase of activeUseCases) {
      matrix[level][useCase] = true;
    }
  }

  return matrix;
}

export function ManageQrGeneration({ organization }: ManageQrGenerationProps) {
  const [matrix, setMatrix] = useState<QrMatrix>(
    createInitialMatrix(organization.aiConfiguration?.qrLevels, organization.aiConfiguration?.qrUseCases)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedLevels = useMemo(
    () =>
      levelOptions
        .filter((level) => useCaseOptions.some((useCase) => matrix[level.id][useCase.id]))
        .map((level) => level.id),
    [matrix]
  );

  const selectedUseCases = useMemo(
    () =>
      useCaseOptions
        .filter((useCase) => levelOptions.some((level) => matrix[level.id][useCase.id]))
        .map((useCase) => useCase.id),
    [matrix]
  );

  const selectedCombinationCount = useMemo(
    () =>
      levelOptions.reduce(
        (total, level) =>
          total + useCaseOptions.reduce((innerTotal, useCase) => innerTotal + (matrix[level.id][useCase.id] ? 1 : 0), 0),
        0
      ),
    [matrix]
  );

  const previewUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const params = new URLSearchParams();
    params.set("levels", selectedLevels.join(","));
    params.set("useCases", selectedUseCases.join(","));
    return `${baseUrl}/public-organization/${organization.slug}?${params.toString()}`;
  }, [organization.slug, selectedLevels, selectedUseCases]);

  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    previewUrl
  )}`;

  const toggleCombination = (level: QrLevel, useCase: QrUseCase) => {
    setMatrix((current) => ({
      ...current,
      [level]: {
        ...current[level],
        [useCase]: !current[level][useCase],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("organizationId", organization.id);
      selectedLevels.forEach((level) => formData.append("qrLevels", level));
      selectedUseCases.forEach((useCase) => formData.append("qrUseCases", useCase));
      await updateOrganizationQrConfiguration(formData);
      setSuccess("QR settings saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save QR settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[var(--sage-200)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,250,248,0.96))] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--teal-900)]">
              <Shield className="h-3.5 w-3.5" />
              Manage QR Generation
            </div>
            <div>
              <h3 className="font-display text-2xl text-[var(--teal-900)] font-bold">
                Public QR for {organization.name}
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-soft)] font-body">
                Configure who gets a QR, what it opens, and preview the destination before saving.
              </p>
            </div>
          </div>

          <div className="w-full max-w-[240px] rounded-2xl border border-[var(--sage-200)] bg-white p-3 shadow-xs">
            <div
              className="aspect-square rounded-xl bg-[var(--paper)] bg-contain bg-center bg-no-repeat"
              role="img"
              aria-label="QR code preview"
              style={{ backgroundImage: `url(${qrPreviewUrl})` }}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 text-sm text-[var(--ink-soft)]">
          <p className="font-semibold text-[var(--ink)]">Preview link</p>
          <p className="mt-1 break-all font-mono text-[11px]">{previewUrl}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-[var(--coral)]" />
            <h4 className="font-display text-xl text-[var(--teal-900)] font-semibold">Access matrix</h4>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-soft)] font-body">
            Pick the exact level and use-case combinations you want. Each checked box is one QR rule.
          </p>

          <div className="mt-4 overflow-hidden rounded-3xl border border-[var(--sage-200)] bg-[var(--paper)]">
            <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-[var(--sage-200)] bg-white/70 px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
              <div>Access level</div>
              <div className="text-center">Booking</div>
              <div className="text-center">Profile</div>
            </div>

            <div className="divide-y divide-[var(--sage-200)]">
              {levelOptions.map((level) => (
                <div key={level.id} className="grid grid-cols-[1.3fr_1fr_1fr] items-center gap-3 px-4 py-4">
                  <div>
                    <p className="font-body text-sm font-semibold text-[var(--ink)]">{level.label}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">{level.description}</p>
                  </div>

                  {useCaseOptions.map((useCase) => {
                    const checked = matrix[level.id][useCase.id];
                    return (
                      <label
                        key={`${level.id}-${useCase.id}`}
                        className={`mx-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border transition-colors ${
                          checked
                            ? "border-teal-200 bg-teal-50 text-[var(--teal-900)]"
                            : "border-[var(--sage-200)] bg-white text-[var(--ink-soft)] hover:bg-[var(--paper)]"
                        }`}
                        aria-label={`${level.label} ${useCase.label}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCombination(level.id, useCase.id)}
                          className="sr-only"
                        />
                        <span className="text-lg font-bold">{checked ? "✓" : "+"}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--ink-soft)] font-body">
            Selected combinations: {selectedCombinationCount} of {levelOptions.length * useCaseOptions.length}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--coral)]" />
            <h4 className="font-display text-xl text-[var(--teal-900)] font-semibold">Selection summary</h4>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-soft)] font-body">
            The matrix above is the only input. This panel just summarizes what is currently active.
          </p>

          <div className="mt-4 rounded-3xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Levels enabled</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedLevels.length > 0 ? (
                selectedLevels.map((level) => (
                  <span
                    key={level}
                    className="rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-medium text-[var(--ink)]"
                  >
                    {levelOptions.find((item) => item.id === level)?.label || level}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--ink-soft)]">No access levels selected.</span>
              )}
            </div>

            <p className="mt-4 text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Use cases enabled</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedUseCases.length > 0 ? (
                selectedUseCases.map((useCase) => (
                  <span
                    key={useCase}
                    className="rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-medium text-[var(--ink)]"
                  >
                    {useCaseOptions.find((item) => item.id === useCase)?.label || useCase}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--ink-soft)]">No use cases selected.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="font-display text-xl text-[var(--teal-900)] font-semibold">Generated behavior</h4>
            <p className="text-sm text-[var(--ink-soft)] font-body">
              The QR routes to a public organization landing page that can surface booking and profile actions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--teal-900)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save QR settings"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
