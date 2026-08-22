import { requireRole } from "@/lib/get-current-dashboard-user";
import { getAdminDashboardData } from "@/actions/admin/dashboard";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata = {
  title: "Admin Dashboard – PersoCare",
  description: "Overview of your organization's performance and appointments.",
};

export default async function AdminDashboardPage() {
  await requireRole(["org_role"]);

  const formData = new FormData();
  formData.append("range", "week");
  const data = await getAdminDashboardData(formData);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <AdminPageHeader
          title="Admin Dashboard"
          description="Organization performance overview · updated on load"
        />
      </div>

      <AdminDashboardClient initialData={data} />
    </div>
  );
}
