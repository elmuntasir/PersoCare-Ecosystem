"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveScheduleRequest,
  rejectScheduleRequest,
  getPendingScheduleRequests,
} from "@/actions/doctor/scheduleApproval";
import { format } from "date-fns";
import {
  Clock,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Utensils,
} from "lucide-react";
import type { Prisma } from "@prisma/client";

type Request = Awaited<ReturnType<typeof getPendingScheduleRequests>>[number];

interface PendingApprovalsClientProps {
  initialRequests: Request[];
}

export function PendingApprovalsClient({ initialRequests }: PendingApprovalsClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("scheduleId", id);
      await approveScheduleRequest(fd);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve schedule");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("scheduleId", id);
      await rejectScheduleRequest(fd);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject schedule");
    } finally {
      setLoading(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-12 text-center shadow-xs">
        <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 opacity-60 mb-3" strokeWidth={1.6} />
        <h3 className="font-display text-lg font-bold text-[var(--teal-900)]">
          All Caught Up!
        </h3>
        <p className="font-body text-xs text-[var(--ink-soft)] mt-1">
          There are no pending doctor schedule approval requests for your organizations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-700 text-xs font-body flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {requests.map((req) => (
        <div
          key={req.id}
          className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {req.doctor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[var(--teal-900)]">
                    Dr. {req.doctor.name}
                  </h4>
                  <p className="text-xs text-[var(--ink-soft)] font-body">{req.doctor.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-body text-[var(--ink-soft)]">
                <Building className="w-4 h-4 text-[var(--teal-700)]" strokeWidth={1.6} />
                <span>
                  Facility: <strong className="text-[var(--ink)]">{req.organization.name}</strong>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] text-xs font-body space-y-2">
                <div className="flex flex-wrap gap-4 text-[var(--ink)]">
                  <span>
                    ⏱ Slot Duration: <strong>{req.assumedVisitDurationMinutes} mins</strong>
                  </span>
                  <span>
                    📋 Booking Mode: <strong>{req.approvalMode}</strong>
                  </span>
                  <span>
                    🕐 Hours: <strong>{req.startTime} – {req.endTime}</strong>
                  </span>
                </div>

                {req.lunchBreakStart && req.lunchBreakEnd && (
                  <div className="flex items-center gap-1.5 text-amber-800 font-mono text-[11px]">
                    <Utensils className="w-3 h-3 text-amber-600" />
                    <span>
                      Lunch Break: {req.lunchBreakStart} – {req.lunchBreakEnd}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[var(--ink-soft)] mr-1">Working Days:</span>
                  {req.workingDays.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded bg-white border border-[var(--sage-200)] text-[10px] font-mono"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-[var(--ink-soft)] flex items-center gap-1 pt-1 border-t border-[var(--sage-200)]/60">
                  <Clock className="w-3 h-3 text-[var(--coral)]" strokeWidth={1.6} />
                  <span>
                    Requested on {format(new Date(req.requestedAt), "MMM dd, yyyy · hh:mm a")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleApprove(req.id)}
                disabled={loading === req.id}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-body font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                {loading === req.id ? "Approving..." : "Approve Schedule"}
              </button>
              <button
                type="button"
                onClick={() => handleReject(req.id)}
                disabled={loading === req.id}
                className="px-5 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-body font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
