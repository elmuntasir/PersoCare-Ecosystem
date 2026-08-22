import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PrintBookingButton } from "@/components/public/PrintBookingButton";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function PublicBookingConfirmationPage({ params }: PageProps) {
  const { id } = params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      queue: { select: { queueDate: true } },
      patient: { select: { name: true, phone: true } },
      doctors: {
        include: { doctor: { select: { name: true } } },
      },
    },
  });

  if (!appointment) {
    notFound();
  }

  const doctorName = appointment.doctors[0]?.doctor.name || "Assigned doctor";
  const patientName = appointment.patientName || appointment.patient?.name || "Patient";
  const patientPhone = appointment.patientPhone || appointment.patient?.phone || "—";

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)]">Booking confirmed</p>
        <h1 className="mt-2 font-display text-3xl text-[var(--teal-900)]">Your serial is ready</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Please keep this page or print it for the chamber desk.
        </p>

        <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-[var(--sage-200)] bg-[var(--paper)] p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Serial number</p>
            <p className="mt-1 font-display text-4xl text-[var(--coral)]">#{appointment.serialNumber}</p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Status</p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {appointment.status}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Patient</p>
            <p className="mt-1 font-semibold text-[var(--ink)]">{patientName}</p>
            <p className="text-sm text-[var(--ink-soft)]">{patientPhone}</p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Doctor</p>
            <p className="mt-1 font-semibold text-[var(--ink)]">{doctorName}</p>
            <p className="text-sm text-[var(--ink-soft)]">{appointment.organization.name}</p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Date</p>
            <p className="mt-1 font-semibold text-[var(--ink)]">
              {appointment.bookedSlotTime
                ? format(new Date(appointment.bookedSlotTime), "EEEE, MMMM dd, yyyy")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Time</p>
            <p className="mt-1 font-semibold text-[var(--ink)]">
              {appointment.bookedSlotTime ? format(new Date(appointment.bookedSlotTime), "hh:mm a") : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <PrintBookingButton />
          <Link
            href={`/public-book?orgId=${appointment.organization.id}`}
            className="rounded-full border border-[var(--sage-200)] px-5 py-2.5 text-sm font-semibold text-[var(--teal-900)] transition-colors hover:bg-[var(--paper)]"
          >
            Book another serial
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--ink-soft)]">
          Queue date: {appointment.queue?.queueDate ? format(new Date(appointment.queue.queueDate), "MMM dd, yyyy") : "—"}
        </p>
      </div>
    </main>
  );
}
