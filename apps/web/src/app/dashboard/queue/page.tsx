import { requireRole } from "@/lib/get-current-dashboard-user";

export default async function QueuePage() {
  // Real authorization, independent of whether the sidebar link was ever
  // shown — a direct /dashboard/queue visit from a patient bounces to
  // /dashboard instead of rendering doctor-only data.
  await requireRole(["profession"]);

  return (
    <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-[var(--coral)] mb-3">
        Today&apos;s Queue
      </p>
      <h1 className="font-display text-2xl text-[var(--teal-900)] mb-3">
        Your patients today
      </h1>
      <p className="text-[var(--ink-soft)] max-w-md">
        Full queue-management view for a verified professional — separate from
        the appointments summary shown in the shared Appointments tab.
      </p>
    </section>
  );
}
