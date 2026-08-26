import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ClipboardList,
  LayoutDashboard,
  ArrowLeft,
  Users,
  Building2,
  FileText,
  Megaphone,
  Settings,
} from "lucide-react";
import { PageAnimationShell } from "@/components/layout/PageAnimationShell";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    redirect("/dashboard");
  }

  const navItems = [
    {
      href: "/platform-admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      href: "/platform-admin/users",
      label: "Manage Users",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      href: "/platform-admin/organizations",
      label: "Organizations",
      icon: Building2,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      href: "/platform-admin/applications",
      label: "Applications",
      icon: ClipboardList,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      href: "/platform-admin/audit",
      label: "Audit Log",
      icon: FileText,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
    {
      href: "/platform-admin/announcements",
      label: "Announcements",
      icon: Megaphone,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      href: "/platform-admin/settings",
      label: "Settings",
      icon: Settings,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--paper)] text-[var(--ink)]">
      {/* ── Platform Admin Sidebar ── */}
      <aside className="w-68 shrink-0 bg-[#18191a] text-[#e4e6eb] border-r border-[#2d2e30] flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-4">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--coral)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white block leading-tight">
                PersoCare
              </span>
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                Platform Admin
              </span>
            </div>
          </div>

          <div className="h-[1px] bg-[#2d2e30]" />

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#e4e6eb] hover:bg-[#3a3b3c] hover:text-white transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" strokeWidth={1.9} />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Link: Back to Main App Dashboard */}
        <div className="p-4 border-t border-[#2d2e30]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-[#b0b3b8] hover:text-white hover:bg-[#3a3b3c]/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to User App</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Content Body ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[var(--sage-200)] px-6 py-3.5 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="md:hidden font-display font-bold text-lg text-[var(--teal-900)]">
              Platform Admin
            </span>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                🛡️ Platform Owner Access
              </span>
              <span>· Logged in as {user.name} ({user.email})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/platform-admin/applications"
              className="text-xs font-body font-medium text-[var(--teal-900)] hover:underline px-2 py-1"
            >
              Pending Reviews
            </Link>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] text-xs font-body font-semibold text-[var(--teal-900)] hover:bg-[var(--sage-200)]/60 transition-colors"
            >
              Exit to Dashboard
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <PageAnimationShell className="w-full">{children}</PageAnimationShell>
        </main>
      </div>
    </div>
  );
}
