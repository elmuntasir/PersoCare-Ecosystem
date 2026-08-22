"use client";

import { Clock, CheckCircle, AlertCircle, XCircle, AlertTriangle } from "lucide-react";

interface MedicineCardProps {
  id: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  status: "PENDING" | "DONE" | "LATE" | "MISSED";
  dosage: string;
  medicineName: string;
  isExternal: boolean;
  hasTimingInstructions: boolean;
  onMarkTaken: () => void;
  onViewDetails: () => void;
  isPending: boolean;
}

const statusConfig = {
  PENDING: {
    bg: "bg-white",
    border: "border-[var(--sage-200)]",
    badge: "bg-[var(--sage-200)] text-[var(--ink-soft)]",
    icon: Clock,
    label: "Pending",
    button: "bg-[var(--coral)] hover:opacity-90 text-white",
  },
  DONE: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/70",
    border: "border-emerald-300",
    badge: "bg-emerald-200 text-emerald-800",
    icon: CheckCircle,
    label: "Taken",
    button: "bg-emerald-500 hover:bg-emerald-600 text-white cursor-default opacity-70",
  },
  LATE: {
    bg: "bg-gradient-to-br from-amber-50 to-amber-100/70",
    border: "border-amber-300",
    badge: "bg-amber-200 text-amber-800",
    icon: AlertCircle,
    label: "Late",
    button: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  MISSED: {
    bg: "bg-gradient-to-br from-rose-50 to-rose-100/70",
    border: "border-rose-300",
    badge: "bg-rose-200 text-rose-800",
    icon: XCircle,
    label: "Missed",
    button: "bg-rose-500 hover:bg-rose-600 text-white",
  },
};

export function MedicineCard({
  label,
  startTime,
  endTime,
  status,
  dosage,
  isExternal,
  hasTimingInstructions,
  onMarkTaken,
  onViewDetails,
  isPending,
}: MedicineCardProps) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  const timeDisplay = startTime && endTime ? `${startTime} – ${endTime}` : "Time not set";

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-lg text-[var(--teal-900)] font-semibold">{label}</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ink-soft)] font-body mt-1">
            <Clock className="w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.6} />
            <span>{timeDisplay}</span>
            {dosage && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--sage-200)] text-xs font-mono">
                {dosage}
              </span>
            )}
            {isExternal && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={1.6} />
                External
              </span>
            )}
            {!hasTimingInstructions && !isExternal && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={1.6} />
                No Timing
              </span>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wider ${config.badge}`}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
          {config.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="px-4 py-2 rounded-full border border-[var(--sage-200)] bg-white text-[var(--teal-900)] font-medium transition-colors text-sm hover:bg-[var(--paper)]"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={onMarkTaken}
          disabled={isPending || status === "DONE"}
          className={`px-5 py-2 rounded-full font-medium transition-all text-sm disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--coral)] focus-visible:outline-offset-2 ${config.button}`}
        >
          {isPending ? "Saving..." : status === "DONE" ? "Taken ✓" : "Mark as Taken"}
        </button>
      </div>

      {status === "MISSED" && (
        <p className="mt-3 text-sm text-rose-700 font-body border-t border-rose-200 pt-3">
          ⚠️ This dose was missed. Consistency is crucial for effective treatment.
        </p>
      )}
      {status === "LATE" && (
        <p className="mt-3 text-sm text-amber-700 font-body border-t border-amber-200 pt-3">
          ⏰ Taken late — better than missing! Try to stay within your scheduled window.
        </p>
      )}
    </div>
  );
}
