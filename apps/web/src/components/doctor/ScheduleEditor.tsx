"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestScheduleApproval } from "@/actions/doctor/scheduleApproval";
import {
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Utensils,
} from "lucide-react";

interface Schedule {
  id: string;
  assumedVisitDurationMinutes: number;
  approvalMode: "AUTO" | "MANUAL";
  workingDays: string[];
  startTime: string;
  endTime: string;
  lunchBreakStart: string | null;
  lunchBreakEnd: string | null;
  isActive: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string | null;
  reviewedAt?: string | null;
}

interface ScheduleEditorProps {
  organizationId: string;
  currentSchedule: Schedule | null;
  pendingSchedule: Schedule | null;
  rejectedSchedule?: Schedule | null;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ScheduleEditor({
  organizationId,
  currentSchedule,
  pendingSchedule,
  rejectedSchedule,
}: ScheduleEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPending = pendingSchedule !== null;
  const activeData = pendingSchedule || currentSchedule;

  const [duration, setDuration] = useState(activeData?.assumedVisitDurationMinutes || 15);
  const [approvalMode, setApprovalMode] = useState<"AUTO" | "MANUAL">(activeData?.approvalMode || "AUTO");
  const [workingDays, setWorkingDays] = useState<string[]>(
    activeData?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  );
  const [startTime, setStartTime] = useState(activeData?.startTime || "09:00");
  const [endTime, setEndTime] = useState(activeData?.endTime || "17:00");
  const [lunchStart, setLunchStart] = useState(activeData?.lunchBreakStart || "");
  const [lunchEnd, setLunchEnd] = useState(activeData?.lunchBreakEnd || "");

  useEffect(() => {
    if (activeData) {
      setDuration(activeData.assumedVisitDurationMinutes);
      setApprovalMode(activeData.approvalMode);
      setWorkingDays(activeData.workingDays);
      setStartTime(activeData.startTime);
      setEndTime(activeData.endTime);
      setLunchStart(activeData.lunchBreakStart || "");
      setLunchEnd(activeData.lunchBreakEnd || "");
    }
  }, [activeData]);

  const toggleDay = (day: string) => {
    if (isPending) return;
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) {
      setError("You already have a pending schedule change request. Please wait for admin approval.");
      return;
    }
    if (workingDays.length === 0) {
      setError("Please select at least one working day.");
      return;
    }
    if (startTime >= endTime) {
      setError("Start time must be before end time.");
      return;
    }
    if (lunchStart && lunchEnd && lunchStart >= lunchEnd) {
      setError("Lunch break start must be before end time.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("assumedVisitDurationMinutes", String(duration));
      formData.append("approvalMode", approvalMode);
      formData.append("workingDays", JSON.stringify(workingDays));
      formData.append("startTime", startTime);
      formData.append("endTime", endTime);
      if (lunchStart) formData.append("lunchBreakStart", lunchStart);
      if (lunchEnd) formData.append("lunchBreakEnd", lunchEnd);

      await requestScheduleApproval(formData);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit schedule request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 md:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sage-200)]/60 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--coral)]" strokeWidth={1.8} />
          <h4 className="font-display text-base font-bold text-[var(--teal-900)]">
            Consultation Hours &amp; Schedule
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {rejectedSchedule && !isPending && (
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
              <XCircle className="w-3 h-3 text-rose-600" />
              Schedule Request Rejected
            </span>
          )}
          {isPending && (
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
              Waiting for Admin Approval
            </span>
          )}
          {currentSchedule?.isActive && !isPending && (
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Active Working Schedule
            </span>
          )}
          {!currentSchedule && !isPending && !rejectedSchedule && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              Not Configured
            </span>
          )}
        </div>
      </div>

      {rejectedSchedule && !isPending && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-body flex items-start gap-2">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <span>
            Your previous schedule request was <strong>Rejected</strong> by the facility administration. You can adjust your hours below and submit a new request.
          </span>
        </div>
      )}

      {isPending && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-body flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <span>
            You requested a schedule update on{" "}
            <strong>
              {pendingSchedule?.requestedAt
                ? new Date(pendingSchedule.requestedAt).toLocaleDateString()
                : "recently"}
            </strong>
            . The facility admin will review and activate it soon.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Working Days */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
            Working Days *
          </label>
          <div className="flex flex-wrap gap-1.5">
            {days.map((day) => {
              const isSelected = workingDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    isSelected
                      ? "bg-[var(--teal-900)] text-white font-semibold shadow-xs"
                      : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shift Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm disabled:opacity-60"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm disabled:opacity-60"
              required
            />
          </div>
        </div>

        {/* Lunch Break */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)]">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1 flex items-center gap-1">
              <Utensils className="w-3 h-3 text-amber-600" />
              Lunch Start (Optional)
            </label>
            <input
              type="time"
              value={lunchStart}
              onChange={(e) => setLunchStart(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-white px-3 py-1.5 font-mono text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1 flex items-center gap-1">
              <Utensils className="w-3 h-3 text-amber-600" />
              Lunch End (Optional)
            </label>
            <input
              type="time"
              value={lunchEnd}
              onChange={(e) => setLunchEnd(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-white px-3 py-1.5 font-mono text-sm disabled:opacity-60"
            />
          </div>
        </div>

        {/* Duration & Approval Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1">
              Visit Duration (Mins)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={isPending}
              min={5}
              max={120}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm disabled:opacity-60"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1">
              Patient Booking Mode
            </label>
            <select
              value={approvalMode}
              onChange={(e) => setApprovalMode(e.target.value as "AUTO" | "MANUAL")}
              disabled={isPending}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm disabled:opacity-60"
            >
              <option value="AUTO">AUTO (Instant Confirm)</option>
              <option value="MANUAL">MANUAL (Doctor Approval)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--sage-200)]/60">
          {!isPending ? (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 font-body font-semibold text-xs transition-opacity disabled:opacity-60 shadow-xs flex items-center gap-1.5"
            >
              {loading ? "Submitting Request..." : "Submit Schedule for Approval"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-5 py-2 rounded-full bg-[var(--sage-200)] text-[var(--ink-soft)] cursor-not-allowed font-body text-xs font-medium"
            >
              Request Pending Admin Approval
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
