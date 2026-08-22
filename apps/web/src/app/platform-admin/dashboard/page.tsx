import { getPlatformDashboardStats } from "@/actions/platform-admin/applications";
import { PlatformDashboardClient } from "@/components/platform-admin/PlatformDashboardClient";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const stats = await getPlatformDashboardStats();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--teal-900)] tracking-tight">
          Platform Governance &amp; Metrics
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          High-level operational stats and healthcare provider distribution.
        </p>
      </div>

      <PlatformDashboardClient stats={stats} />
    </div>
  );
}
