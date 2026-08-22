"use client";

import { Utensils, Dumbbell, Pill, Calendar, Clock, AlertCircle, XCircle, Building } from "lucide-react";
import Link from "next/link";
import type { UpcomingItem, AppointmentData } from "@/actions/dashboard";

interface UpcomingCardsProps {
  items: UpcomingItem[];
  appointment: AppointmentData | null;
}

const typeConfig = {
  APPOINTMENT: {
    icon: Calendar,
    label: "Appointment",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    link: "/dashboard/appointments",
  },
  MEDICINE: {
    icon: Pill,
    label: "Medicine",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    link: "/dashboard/medicine",
  },
  FOOD: {
    icon: Utensils,
    label: "Diet",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    link: "/dashboard/diet",
  },
  EXERCISE: {
    icon: Dumbbell,
    label: "Exercise",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    link: "/dashboard/exercise",
  },
};

const statusConfig = {
  PENDING: {
    icon: Clock,
    label: "Upcoming",
    className: "text-[var(--ink-soft)] bg-[var(--sage-200)]",
  },
  LATE: {
    icon: AlertCircle,
    label: "Late",
    className: "text-amber-700 bg-amber-100",
  },
  MISSED: {
    icon: XCircle,
    label: "Missed",
    className: "text-rose-700 bg-rose-100",
  },
};

export function UpcomingCards({ items, appointment }: UpcomingCardsProps) {
  const routineCardTypes = ["MEDICINE", "FOOD", "EXERCISE"] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1st Card: Appointment First (Priority) */}
      {appointment ? (
        <Link
          href="/dashboard/appointments"
          className="bg-purple-50 rounded-2xl border border-purple-200 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <Calendar className="w-5 h-5 text-purple-600" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="font-body text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    Appointment
                  </p>
                  <p className="font-display font-semibold text-sm text-[var(--teal-900)] line-clamp-1">
                    Dr. {appointment.doctorName}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium text-purple-700 bg-purple-100 border border-purple-200">
                <Clock className="w-3 h-3" strokeWidth={2} />
                {appointment.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--ink-soft)]">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" strokeWidth={1.6} />
                <span>{appointment.date}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" strokeWidth={1.6} />
                <span>{appointment.time}</span>
              </div>
            </div>

            <div className="mt-1 text-xs font-body text-[var(--ink-soft)] truncate">
              <Building className="w-3 h-3 inline mr-1 text-[var(--ink-soft)]" strokeWidth={1.6} />
              {appointment.organization}
            </div>
          </div>

          <div className="mt-2 text-[10px] font-mono text-purple-700 bg-purple-100/60 py-0.5 px-2 rounded-md text-center">
            Upcoming Consultation
          </div>
        </Link>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 shadow-sm text-center flex flex-col items-center justify-center min-h-[160px]">
          <Calendar className="w-8 h-8 text-[var(--ink-soft)] opacity-30" strokeWidth={1.6} />
          <p className="font-body text-sm text-[var(--ink-soft)] mt-2">No upcoming appointments</p>
          <Link
            href="/dashboard/appointments"
            className="inline-block mt-3 text-sm font-medium text-[var(--coral)] hover:underline"
          >
            Book →
          </Link>
        </div>
      )}

      {/* Routine Cards: Medicine, Diet, Exercise */}
      {routineCardTypes.map((type) => {
        const item = items.find((i) => i.type === type);
        const config = typeConfig[type];

        if (!item) {
          return (
            <div
              key={type}
              className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 shadow-sm text-center flex flex-col items-center justify-center min-h-[160px]"
            >
              <config.icon className="w-8 h-8 text-[var(--ink-soft)] opacity-30" strokeWidth={1.6} />
              <p className="font-body text-sm text-[var(--ink-soft)] mt-2">No upcoming {config.label.toLowerCase()}</p>
              <Link
                href={config.link}
                className="inline-block mt-3 text-sm font-medium text-[var(--coral)] hover:underline"
              >
                Add →
              </Link>
            </div>
          );
        }

        const status = statusConfig[item.status] || statusConfig.PENDING;
        const StatusIcon = status.icon;
        const timeDisplay =
          item.startTime && item.endTime
            ? `${item.startTime}–${item.endTime}`
            : item.startTime || "—";

        return (
          <Link
            key={item.id}
            href={config.link}
            className={`${config.bg} rounded-2xl border ${config.border} p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 flex flex-col justify-between min-h-[160px]`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${config.bg} border ${config.border}`}>
                    <config.icon className={`w-5 h-5 ${config.color}`} strokeWidth={1.6} />
                  </div>
                  <div>
                    <p className="font-body text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                      {config.label}
                    </p>
                    <p className="font-display font-semibold text-sm text-[var(--teal-900)] line-clamp-1">
                      {item.label}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${status.className}`}>
                  <StatusIcon className="w-3 h-3" strokeWidth={2} />
                  {status.label}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)] font-body">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.6} />
                <span>{timeDisplay}</span>
              </div>
            </div>

            <div className="mt-2 text-xs font-body text-[var(--ink-soft)]/80">
              {item.status === "MISSED" && "⏰ Target window passed — mark done"}
              {item.status === "LATE" && "⏳ Running late — better late than never!"}
              {item.status === "PENDING" && "🔔 Coming up next"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
