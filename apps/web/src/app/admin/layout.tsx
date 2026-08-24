import { requireRole } from "@/lib/get-current-dashboard-user";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["org_role"]);

  return (
    <DashboardShell user={user} showMobileNav={false}>
      {children}
    </DashboardShell>
  );
}
