"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileText,
  Home,
  LayoutDashboard,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
  Boxes,
  ClipboardList,
} from "lucide-react";
import type { DashboardUser } from "@/lib/get-current-dashboard-user";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  match?: (pathname: string) => boolean;
};

const NAVS: Record<DashboardUser["primaryRole"]["kind"], NavItem[]> = {
  user: [
    { href: "/dashboard", label: "Home", icon: Home, match: (pathname) => pathname === "/dashboard" },
    {
      href: "/dashboard/appointments",
      label: "Visits",
      icon: Calendar,
      match: (pathname) => pathname.startsWith("/dashboard/appointments"),
    },
    { href: "/dashboard/records", label: "Records", icon: FileText, match: (pathname) => pathname === "/dashboard/records" },
    { href: "/dashboard/medicine", label: "Medicine", icon: Pill, match: (pathname) => pathname === "/dashboard/medicine" },
  ],
  profession: [
    { href: "/dashboard/doctor", label: "Home", icon: LayoutDashboard, match: (pathname) => pathname === "/dashboard/doctor" },
    {
      href: "/dashboard/doctor/appointments",
      label: "Visits",
      icon: Calendar,
      match: (pathname) => pathname === "/dashboard/doctor/appointments" || pathname.startsWith("/dashboard/doctor/appointments/"),
    },
    { href: "/dashboard/doctor/schedule", label: "Schedule", icon: Stethoscope, match: (pathname) => pathname === "/dashboard/doctor/schedule" },
    { href: "/dashboard/records", label: "Records", icon: FileText, match: (pathname) => pathname === "/dashboard/records" },
  ],
  org_role: [
    { href: "/dashboard/organization/admin", label: "Admin", icon: ShieldCheck, match: (pathname) => pathname === "/dashboard/organization/admin" },
    { href: "/dashboard/organization", label: "Org", icon: Home, match: (pathname) => pathname === "/dashboard/organization" },
    { href: "/dashboard/inventory", label: "Stock", icon: Boxes, match: (pathname) => pathname === "/dashboard/inventory" },
    { href: "/dashboard/organization/employees", label: "Team", icon: Users, match: (pathname) => pathname === "/dashboard/organization/employees" },
  ],
  platform_owner: [
    { href: "/platform-admin/applications", label: "Apps", icon: ClipboardList, match: (pathname) => pathname === "/platform-admin/applications" },
    { href: "/platform-admin/dashboard", label: "Stats", icon: LayoutDashboard, match: (pathname) => pathname === "/platform-admin/dashboard" },
  ],
};

export function DashboardMobileNav({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  const items = NAVS[user.primaryRole.kind] ?? NAVS.user;
  const activeItemId =
    items.find((item) => item.match?.(pathname))?.href ??
    items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href ??
    null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--sage-200)] bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className={`grid ${items.length <= 4 ? "grid-cols-4" : "grid-cols-2"} gap-1 px-2 py-2`}>
        {items.map((item) => {
          const active = activeItemId === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-[var(--teal-900)] text-white shadow-sm"
                  : "text-[var(--ink-soft)] hover:bg-[var(--paper)]"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              <span className="mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
