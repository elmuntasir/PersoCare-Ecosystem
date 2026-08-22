import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnnouncementsClient } from "@/components/platform-admin/AnnouncementsClient";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--teal-900)] tracking-tight">
          Send System Announcements
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          Broadcast critical alerts, system maintenance notices, or updates to all users or filtered roles.
        </p>
      </div>

      <AnnouncementsClient />
    </div>
  );
}
