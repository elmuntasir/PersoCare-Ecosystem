"use client";

import { useState, useTransition } from "react";
import {
  markMedicineTakenAction,
  addPrescriptionToRoutineAction,
  updateUserSettingsModalAction,
} from "@/actions/medicine";
import { MedicineCard } from "./MedicineCard";
import { AddManualMedicineModal } from "./AddManualMedicineModal";
import { DrugDetailsModal } from "@/components/drug/DrugDetailsModal";
import { FileText, Plus, Pill } from "lucide-react";

export interface MedicineItem {
  id: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  payload: Record<string, unknown>;
  prescriptionMedicineId?: string | null;
  status: "PENDING" | "DONE" | "LATE" | "MISSED";
  dosage: string;
  medicineName: string;
  isExternal: boolean;
  hasTimingInstructions: boolean;
}

export interface Prescription {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  timingInstructions: Array<{
    mealRelation: "PRE_MEAL" | "WITH_MEAL" | "POST_MEAL";
    mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
    dosage?: string;
  }> | null;
  prescription: {
    doctors?: Array<{ doctor: { name: string } }>;
    doctor?: { name: string };
  };
}

interface MedicineLogClientProps {
  initialItems: MedicineItem[];
  initialPrescriptions: Prescription[];
  today: string;
  showConfirmModal: boolean;
  routineId?: string;
}

type Tab = "today" | "prescriptions";

export function MedicineLogClient({
  initialItems,
  initialPrescriptions,
  today,
  showConfirmModal: initialModalSetting,
}: MedicineLogClientProps) {
  const [items, setItems] = useState<MedicineItem[]>(initialItems);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [isPending, startTransition] = useTransition();
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showModal, setShowModal] = useState(initialModalSetting);
  const [showManualModal, setShowManualModal] = useState(false);
  const [detailsMedicine, setDetailsMedicine] = useState<MedicineItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMarkTaken = (itemId: string) => {
    if (!showModal || dontShowAgain) {
      executeMarkTaken(itemId);
      return;
    }
    setConfirmingItemId(itemId);
  };

  const executeMarkTaken = (itemId: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("routineItemId", itemId);
        formData.append("date", today);

        const result = await markMedicineTakenAction(formData);
        if (result.success) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: result.status === "DONE" ? "DONE" : "LATE" }
                : item
            )
          );
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to mark medicine taken");
      } finally {
        setConfirmingItemId(null);
      }
    });
  };

  const handleAddToRoutine = (prescriptionId: string) => {
    startTransition(async () => {
      setError(null);
      try {
        const formData = new FormData();
        formData.append("prescriptionMedicineId", prescriptionId);
        const result = await addPrescriptionToRoutineAction(formData);
        if (result.success) {
          setPrescriptions((prev) => prev.filter((p) => p.id !== prescriptionId));
          window.location.reload();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to add prescription to routine");
      }
    });
  };

  const handleDontShowAgain = async () => {
    setDontShowAgain(true);
    setShowModal(false);
    try {
      const formData = new FormData();
      formData.append("showConfirmModal", "false");
      await updateUserSettingsModalAction(formData);
    } catch {
      // Preference saved locally in state
    }
  };

  const handleManualAdded = () => {
    setShowManualModal(false);
    window.location.reload();
  };

  const handleViewDetails = (item: MedicineItem) => {
    setDetailsMedicine(item);
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; count?: number }[] = [
    { id: "today", label: "Today's Doses", icon: Pill, count: items.length },
    { id: "prescriptions", label: "Prescriptions", icon: FileText, count: prescriptions.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation & Add Medication Header */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-2 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--teal-900)] text-white shadow-sm"
                    : "text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.6} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--sage-200)] text-[var(--ink-soft)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "today" && (
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--coral)] text-white hover:opacity-90 transition-opacity text-sm font-body font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add Medication
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 font-body text-sm">
          {error}
        </div>
      )}

      {/* Today's Doses Tab */}
      {activeTab === "today" && (
        <>
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-12 text-center shadow-sm">
              <Pill className="w-12 h-12 mx-auto text-[var(--ink-soft)] opacity-30 mb-3" strokeWidth={1.6} />
              <h3 className="font-display text-lg text-[var(--teal-900)] font-semibold mb-1">
                No medicines scheduled for today
              </h3>
              <p className="font-body text-sm text-[var(--ink-soft)] mb-4">
                Add your prescriptions or record external medications.
              </p>
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="inline-flex items-center gap-1.5 text-sm font-body font-medium text-[var(--coral)] hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add a medication manually →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <MedicineCard
                  key={item.id}
                  {...item}
                  onMarkTaken={() => handleMarkTaken(item.id)}
                  onViewDetails={() => handleViewDetails(item)}
                  isPending={isPending && confirmingItemId === item.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-[var(--ink-soft)] opacity-30 mb-3" strokeWidth={1.6} />
              <h3 className="font-display text-lg text-[var(--teal-900)] font-semibold mb-1">
                All prescriptions added
              </h3>
              <p className="font-body text-sm text-[var(--ink-soft)]">
                All of your prescribed medications have been added to your daily routine.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => {
                const hasTiming = rx.timingInstructions && rx.timingInstructions.length > 0;
                const doctorName =
                  rx.prescription.doctors?.[0]?.doctor?.name ||
                  rx.prescription.doctor?.name ||
                  "Assigned Doctor";

                return (
                  <div
                    key={rx.id}
                    className="border border-[var(--sage-200)] rounded-2xl p-5 flex flex-wrap items-start justify-between gap-4 bg-[var(--paper)]/50 hover:border-[var(--teal-900)]/30 transition-colors"
                  >
                    <div>
                      <p className="font-body font-semibold text-[var(--ink)] text-base">
                        {rx.medicineName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--ink-soft)] font-body mt-1">
                        <span className="font-mono bg-[var(--sage-200)] px-2 py-0.5 rounded-md text-[var(--ink)]">
                          {rx.dosage}
                        </span>
                        <span>•</span>
                        <span>{rx.frequency}</span>
                        <span>•</span>
                        <span>{rx.duration}</span>
                        <span>•</span>
                        <span>Dr. {doctorName}</span>
                      </div>

                      {!hasTiming && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-amber-700 text-xs font-body bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                          <span>⚠️</span>
                          <span>No timing instructions — ask your doctor to add them.</span>
                        </div>
                      )}

                      {hasTiming && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {rx.timingInstructions?.map((t, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 rounded-full bg-[var(--sage-200)] text-[var(--ink)] font-body"
                            >
                              {t.mealRelation.replace("_", " ")} {t.mealType}
                              {t.dosage && ` (${t.dosage})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToRoutine(rx.id)}
                      disabled={isPending || !hasTiming}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                        hasTiming
                          ? "bg-[var(--coral)] text-white hover:opacity-90 shadow-sm"
                          : "bg-[var(--sage-200)] text-[var(--ink-soft)] cursor-not-allowed opacity-60"
                      }`}
                    >
                      {isPending ? "Adding..." : "+ Add to Routine"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--sage-200)]">
            <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold mb-2">
              Confirm Medication Taken
            </h3>
            <p className="font-body text-sm text-[var(--ink-soft)] mb-5">
              Did you take this medication as scheduled?
            </p>
            <div className="flex items-center gap-2.5 mb-6">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 accent-[var(--coral)] rounded"
              />
              <label htmlFor="dontShowAgain" className="font-body text-xs text-[var(--ink-soft)] cursor-pointer select-none">
                Don't show this confirmation again
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingItemId(null)}
                className="px-5 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (dontShowAgain) handleDontShowAgain();
                  executeMarkTaken(confirmingItemId);
                }}
                className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity font-medium text-sm"
              >
                Yes, I took it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <AddManualMedicineModal
          onClose={() => setShowManualModal(false)}
          onSuccess={handleManualAdded}
        />
      )}

      <DrugDetailsModal
        open={Boolean(detailsMedicine)}
        prescriptionMedicineId={detailsMedicine?.prescriptionMedicineId || null}
        medicineName={detailsMedicine?.medicineName || detailsMedicine?.label}
        onClose={() => setDetailsMedicine(null)}
      />
    </div>
  );
}
