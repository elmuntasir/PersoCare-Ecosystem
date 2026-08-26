"use client";

import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { PageTransitionWrapper } from "@/components/layout/PageTransitionWrapper";
import { PageAnimationShell } from "@/components/layout/PageAnimationShell";
import type { DashboardUser } from "@/lib/get-current-dashboard-user";

type DashboardShellProps = {
  user: DashboardUser;
  children: ReactNode;
  showMobileNav?: boolean;
};

export function DashboardShell({
  user,
  children,
  showMobileNav = true,
}: DashboardShellProps) {
  return (
    <div className="h-screen flex bg-[var(--paper)] overflow-hidden">
      {/* Sidebar stays static — only content animates */}
      <DashboardSidebar user={user} />

      {/* Role switch scale/blur; route changes fade+slide inside main */}
      <PageTransitionWrapper>
        <DashboardTopbar user={user} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <PageAnimationShell>{children}</PageAnimationShell>
        </main>
      </PageTransitionWrapper>

      {showMobileNav && <DashboardMobileNav user={user} />}
    </div>
  );
}
