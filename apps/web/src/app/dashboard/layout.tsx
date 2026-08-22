import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved once per request here; any page under /dashboard can call
  // requireDashboardUser() again for its own data needs at zero extra cost.
  const user = await requireDashboardUser();

  return (
    <div className="h-screen flex bg-[var(--paper)] overflow-hidden">
      <DashboardSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <DashboardTopbar user={user} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>
      <DashboardMobileNav user={user} />
    </div>
  );
}
