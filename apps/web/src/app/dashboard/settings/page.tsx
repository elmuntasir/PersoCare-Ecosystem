import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { getSettings } from "@/actions/settings";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata = {
  title: "Settings | PersoCare",
};

export default async function SettingsPage() {
  await requireDashboardUser();
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[var(--teal-900)]">
            Settings &amp; Privacy
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Adjust language, reminder, and display preferences for your account.
          </p>
        </div>

        <SettingsClient initialSettings={settings} />
      </div>
    </div>
  );
}
