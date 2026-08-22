"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAdminDashboardData,
  type AdminDashboardData,
} from "@/actions/admin/dashboard";
import { format } from "date-fns";
import {
  Users,
  UserPlus,
  CalendarCheck,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
} from "lucide-react";
import { ChartSection } from "@/components/shared/ChartSection";

const RANGE_OPTIONS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
] as const;

const STATUS_COLORS: Record<string, { dot: string; badge: string }> = {
  BOOKED: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800" },
  PENDING: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800" },
  PRESCRIBED: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { dot: "bg-rose-500", badge: "bg-rose-100 text-rose-800" },
  DID_NOT_VISIT: { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-700" },
};

export function AdminDashboardClient({
  initialData,
}: {
  initialData: AdminDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"day" | "week" | "month" | "year">("week");
  const [orgId, setOrgId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("range", range);
      if (orgId) fd.append("organizationId", orgId);
      setData(await getAdminDashboardData(fd));
    } catch (err: any) {
      setError(err.message ?? "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [range, orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    {
      label: "Active Doctors",
      value: data.stats.doctors,
      icon: Stethoscope,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      label: "Unique Patients",
      value: data.stats.patients,
      icon: UserPlus,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Appointments",
      value: data.stats.appointments,
      icon: CalendarCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      label: "Pending Approvals",
      value: data.stats.pendingApprovals,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  // ChartSection expects { date, booked, completed }
  const chartData = data.dailyChart.map((d) => ({
    date: d.date,
    booked: d.booked,
    completed: d.completed,
  }));

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs flex flex-wrap items-center gap-3">
        {/* Range pills */}
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-colors ${
                range === opt.value
                  ? "bg-[var(--teal-900)] text-white shadow-xs"
                  : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Org filter */}
        {data.organizations.length > 1 && (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[var(--ink-soft)] shrink-0" strokeWidth={1.6} />
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="rounded-full border border-[var(--sage-200)] px-3 py-1.5 text-xs font-mono bg-white"
            >
              <option value="">All Organizations</option>
              {data.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <span className="text-xs text-[var(--ink-soft)] font-mono ml-auto animate-pulse">
            Refreshing…
          </span>
        )}
        {error && (
          <span className="text-xs text-rose-600 font-body ml-auto flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </span>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-2xl border ${card.border} p-5 shadow-xs flex items-center gap-4`}
          >
            <div className={`p-2.5 rounded-xl ${card.bg} border ${card.border}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                {card.label}
              </p>
              <p className={`text-3xl font-display font-bold ${card.color}`}>
                {card.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle Row: Status breakdown + Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-xs">
          <h3 className="font-display text-base font-bold text-[var(--teal-900)] mb-4">
            Appointment Status Breakdown
          </h3>
          {Object.keys(data.statusCounts).length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[var(--ink-soft)] opacity-30 mb-2" />
              <p className="text-xs font-body text-[var(--ink-soft)]">No appointments in this period.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(data.statusCounts).map(([status, count]) => {
                const style = STATUS_COLORS[status] ?? {
                  dot: "bg-gray-400",
                  badge: "bg-gray-100 text-gray-700",
                };
                const total = Object.values(data.statusCounts).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                    <span className="text-xs font-mono flex-1 text-[var(--ink)]">
                      {status.replace("_", " ")}
                    </span>
                    <div className="flex-1 max-w-[100px] bg-[var(--sage-200)] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${style.dot}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily chart */}
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-xs">
          <h3 className="font-display text-base font-bold text-[var(--teal-900)] mb-4">
            Daily Appointments
          </h3>
          {chartData.length === 0 ? (
            <div className="py-6 text-center">
              <CalendarCheck className="w-8 h-8 mx-auto text-[var(--ink-soft)] opacity-30 mb-2" />
              <p className="text-xs font-body text-[var(--ink-soft)]">No data for this period.</p>
            </div>
          ) : (
            <ChartSection chartData={chartData} />
          )}
        </div>
      </div>

      {/* ── Recent Appointments ── */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-xs">
        <h3 className="font-display text-base font-bold text-[var(--teal-900)] mb-4">
          Recent Appointments
        </h3>
        {data.recentAppointments.length === 0 ? (
          <p className="text-xs font-body text-[var(--ink-soft)]">No recent appointments.</p>
        ) : (
          <div className="space-y-2.5">
            {data.recentAppointments.map((appt) => {
              const style = STATUS_COLORS[appt.status] ?? {
                dot: "bg-gray-400",
                badge: "bg-gray-100 text-gray-700",
              };
              return (
                <div
                  key={appt.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] hover:border-[var(--teal-900)]/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-sm text-[var(--ink)] truncate">
                      {appt.patientName}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)] font-body truncate">
                      Dr. {appt.doctorName}
                      {data.organizations.length > 1 && ` · ${appt.organizationName}`}
                    </p>
                    {appt.date && (
                      <p className="text-[11px] font-mono text-[var(--ink-soft)] mt-0.5">
                        {format(new Date(appt.date), "MMM dd, yyyy · hh:mm a")}
                      </p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${style.badge}`}>
                    {appt.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
