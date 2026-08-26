"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  Pill,
  History,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Building2,
  FileText,
  ClipboardList,
  BarChart3,
  Users,
  Stethoscope,
  ClipboardCheck,
  Heart,
  Boxes,
  Activity,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { DashboardRole, DashboardUser } from "@/lib/get-current-dashboard-user";

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  bgColor: string;
  match?: (pathname: string) => boolean;
};

/**
 * Navigation items keyed by DashboardRole["kind"].
 * Each role gets a completely different set of nav items —
 * no shared list with visibility toggles.
 */
const NAV_MAP: Record<DashboardRole["kind"], NavItem[]> = {
  /** Regular patient user */
  user: [
    {
      id: "nav-dashboard",
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      match: (pathname) => pathname === "/dashboard",
    },
    {
      id: "nav-diet",
      href: "/dashboard/diet",
      label: "Diet Plan",
      icon: UtensilsCrossed,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      match: (pathname) => pathname === "/dashboard/diet",
    },
    {
      id: "nav-exercise",
      href: "/dashboard/exercise",
      label: "Exercise Log",
      icon: Dumbbell,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      match: (pathname) => pathname === "/dashboard/exercise",
    },
    {
      id: "nav-medicine",
      href: "/dashboard/medicine",
      label: "Medicine Log",
      icon: Pill,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      match: (pathname) => pathname === "/dashboard/medicine",
    },
    {
      id: "nav-metabolic-risk",
      href: "/dashboard/metabolic-risk",
      label: "Metabolic Risk Calculator",
      icon: Activity,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      match: (pathname) => pathname === "/dashboard/metabolic-risk",
    },
    {
      id: "nav-log-history",
      href: "/dashboard/log-history",
      label: "Log History",
      icon: History,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      match: (pathname) => pathname === "/dashboard/log-history",
    },
    {
      id: "nav-appointments",
      href: "/dashboard/appointments",
      label: "Appointments",
      icon: Calendar,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      match: (pathname) => pathname.startsWith("/dashboard/appointments"),
    },
    {
      id: "nav-records",
      href: "/dashboard/records",
      label: "Medical Records",
      icon: FileText,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      match: (pathname) => pathname === "/dashboard/records",
    },
    {
      id: "nav-blood-donation",
      href: "/dashboard/blood-donation",
      label: "Blood Donation",
      icon: Heart,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      match: (pathname) => pathname === "/dashboard/blood-donation",
    },
  ],

  /** Verified profession (doctor, physiotherapist, radiologist, etc.) */
  profession: [
    {
      id: "nav-dashboard",
      href: "/dashboard/doctor",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      match: (pathname) => pathname === "/dashboard/doctor",
    },
    {
      id: "nav-doctor-schedule",
      href: "/dashboard/doctor/schedule",
      label: "My Schedule",
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      match: (pathname) => pathname === "/dashboard/doctor/schedule",
    },
    {
      id: "nav-doctor-appointments",
      href: "/dashboard/doctor/appointments",
      label: "Appointments",
      icon: Calendar,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      match: (pathname) => pathname === "/dashboard/doctor/appointments",
    },
    {
      id: "nav-doctor-checkup",
      href: "/dashboard/doctor/appointments",
      label: "Checkup & Prescribe",
      icon: Stethoscope,
      color: "text-coral-400",
      bgColor: "bg-rose-500/10",
      match: (pathname) => pathname.startsWith("/dashboard/doctor/appointments/"),
    },
    {
      id: "nav-doctor-org",
      href: "/dashboard/doctor/my-organization",
      label: "My Organization",
      icon: Building2,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      match: (pathname) => pathname === "/dashboard/doctor/my-organization",
    },
    {
      id: "nav-records",
      href: "/dashboard/records",
      label: "Medical Records",
      icon: FileText,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      match: (pathname) => pathname === "/dashboard/records",
    },
  ],

  /** Organization admin or member with a role */
  org_role: [
    {
      id: "nav-admin-dashboard",
      href: "/dashboard/organization/admin",
      label: "Admin Dashboard",
      icon: LayoutDashboard,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      match: (pathname) => pathname === "/dashboard/organization/admin",
    },
    {
      id: "nav-manage-org",
      href: "/dashboard/organization",
      label: "Manage Organization",
      icon: Building2,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      match: (pathname) => pathname === "/dashboard/organization",
    },
    {
      id: "nav-manage-employees",
      href: "/dashboard/organization/employees",
      label: "Manage Employees",
      icon: Users,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      match: (pathname) => pathname === "/dashboard/organization/employees",
    },
    {
      id: "nav-pending-approvals",
      href: "/dashboard/organization/admin/approvals",
      label: "Pending Approvals",
      icon: ClipboardCheck,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      match: (pathname) => pathname === "/dashboard/organization/admin/approvals",
    },
    {
      id: "nav-donor-verifications",
      href: "/dashboard/blood-donation/admin/verifications",
      label: "Donor Verifications",
      icon: Heart,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      match: (pathname) => pathname === "/dashboard/blood-donation/admin/verifications",
    },
    {
      id: "nav-inventory",
      href: "/dashboard/inventory",
      label: "Inventory",
      icon: Boxes,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      match: (pathname) => pathname === "/dashboard/inventory",
    },
  ],

  /** Platform owner (super admin) */
  platform_owner: [
    {
      id: "nav-platform-dashboard",
      href: "/platform-admin/dashboard",
      label: "Platform Dashboard",
      icon: LayoutDashboard,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      match: (pathname) => pathname === "/platform-admin/dashboard",
    },
    {
      id: "nav-platform-users",
      href: "/platform-admin/users",
      label: "Manage Users",
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      match: (pathname) => pathname === "/platform-admin/users",
    },
    {
      id: "nav-platform-orgs",
      href: "/platform-admin/organizations",
      label: "Organizations",
      icon: Building2,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      match: (pathname) => pathname === "/platform-admin/organizations",
    },
    {
      id: "nav-platform-applications",
      href: "/platform-admin/applications",
      label: "Applications",
      icon: ClipboardList,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      match: (pathname) => pathname === "/platform-admin/applications",
    },
    {
      id: "nav-platform-audit",
      href: "/platform-admin/audit",
      label: "Audit Log",
      icon: FileText,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      match: (pathname) => pathname === "/platform-admin/audit",
    },
    {
      id: "nav-platform-announcements",
      href: "/platform-admin/announcements",
      label: "Announcements",
      icon: BarChart3,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      match: (pathname) => pathname === "/platform-admin/announcements",
    },
    {
      id: "nav-platform-settings",
      href: "/platform-admin/settings",
      label: "Platform Settings",
      icon: Settings,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      match: (pathname) => pathname === "/platform-admin/settings",
    },
  ],
};

export function DashboardSidebar({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV_MAP[user.primaryRole.kind] ?? NAV_MAP.user;
  const activeItemId =
    items.find((item) => item.match?.(pathname))?.id ??
    items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.id ??
    null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isProfileActive = pathname === "/dashboard/profile";

  /** Role badge shown under the user name */
  const roleBadge =
    user.primaryRole.kind === "platform_owner"
      ? "Platform Owner"
      : user.primaryRole.kind === "org_role"
        ? user.primaryRole.label
        : user.primaryRole.kind === "profession"
          ? user.primaryRole.label
          : null;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-xl bg-[#18191a] text-white border border-[#3a3b3c] shadow-md"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-68 shrink-0 h-full
          bg-[#18191a] text-[#e4e6eb] border-r border-[#2d2e30] flex flex-col justify-between
          transition-transform duration-200 select-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex-1 overflow-y-auto flex flex-col px-3 py-3 space-y-1">
          {/* Brand Header */}
          <div className="px-3 py-2 flex items-center gap-3 mb-1 shrink-0">
            <div className="w-9 h-9 flex items-center justify-center shadow-sm overflow-hidden">
              <Image src="/logos/logo_notxt.png" alt="PersoCare Icon" width={36} height={36} className="object-cover" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-white tracking-tight block leading-tight">
                <Image src="/logos/logo1.png" alt="PersoCare" width={120} height={28} className="object-contain brightness-0 invert" />
              </span>
              {user.primaryRole.kind === "platform_owner" && (
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">
                  Platform Admin
                </span>
              )}
              {user.primaryRole.kind === "org_role" && (
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider truncate max-w-[140px] block">
                  {user.primaryRole.organizationName}
                </span>
              )}
            </div>
          </div>

          {/* Profile Row */}
          <Link
            href="/dashboard/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
              isProfileActive
                ? "bg-[#3a3b3c] text-white font-semibold"
                : "text-[#e4e6eb] hover:bg-[#3a3b3c]/60"
            }`}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-500/40 group-hover:ring-emerald-400 transition-all">
              <div
                role="img"
                aria-label={user.name}
                className="h-full w-full bg-center bg-cover"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80)",
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight group-hover:text-white">
                {user.name}
              </p>
              {roleBadge ? (
                <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider truncate mt-0.5">
                  {roleBadge}
                </p>
              ) : (
                <p className="text-[11px] text-[#b0b3b8] truncate mt-0.5">View profile</p>
              )}
            </div>
          </Link>

          <div className="h-[1px] bg-[#2d2e30] my-2 mx-1 shrink-0" />

          {/* Navigation Links */}
          <nav className="space-y-0.5 flex-1">
            {items.map((item) => {
              const active =
                activeItemId === item.id;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    active
                      ? "bg-[#3a3b3c] text-white font-semibold shadow-xs"
                      : "text-[#e4e6eb] hover:bg-[#3a3b3c]/60 hover:text-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.bgColor} group-hover:brightness-125 transition-all`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.9} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: Settings & Log Out */}
        <div className="p-3 border-t border-[#2d2e30] space-y-0.5 shrink-0 bg-[#18191a]">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3.5 px-3 py-2.5 text-sm font-medium text-[#e4e6eb] hover:bg-[#3a3b3c]/60 rounded-xl transition-all duration-150 group"
          >
            <div className="w-9 h-9 rounded-full bg-[#3a3b3c]/50 flex items-center justify-center shrink-0 text-[#b0b3b8] group-hover:text-white transition-all">
              <Settings className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <span>Settings &amp; Privacy</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 text-sm font-medium text-[#e4e6eb] hover:bg-rose-950/30 hover:text-rose-300 rounded-xl transition-all duration-150 text-left group"
          >
            <div className="w-9 h-9 rounded-full bg-[#3a3b3c]/50 group-hover:bg-rose-900/40 flex items-center justify-center shrink-0 text-[#b0b3b8] group-hover:text-rose-300 transition-all">
              <LogOut className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
