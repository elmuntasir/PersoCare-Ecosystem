export function OrgAppointmentsView() {
  return (
    <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-[var(--coral)] mb-3">
        Appointments
      </p>
      <h1 className="font-display text-2xl text-[var(--teal-900)] mb-3">
        Appointments across your organization
      </h1>
      <p className="text-[var(--ink-soft)] max-w-md">
        Every doctor&apos;s queue for your organization, plus disruption tools
        (QueueDisruption, RescheduleOffer) — same route, org-scoped data.
      </p>
    </section>
  );
}
