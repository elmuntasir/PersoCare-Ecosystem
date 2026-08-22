"use client";

import { useState, useEffect } from "react";
import {
  getDoctorDashboardData,
  type DoctorDashboardData,
} from "@/actions/doctor/dashboard";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Building,
  CheckCircle,
  XCircle,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { FilterBar } from "@/components/shared/FilterBar";
import { ChartSection } from "@/components/shared/ChartSection";
import Link from "next/link";

interface DoctorDashboardClientProps {
  initialData: DoctorDashboardData;
}

export function DoctorDashboardClient({
  initialData,
}: DoctorDashboardClientProps) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState<"day" | "week" | "month" | "year">("week");
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fd = new FormData();
    fd.append("range", range);
    if (orgId) fd.append("organizationId", orgId);

    getDoctorDashboardData(fd)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      });

    return () => {
      cancelled = true;
    };
  }, [range, orgId]);

  const handleFilterChange = (newRange: string) => {
    setRange(newRange as "day" | "week" | "month" | "year");
  };

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrgId(e.target.value);
  };

  const customSummary = [
    {
      label: "Total Appointments",
      value: data.stats.total,
      icon: Calendar,
      color: "text-[var(--teal-900)]",
      bg: "bg-[var(--teal-900)]/10",
      border: "border-[var(--sage-200)]",
    },
    {
      label: "Pending / Booked",
      value: data.stats.pending,
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Completed (Prescribed)",
      value: data.stats.completed,
      icon: CheckCircle,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "Cancelled / Missed",
      value: data.stats.cancelled + data.stats.didNotVisit,
      icon: XCircle,
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters & Org Selector */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar
            filter={range}
            category="all"
            searchTerm=""
            onFilterChange={handleFilterChange}
            onSearchChange={() => {}}
            hideCategory
            hideSearch
          />

          <div className="flex items-center gap-2">
            <Building
              className="w-4 h-4 text-[var(--ink-soft)]"
              strokeWidth={1.6}
            />
            <select
              value={orgId}
              onChange={handleOrgChange}
              className="rounded-full border border-[var(--sage-200)] bg-[var(--paper)] px-3.5 py-1.5 text-xs font-body text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
            >
              <option value="">All Affiliated Facilities</option>
              {data.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">{error && <span className="text-xs text-rose-600 font-body">{error}</span>}</div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {customSummary.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-2xl border ${card.border} p-5 shadow-sm transition-transform hover:-translate-y-0.5 duration-150`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
                {card.label}
              </span>
              <div className="p-2 rounded-xl bg-white/70 border border-black/5">
                <card.icon className={`w-4 h-4 ${card.color}`} strokeWidth={1.8} />
              </div>
            </div>
            <p className={`text-3xl font-display font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
              Appointment Trends
            </h3>
            <p className="text-xs font-body text-[var(--ink-soft)]">
              Activity progression over selected period
            </p>
          </div>
        </div>

        {data.chartData.length === 0 ? (
          <div className="p-8 text-center bg-[var(--paper)] rounded-xl border border-[var(--sage-200)]">
            <p className="font-body text-xs text-[var(--ink-soft)]">
              No appointments recorded in this timeframe.
            </p>
          </div>
        ) : (
          <ChartSection chartData={data.chartData} />
        )}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
              Recent Consultations
            </h3>
            <p className="text-xs font-body text-[var(--ink-soft)]">
              Latest patient appointments and queue actions
            </p>
          </div>

          <Link
            href="/dashboard/doctor/appointments"
            className="text-xs font-body text-[var(--coral)] hover:underline flex items-center gap-1 font-medium"
          >
            <span>View all appointments</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <div className="p-8 text-center bg-[var(--paper)] rounded-xl border border-[var(--sage-200)]">
            <p className="font-body text-xs text-[var(--ink-soft)]">
              No recent appointments found.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recent.map((appt) => {
              const statusColor: Record<string, string> = {
                BOOKED: "bg-blue-100 text-blue-700",
                PENDING: "bg-amber-100 text-amber-700",
                PRESCRIBED: "bg-emerald-100 text-emerald-700",
                CANCELLED: "bg-rose-100 text-rose-700",
                DID_NOT_VISIT: "bg-gray-100 text-gray-700",
              };
              const patientName = appt.patientName || appt.patient?.name || "Guest patient";
              const patientPhone = appt.patientPhone || "";

              return (
                <div
                  key={appt.id}
                  className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] hover:border-[var(--teal-900)]/40 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {patientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-body font-bold text-sm text-[var(--ink)]">
                          {patientName}
                        </span>
                        {appt.serialNumber && (
                          <span className="text-[10px] font-mono bg-[var(--sage-200)] text-[var(--ink-soft)] px-2 py-0.5 rounded-full font-semibold">
                            #{appt.serialNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-[var(--ink-soft)] font-body">
                        <span>{appt.organization.name}</span>
                        {appt.bookedSlotTime && (
                          <>
                            <span>•</span>
                            <span>
                              {format(new Date(appt.bookedSlotTime), "MMM dd, yyyy · hh:mm a")}
                            </span>
                          </>
                        )}
                        {patientPhone && (
                          <>
                            <span>•</span>
                            <span>{patientPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        statusColor[appt.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {appt.status}
                    </span>

                    {appt.status === "BOOKED" && (
                      <Link
                        href={`/dashboard/doctor/appointments/${appt.id}`}
                        className="px-4 py-1.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 text-xs font-body font-semibold transition-opacity shadow-xs flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Start Checkup</span>
                      </Link>
                    )}

                    {appt.status === "PRESCRIBED" && (
                      <Link
                        href={`/dashboard/doctor/appointments/${appt.id}`}
                        className="px-3.5 py-1.5 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] text-xs font-body font-medium transition-colors"
                      >
                        View Prescription
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
