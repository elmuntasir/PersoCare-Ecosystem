import { getSessionUser } from "@/lib/auth";
import { getMemberHistory } from "@/actions/admin/employees";
import { MemberHistoryClient } from "@/components/admin/MemberHistoryClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { redirect } from "next/navigation";

interface HistoryPageProps {
  searchParams: Promise<{ org?: string }>;
}

export default async function MemberHistoryPage({ searchParams }: HistoryPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const organizationId = resolvedParams.org;
  if (!organizationId) redirect("/admin/employees");

  const formData = new FormData();
  formData.append("organizationId", organizationId);
  const data = await getMemberHistory(formData);

  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminPageHeader
          eyebrow="Governance &amp; Audit Trail"
          backHref={`/admin/employees?org=${organizationId}`}
          backLabel="Back to Employees"
          title="Member Management History"
          description="Immutable log of all employee invitations, onboardings, role changes, and member removals."
        />
        <MemberHistoryClient initialData={data} organizationId={organizationId} />
      </div>
    </main>
  );
}
