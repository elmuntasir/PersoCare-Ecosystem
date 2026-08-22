import { requireRole } from "@/lib/get-current-dashboard-user";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["org_role"]);

  return (
    <div className="h-screen flex bg-[var(--paper)] overflow-hidden">
      <DashboardSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <DashboardTopbar user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
