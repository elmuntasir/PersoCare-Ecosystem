"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardUser } from "@/lib/get-current-dashboard-user";
import { useState } from "react";
import { Bot, Feather } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { QuickNoteModal } from "@/components/healthDiary/QuickNoteModal";
import { HeaderBackButton } from "@/components/layout/HeaderBackButton";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/diet": "Diet & Nutrition",
  "/dashboard/exercise": "Exercise & Fitness",
  "/dashboard/medicine": "Medicine Routines",
  "/dashboard/log-history": "Log History",
  "/dashboard/health-diary": "Health Diary",
  "/health-diary": "Health Diary",
  "/dashboard/appointments": "Doctor Appointments",
  "/dashboard/queue": "Live Queue Tokens",
  "/dashboard/records": "Medical Records",
  "/dashboard/blood-donation": "Blood Donation Network",
  "/dashboard/profile": "User Profile",
  "/dashboard/settings": "Settings & Privacy",
  "/dashboard/ai": "AI Assistant",
  "/dashboard/organization": "My Organization",
  "/dashboard/doctor": "Doctor Portal",
  "/dashboard/doctor/schedule": "Doctor Schedule Editor",
  "/dashboard/doctor/my-organization": "My Affiliated Organization",
  "/dashboard/organization/admin": "Organization Admin Portal",
  "/admin/employees": "Employee Roster Management",
  "/admin/employees/history": "Governance & Audit Trail",
  "/dashboard/inventory": "Inventory Dashboard",
  "/dashboard/inventory/items": "Items",
  "/dashboard/inventory/add-item": "Add Items",
  "/dashboard/inventory/track": "Track Items",
  "/dashboard/inventory/track/history": "Track History",
  "/dashboard/inventory/blood-bags": "Blood Bags",
};

export function DashboardTopbar({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const roleLabel = user.primaryRole.label;

  // Determine current page title
  const pageTitle =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([route]) => route !== "/dashboard" && pathname.startsWith(route))?.[1] ||
    "Dashboard";

  return (
    <>
      <header className="flex items-center justify-between px-6 md:px-10 py-3.5 border-b border-[var(--sage-200)] bg-white">
        <div className="flex items-center gap-2.5">
          <HeaderBackButton />
          <h1 className="font-display font-bold text-lg text-[var(--teal-900)] tracking-tight">
            {pageTitle}
          </h1>
          {roleLabel ? (
            <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--sage-200)]/60 text-[var(--teal-900)] font-semibold">
              {roleLabel}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Session
          </span>
          <button
            type="button"
            onClick={() => setIsNoteModalOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--sage-200)] bg-white text-[var(--teal-900)] transition-colors hover:bg-[var(--paper)]"
            aria-label="Quick health note"
            title="Quick health note"
          >
            <Feather className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <Link
            href="/dashboard/ai"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--sage-200)] bg-white text-[var(--teal-900)] transition-colors hover:bg-[var(--paper)]"
            aria-label="AI Assistant"
          >
            <Bot className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <NotificationBell />
        </div>
      </header>

      <QuickNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
      />
    </>
  );
}
