import { requireRole } from "@/lib/get-current-dashboard-user";
import { getDoctorOrganizations } from "@/actions/doctor/organization";
import { MyOrganizationClient } from "@/components/doctor/MyOrganizationClient";

export const metadata = { title: "My Organization | PersoCare" };

export default async function MyOrganizationPage() {
  await requireRole(["profession"]);
  const data = await getDoctorOrganizations();

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--teal-900)] font-semibold">
          My Organization
        </h1>
        <p className="font-body text-[var(--ink-soft)] mt-1">
          View your affiliations and respond to invitations.
        </p>
      </div>
      <MyOrganizationClient data={data as Parameters<typeof MyOrganizationClient>[0]["data"]} />
    </div>
  );
}
