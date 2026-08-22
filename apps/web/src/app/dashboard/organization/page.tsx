import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { getOrganizationForAdmin } from "@/actions/admin/invitations";
import { ManageOrganizationClient } from "@/components/organization/ManageOrganizationClient";

export default async function OrganizationPage() {
  const user = await requireDashboardUser();
  const data = await getOrganizationForAdmin();

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] tracking-tight font-bold">
              Manage Organization
            </h1>
            <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
              Configure your healthcare institution, location settings, and multi-admin governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {data.type === "admin" && data.organization ? (
              <>
                <a
                  href={`/dashboard/organization/employees`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] bg-white hover:bg-[var(--paper)] transition-all font-body text-xs font-semibold shadow-xs"
                >
                  👥 Manage Employees
                </a>
                <a
                  href={`/dashboard/organization/edit/${data.organization.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-800)] transition-all font-body text-xs font-semibold shadow-xs"
                >
                  ✏️ Edit Organization
                </a>
              </>
            ) : (
              <a
                href="/dashboard/organization/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-all font-body text-xs font-semibold shadow-xs"
              >
                ➕ Create Organization
              </a>
            )}
          </div>
        </div>

        <ManageOrganizationClient initialData={data} userEmail={user.email} />
      </div>
    </div>
  );
}
