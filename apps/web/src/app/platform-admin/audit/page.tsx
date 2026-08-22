import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuditClient } from "@/components/platform-admin/AuditClient";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--teal-900)] tracking-tight">
          System Audit Log
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          Review critical platform events, organizational status changes, broadcasts, and administrative actions.
        </p>
      </div>

      <AuditClient />
    </div>
  );
}
