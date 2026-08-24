import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDashboardUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
