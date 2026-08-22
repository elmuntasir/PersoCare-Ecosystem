import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { AvatarSection } from "@/components/ai/AvatarSection";
import { AIConfigSection } from "@/components/ai/AIConfigSection";

export const metadata = {
  title: "AI Assistant | PersoCare",
};

export default async function AiPage() {
  const user = await requireDashboardUser();

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--teal-900)] text-white shadow-sm">
            <span className="text-2xl">AI</span>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)]">AI</p>
            <h1 className="font-display text-3xl text-[var(--teal-900)]">Assistant Hub</h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Avatar and AI Config are centralized here for {user.name}.
            </p>
          </div>
        </div>

        <AvatarSection username={user.name} />
        <AIConfigSection />
      </div>
    </div>
  );
}
