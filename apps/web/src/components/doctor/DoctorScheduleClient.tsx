"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule,
} from "@/actions/doctor/schedule";
import {
  Calendar,
  Clock,
  Building,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Utensils,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  organizationId: string;
  organization?: { id: string; name: string; slug: string } | null;
  assumedVisitDurationMinutes: number;
  approvalMode: "AUTO" | "MANUAL";
  workingDays: string[];
  startTime: string;
  endTime: string;
  lunchBreakStart?: string | null;
  lunchBreakEnd?: string | null;
  isActive: boolean;
}

interface OrganizationOption {
  id: string;
  name: string;
}

interface DoctorScheduleClientProps {
  initialSchedules: ScheduleItem[];
  organizations: OrganizationOption[];
  doctorId: string;
}

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function DoctorScheduleClient({
  initialSchedules,
  organizations,
  doctorId,
}: DoctorScheduleClientProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  const [organizationId, setOrganizationId] = useState("");
  const [workingDays, setWorkingDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [lunchStart, setLunchStart] = useState("");
  const [lunchEnd, setLunchEnd] = useState("");
  const [duration, setDuration] = useState(15);
  const [approvalMode, setApprovalMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingSchedule(null);
    setOrganizationId(organizations[0]?.id || "");
    setWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setStartTime("09:00");
    setEndTime("17:00");
    setLunchStart("");
    setLunchEnd("");
    setDuration(15);
    setApprovalMode("AUTO");
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: ScheduleItem) => {
    setEditingSchedule(s);
    setOrganizationId(s.organizationId);
    setWorkingDays(s.workingDays);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setLunchStart(s.lunchBreakStart || "");
    setLunchEnd(s.lunchBreakEnd || "");
    setDuration(s.assumedVisitDurationMinutes);
    setApprovalMode(s.approvalMode);
    setIsActive(s.isActive);
    setError(null);
    setIsModalOpen(true);
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      setError("Please select an organization");
      return;
    }
    if (workingDays.length === 0) {
      setError("Select at least one working day");
      return;
    }
    if ((lunchStart && !lunchEnd) || (!lunchStart && lunchEnd)) {
      setError("Please provide both lunch break start and end times, or leave both empty.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("doctorUserId", doctorId);
    formData.append("organizationId", organizationId);
    formData.append("assumedVisitDurationMinutes", duration.toString());
    formData.append("approvalMode", approvalMode);
    formData.append("workingDays", JSON.stringify(workingDays));
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("lunchBreakStart", lunchStart);
    formData.append("lunchBreakEnd", lunchEnd);
    formData.append("isActive", isActive.toString());

    try {
      if (editingSchedule) {
        formData.append("scheduleId", editingSchedule.id);
        await updateDoctorSchedule(formData);
      } else {
        await createDoctorSchedule(formData);
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const formData = new FormData();
      formData.append("scheduleId", scheduleId);
      await deleteDoctorSchedule(formData);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--teal-900)]">
            Consultation Schedules
          </h2>
          <p className="text-xs font-body text-[var(--ink-soft)] mt-0.5">
            Configure your visiting days, consultation hours, lunch breaks, and slot durations for each hospital or clinic.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={organizations.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 font-body font-semibold text-xs transition-opacity shadow-xs disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Schedule</span>
        </button>
      </div>

      {organizations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-8 text-center">
          <Building className="w-10 h-10 text-[var(--ink-soft)] mx-auto mb-2 opacity-50" />
          <p className="font-body text-sm text-[var(--ink)] font-semibold">
            No affiliated healthcare facilities found
          </p>
          <p className="font-body text-xs text-[var(--ink-soft)] mt-1">
            Accept an invitation from a hospital or clinic under "My Organization" to set up your visiting hours.
          </p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-10 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-[var(--sage-200)] mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold text-[var(--teal-900)]">
            No Schedules Configured
          </h3>
          <p className="text-xs font-body text-[var(--ink-soft)] max-w-sm mx-auto mt-1 mb-4">
            You haven't set up working hours for your affiliated healthcare organizations yet.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] text-xs font-body font-semibold transition-colors"
          >
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((s) => {
            const orgName = s.organization?.name || "Healthcare Facility";
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--teal-900)]/10 text-[var(--teal-900)] flex items-center justify-center font-bold">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-body font-bold text-sm text-[var(--teal-900)]">
                        {orgName}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          s.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.isActive ? "ACTIVE" : "PAUSED"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-1.5 rounded-lg text-[var(--ink-soft)] hover:bg-[var(--sage-200)] transition-colors"
                      title="Edit Schedule"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-body">
                  <div className="flex items-center gap-2 text-[var(--ink)]">
                    <Clock className="w-3.5 h-3.5 text-[var(--coral)]" />
                    <span>
                      Visiting Hours: <strong>{s.startTime} – {s.endTime}</strong> ({s.assumedVisitDurationMinutes} mins / slot)
                    </span>
                  </div>

                  {s.lunchBreakStart && s.lunchBreakEnd && (
                    <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 text-[11px] font-mono">
                      <Utensils className="w-3 h-3 text-amber-600" />
                      <span>
                        Lunch Break: <strong>{s.lunchBreakStart} – {s.lunchBreakEnd}</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {s.workingDays.map((day) => (
                      <span
                        key={day}
                        className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--sage-200)] text-[11px] font-mono text-[var(--ink)]"
                      >
                        {day}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[var(--sage-200)]/60 text-[11px] font-mono text-[var(--ink-soft)]">
                    Approval Mode: <strong className="text-[var(--teal-900)]">{s.approvalMode}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-[var(--sage-200)] relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--coral)] font-semibold">
                  {editingSchedule ? "Modify Schedule" : "New Setup"}
                </span>
                <h3 className="font-display text-xl font-bold text-[var(--teal-900)]">
                  {editingSchedule ? "Edit Working Schedule" : "Add Consultation Schedule"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--sage-200)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Select */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                  Healthcare Organization *
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  disabled={!!editingSchedule}
                  required
                  className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2.5 font-body text-sm text-[var(--ink)] disabled:opacity-60"
                >
                  <option value="">-- Choose Facility --</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                  Working Days *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map((day) => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                          isSelected
                            ? "bg-[var(--teal-900)] text-white font-semibold"
                            : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shift Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Lunch Break (Optional) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)]">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1">
                    Lunch Break Start (Optional)
                  </label>
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                    className="w-full rounded-xl border border-[var(--sage-200)] bg-white px-3 py-1.5 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1">
                    Lunch Break End (Optional)
                  </label>
                  <input
                    type="time"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                    className="w-full rounded-xl border border-[var(--sage-200)] bg-white px-3 py-1.5 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Duration & Approval Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                    Visit Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                    Approval Mode
                  </label>
                  <select
                    value={approvalMode}
                    onChange={(e) => setApprovalMode(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-2 font-mono text-sm"
                  >
                    <option value="AUTO">AUTO (Instant Confirm)</option>
                    <option value="MANUAL">MANUAL (Doctor Approval)</option>
                  </select>
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-[var(--sage-200)] text-[var(--teal-900)] focus:ring-[var(--coral)]"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-body text-[var(--ink)] font-medium cursor-pointer">
                  Schedule is Active and accepting patient appointments
                </label>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--sage-200)]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="px-5 py-2 rounded-full border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)] text-xs font-body font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 text-xs font-body font-semibold disabled:opacity-60 shadow-xs"
                >
                  {loading ? "Saving..." : editingSchedule ? "Update Schedule" : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
