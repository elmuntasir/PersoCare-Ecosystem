import { requireRole } from "@/lib/get-current-dashboard-user";
import { getDoctorDashboardData } from "@/actions/doctor/dashboard";
import { DoctorDashboardClient } from "@/components/doctor/DoctorDashboardClient";

export const metadata = { title: "Doctor Dashboard | PersoCare" };

export default async function DoctorDashboardPage() {
  await requireRole(["profession"]);

  const formData = new FormData();
  formData.append("range", "week");
  const initialData = await getDoctorDashboardData(formData);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-3xl text-[var(--teal-900)] font-semibold">
          Doctor Dashboard
        </h1>
        <p className="font-body text-[var(--ink-soft)] mt-1">
          Overview of your patient consultations, queue statistics, and clinical activity.
        </p>
      </div>

      <DoctorDashboardClient initialData={initialData} />
    </div>
  );
}
