import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, ShieldCheck, Sliders, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformSettingsPage() {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--teal-900)] tracking-tight">
          Platform System Settings
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          Configure ecosystem parameters, feature flags, compliance guidelines, and security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--teal-900)]/10 text-[var(--teal-900)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-display text-lg font-bold text-[var(--teal-900)]">
            Ecosystem Security &amp; Compliance
          </h2>
          <p className="font-body text-xs text-[var(--ink-soft)]">
            HIPAA/GDPR compliance modules, tenant data isolation controls, and automated audit trails are active.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-medium">
              ● All Security Protocols Operational
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--coral)]/10 text-[var(--coral)] flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <h2 className="font-display text-lg font-bold text-[var(--teal-900)]">
            Platform Feature Flags &amp; Toggles
          </h2>
          <p className="font-body text-xs text-[var(--ink-soft)]">
            Manage organization self-registration, public doctor directories, and AI assistance integrations.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-mono font-medium">
              ● Global Features Active
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[var(--ink)]">
              Platform Ownership Credentials
            </h3>
            <p className="text-xs font-mono text-[var(--ink-soft)]">
              Primary Platform Owner: {user.email}
            </p>
          </div>
        </div>
        <p className="text-xs font-body text-[var(--ink-soft)] leading-relaxed">
          Platform ownership grants elevated root privileges across all medical centers, user accounts, and system-wide configurations. Access is restricted and audited via the system event log.
        </p>
      </div>
    </div>
  );
}
