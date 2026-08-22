import { getPendingApplications } from "@/actions/platform-admin/applications";
import { ApplicationsClient } from "@/components/platform-admin/ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const applications = await getPendingApplications();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--teal-900)] tracking-tight">
          Organization Applications
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          Review, verify credentials, and approve or reject organization creation requests.
        </p>
      </div>

      <ApplicationsClient initialApplications={applications} />
    </div>
  );
}
