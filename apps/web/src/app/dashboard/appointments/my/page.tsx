import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { getMyAppointments } from "@/actions/appointments/getMyAppointments";
import { MyAppointmentsSection } from "@/components/appointments/MyAppointmentsSection";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyAppointmentsPage() {
  await requireDashboardUser();
  const appointments = await getMyAppointments().catch(() => []);

  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)]">
          <Link
            href="/dashboard/appointments"
            className="hover:text-[var(--coral)] transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Find Appointments</span>
          </Link>
          <span>/</span>
          <span className="text-[var(--teal-900)] font-medium">My Bookings</span>
        </div>

        <MyAppointmentsSection appointments={appointments} />
      </div>
    </main>
  );
}
