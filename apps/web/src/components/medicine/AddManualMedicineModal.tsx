"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addManualMedicineAction } from "@/actions/medicine";

interface AddManualMedicineModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddManualMedicineModal({ onClose, onSuccess }: AddManualMedicineModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("medicineName", medicineName);
      formData.append("dosage", dosage);
      if (frequency) formData.append("frequency", frequency);
      if (duration) formData.append("duration", duration);
      if (startTime) formData.append("startTime", startTime);
      if (endTime) formData.append("endTime", endTime);
      if (notes) formData.append("notes", notes);

      await addManualMedicineAction(formData);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add medication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--sage-200)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
            Add Medication (External Prescribed)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--sage-200)] text-[var(--ink-soft)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.6} />
          </button>
        </div>

        <p className="font-body text-sm text-[var(--ink-soft)] mb-5">
          Add a medication that was prescribed outside our system. It will be marked as{" "}
          <strong className="text-[var(--ink)]">External</strong> in your routine.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
              Medicine Name *
            </label>
            <input
              type="text"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Amoxicillin"
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white"
              required
            />
          </div>

          <div>
            <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
              Dosage *
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 500mg, 10mg/ml"
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
                Frequency
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Twice daily"
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white"
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 7 days"
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white"
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional instructions or notes..."
              rows={2}
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 font-body bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Medication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
