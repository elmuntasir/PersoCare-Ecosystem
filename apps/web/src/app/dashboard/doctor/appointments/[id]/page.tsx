import { requireRole } from "@/lib/get-current-dashboard-user";
import { getAppointmentById } from "@/actions/doctor/appointments";
import { AppointmentDetailClient } from "@/components/doctor/AppointmentDetailClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Appointment Detail | PersoCare" };

export default async function AppointmentDetailPage({ params }: PageProps) {
  await requireRole(["profession"]);
  const { id } = await params;

  let appointment;
  try {
    appointment = await getAppointmentById(id);
  } catch {
    notFound();
  }

  return (
    <div className="p-6 md:p-8">
      <AppointmentDetailClient appointment={appointment as Parameters<typeof AppointmentDetailClient>[0]["appointment"]} />
    </div>
  );
}
