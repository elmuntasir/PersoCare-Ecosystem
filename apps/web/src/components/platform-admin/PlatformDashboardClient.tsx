"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  Stethoscope,
  CalendarCheck,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { PlatformDashboardStats } from "@/actions/platform-admin/applications";

interface PlatformDashboardClientProps {
  stats: PlatformDashboardStats;
}

export function PlatformDashboardClient({ stats }: PlatformDashboardClientProps) {
  const cards = [
    {
      label: "Pending Applications",
      value: stats.pendingOrganizations,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      link: "/platform-admin/applications",
      actionText: "Review Applications",
    },
    {
      label: "Verified Facilities",
      value: stats.verifiedOrganizations,
      icon: Building2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      link: "/dashboard/appointments",
      actionText: "View Directory",
    },
    {
      label: "Verified Doctors",
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: "text-[var(--teal-900)]",
      bg: "bg-[var(--teal-900)]/8",
      border: "border-[var(--sage-200)]",
      link: "/dashboard/appointments",
      actionText: "Explore Specialists",
    },
    {
      label: "Total Consultations",
      value: stats.totalAppointments,
      icon: CalendarCheck,
      color: "text-[var(--coral)]",
      bg: "bg-[var(--coral)]/8",
      border: "border-[var(--sage-200)]",
      link: "/dashboard/appointments",
      actionText: "Appointment Hub",
    },
    {
      label: "Total Registered Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    },
    {
      label: "Total Organizations",
      value: stats.totalOrganizations,
      icon: ShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[var(--teal-900)] via-[#154a41] to-[#0f3b34] text-white shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Platform Overview &amp; Health</span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">
          Platform Owner Administration
        </h2>
        <p className="text-emerald-100/80 font-body text-sm max-w-xl">
          Supervise the PersoCare healthcare ecosystem, approve verified medical centers, and monitor live patient consults.
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`p-6 rounded-3xl bg-white border ${c.border || "border-[var(--sage-200)]"} shadow-xs flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl ${c.bg} ${c.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                </div>
                <span className="font-display text-3xl font-bold text-[var(--ink)]">
                  {c.value}
                </span>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                  {c.label}
                </p>
              </div>

              {c.link && c.actionText && (
                <div className="pt-3 border-t border-[var(--sage-200)]/60">
                  <Link
                    href={c.link}
                    className="inline-flex items-center gap-1 text-xs font-body font-semibold text-[var(--coral)] hover:underline"
                  >
                    <span>{c.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
