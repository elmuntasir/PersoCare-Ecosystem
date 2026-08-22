import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { PatientAppointmentsView } from "@/components/dashboard/appointments/PatientAppointmentsView";

export default async function AppointmentsPage() {
  await requireDashboardUser();
  return <PatientAppointmentsView />;
}
