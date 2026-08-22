import { getSessionUser } from "@/lib/auth";
import { getOrganizationForAdmin } from "@/actions/admin/invitations";
import { EmployeesClient } from "@/components/organization/EmployeesClient";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getOrganizationForAdmin();

  if (data.type !== "admin" || !data.organization) {
    redirect("/dashboard/organization");
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] tracking-tight font-bold">
            Manage Employees
          </h1>
          <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
            Invite and manage medical staff, nurses, receptionists, and managers for {data.organization.name}.
          </p>
        </div>

        <EmployeesClient
          organizationId={data.organization.id}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
