import { getSessionUser } from "@/lib/auth";
import { getOrganizationForAdmin } from "@/actions/admin/invitations";
import { EmployeesClient } from "@/components/organization/EmployeesClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { redirect } from "next/navigation";

export default async function AdminEmployeesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getOrganizationForAdmin();

  if (data.type !== "admin" || !data.organization) {
    redirect("/dashboard/organization");
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminPageHeader
          backHref="/dashboard/organization"
          backLabel="Back to Organization"
          title="Manage Employees"
          description="Invite and manage your organization's staff."
        />
        <EmployeesClient
          organizationId={data.organization.id}
          currentUserId={user.id}
        />
      </div>
    </main>
  );
}
