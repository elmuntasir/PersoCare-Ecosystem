"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rescheduleAppointment } from "@/actions/appointments/rescheduleAppointment";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";

interface RescheduleModalProps {
  appointmentId: string;
  currentDate?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RescheduleModal({
  appointmentId,
  currentDate,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const router = useRouter();
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setError("Please select a new date and time.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("appointmentId", appointmentId);
      formData.append("newDate", new Date(newDate).toISOString());
      formData.append("reason", reason);

      await rescheduleAppointment(formData);
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reschedule appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl border border-[var(--sage-200)] relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--coral)] font-semibold">
              Update Schedule
            </span>
            <h3 className="font-display text-xl font-bold text-[var(--teal-900)]">
              Reschedule Appointment
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--sage-200)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        {currentDate && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] text-xs font-body text-[var(--ink-soft)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--teal-700)] shrink-0" />
            <span>
              Current slot: <strong className="text-[var(--ink)]">{new Date(currentDate).toLocaleString()}</strong>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1.5 font-medium">
              New Date &amp; Time *
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40"
                required
              />
            </div>
            <p className="text-[11px] font-body text-[var(--ink-soft)] mt-1">
              Must be within the doctor's active working days and hours.
            </p>
          </div>

          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1.5 font-medium">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 resize-none"
              placeholder="Why are you rescheduling?"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-full border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)] text-xs font-body font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 font-body font-semibold text-xs transition-opacity disabled:opacity-60 shadow-xs"
            >
              {loading ? "Saving..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
