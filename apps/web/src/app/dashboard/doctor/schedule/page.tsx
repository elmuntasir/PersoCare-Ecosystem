import { requireRole } from "@/lib/get-current-dashboard-user";
import { getDoctorSchedules } from "@/actions/doctor/schedule";
import { getDoctorOrganizations } from "@/actions/doctor/organization";
import { DoctorScheduleClient } from "@/components/doctor/DoctorScheduleClient";

export const metadata = { title: "Doctor Schedule | PersoCare" };

export default async function DoctorSchedulePage() {
  const user = await requireRole(["profession"]);

  const [schedules, orgsData] = await Promise.all([
    getDoctorSchedules(),
    getDoctorOrganizations(),
  ]);

  const organizations = orgsData.employees.map((e) => ({
    id: e.organization.id,
    name: e.organization.name,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-3xl text-[var(--teal-900)] font-semibold">
          My Working Schedule
        </h1>
        <p className="font-body text-[var(--ink-soft)] mt-1">
          Manage your consultation hours, visit duration, and working days across facilities.
        </p>
      </div>

      <DoctorScheduleClient
        initialSchedules={schedules as any}
        organizations={organizations}
        doctorId={user.id}
      />
    </div>
  );
}
