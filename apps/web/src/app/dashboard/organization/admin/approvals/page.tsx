import { requireRole } from "@/lib/get-current-dashboard-user";
import { getPendingScheduleRequests } from "@/actions/doctor/scheduleApproval";
import { PendingApprovalsClient } from "@/components/admin/PendingApprovalsClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata = { title: "Pending Approvals | PersoCare Admin" };

export default async function PendingApprovalsPage() {
  await requireRole(["org_role", "platform_owner"]);

  const pending = (await getPendingScheduleRequests().catch(() => [])) as Awaited<
    ReturnType<typeof getPendingScheduleRequests>
  >;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <AdminPageHeader
        backHref="/dashboard/organization/admin"
        backLabel="Back to Admin Dashboard"
        title="Doctor Schedule Approvals"
        description="Review and activate or decline working hours and consultation shift updates submitted by doctors."
      />

      <PendingApprovalsClient initialRequests={pending} />
    </div>
  );
}
