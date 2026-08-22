"use client";

import { useState, useEffect, useTransition } from "react";
import { getDoctorAppointments } from "@/actions/doctor/appointments";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Building,
  Search,
  Filter,
  Stethoscope,
  FileText,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type Appointment = Awaited<ReturnType<typeof getDoctorAppointments>>[number];

interface DoctorAppointmentsClientProps {
  initialAppointments: Appointment[];
  organizations: Array<{ id: string; name: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  BOOKED: "bg-blue-100 text-blue-700",
  PRESCRIBED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  DID_NOT_VISIT: "bg-amber-100 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  BOOKED: "Booked",
  PRESCRIBED: "Prescribed",
  CANCELLED: "Cancelled",
  DID_NOT_VISIT: "Did Not Visit",
};

export function DoctorAppointmentsClient({
  initialAppointments,
  organizations,
}: DoctorAppointmentsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filters, setFilters] = useState({
    organizationId: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    patientName: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const fd = new FormData();
        if (filters.organizationId) fd.append("organizationId", filters.organizationId);
        if (filters.status) fd.append("status", filters.status);
        if (filters.dateFrom) fd.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) fd.append("dateTo", filters.dateTo);
        if (filters.patientName) fd.append("patientName", filters.patientName);
        const data = await getDoctorAppointments(fd);
        setAppointments(data);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const updateFilter = (key: keyof typeof filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const inputClass =
    "rounded-full border border-[var(--sage-200)] bg-white px-3 py-1.5 text-sm font-body text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]";

  return (
    <div className="space-y-5">
      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[var(--ink-soft)]">
          <Filter className="w-4 h-4" strokeWidth={1.6} />
          <span className="text-xs font-body">Filters</span>
        </div>

        <select
          value={filters.organizationId}
          onChange={(e) => updateFilter("organizationId", e.target.value)}
          className={inputClass}
        >
          <option value="">All Orgs</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className={inputClass}
        >
          <option value="">All Statuses</option>
          <option value="BOOKED">Booked</option>
          <option value="PRESCRIBED">Prescribed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="DID_NOT_VISIT">Did Not Visit</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => updateFilter("dateFrom", e.target.value)}
          className={inputClass}
        />
        <span className="text-xs text-[var(--ink-soft)]">→</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => updateFilter("dateTo", e.target.value)}
          className={inputClass}
        />

        <div className="flex-1 min-w-[160px] relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]"
            strokeWidth={1.6}
          />
          <input
            type="text"
            placeholder="Search patient…"
            value={filters.patientName}
            onChange={(e) => updateFilter("patientName", e.target.value)}
            className={`w-full pl-9 ${inputClass}`}
          />
        </div>

        {isPending && (
          <span className="text-xs text-[var(--ink-soft)] font-body animate-pulse">
            Updating…
          </span>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total",
            count: appointments.length,
            color: "text-[var(--teal-900)]",
            bg: "bg-white",
          },
          {
            label: "Booked",
            count: appointments.filter((a) => a.status === "BOOKED").length,
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            label: "Prescribed",
            count: appointments.filter((a) => a.status === "PRESCRIBED").length,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            label: "Cancelled",
            count: appointments.filter((a) => a.status === "CANCELLED").length,
            color: "text-rose-700",
            bg: "bg-rose-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-2xl border border-[var(--sage-200)] p-4 text-center shadow-sm`}
          >
            <p className={`font-display text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="font-body text-xs text-[var(--ink-soft)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Appointment List ── */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-12 text-center shadow-sm">
          <Stethoscope
            className="w-12 h-12 mx-auto text-[var(--ink-soft)] opacity-30 mb-3"
            strokeWidth={1.4}
          />
          <p className="font-body text-[var(--ink-soft)]">No appointments match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const hasPrescription = appt.prescriptions.length > 0;
            const statusColor = STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600";
            const slotTime = appt.bookedSlotTime ? new Date(appt.bookedSlotTime) : null;
            const patientName = appt.patientName || appt.patient?.name || "Guest patient";
            const patientPhone = appt.patientPhone || appt.patient?.phone || "";

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0 text-white font-semibold text-sm">
                      {patientName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body font-semibold text-[var(--ink)] text-sm">
                          {patientName}
                        </span>
                        {appt.serialNumber && (
                          <span className="text-[10px] font-mono bg-[var(--sage-200)] text-[var(--ink-soft)] px-2 py-0.5 rounded-full">
                            #{appt.serialNumber}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${statusColor}`}
                        >
                          {STATUS_LABELS[appt.status] ?? appt.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[var(--ink-soft)] font-body">
                        {slotTime && (
                          <>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" strokeWidth={1.6} />
                              {format(slotTime, "MMM dd, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" strokeWidth={1.6} />
                              {format(slotTime, "hh:mm a")}
                            </span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" strokeWidth={1.6} />
                          {appt.organization.name}
                        </span>
                        {patientPhone && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" strokeWidth={1.6} />
                            {patientPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {appt.status === "BOOKED" && !hasPrescription ? (
                      <Link
                        href={`/dashboard/doctor/appointments/${appt.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--coral)] text-white text-xs font-body font-semibold hover:opacity-90 transition-opacity shadow-sm"
                      >
                        <Stethoscope className="w-3.5 h-3.5" strokeWidth={1.8} />
                        Start Checkup
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/doctor/appointments/${appt.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] text-xs font-body font-semibold hover:bg-[var(--sage-200)] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" strokeWidth={1.8} />
                        {hasPrescription ? "View Prescription" : "View Details"}
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
