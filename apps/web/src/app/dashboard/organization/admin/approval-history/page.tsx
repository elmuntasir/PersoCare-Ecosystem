import { requireRole } from "@/lib/get-current-dashboard-user";
import { getApprovalHistory } from "@/actions/admin/approvalHistory";
import { ApprovalHistoryClient } from "@/components/admin/ApprovalHistoryClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata = {
  title: "Approval History – PersoCare",
  description: "View all approved and rejected doctor schedule requests.",
};

export default async function ApprovalHistoryPage() {
  await requireRole(["org_role"]);

  const formData = new FormData();
  const data = await getApprovalHistory(formData);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <AdminPageHeader
          backHref="/dashboard/organization/admin/approvals"
          backLabel="Back to Approvals"
          title="Approval History"
          description="All reviewed schedule requests — approved and rejected."
        />
      </div>

      <ApprovalHistoryClient initialData={data} />
    </div>
  );
}
