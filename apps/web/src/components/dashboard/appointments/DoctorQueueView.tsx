export function DoctorQueueView() {
  return (
    <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-[var(--coral)] mb-3">
        Appointments
      </p>
      <h1 className="font-display text-2xl text-[var(--teal-900)] mb-3">
        Today&apos;s queue
      </h1>
      <p className="text-[var(--ink-soft)] max-w-md">
        Patients booked against your DoctorSchedule for today, in queue order,
        with prescribe / skip / cancel actions on each — same URL as the
        patient view, different data and actions for a verified profession.
      </p>
    </section>
  );
}
