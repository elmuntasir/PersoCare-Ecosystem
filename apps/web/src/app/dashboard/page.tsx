import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const user = await requireDashboardUser();

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] tracking-[-0.01em]">
              Welcome back, {user.name}
            </h1>
            <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
              Your health overview, routine adherence, nutrition split &amp; upcoming agenda at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
          </div>
        </div>

        <DashboardClient />
      </div>
    </div>
  );
}
