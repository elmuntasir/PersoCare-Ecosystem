import { requireRole } from "@/lib/get-current-dashboard-user";
import { getDoctorAppointments } from "@/actions/doctor/appointments";
import { getDoctorOrganizations } from "@/actions/doctor/organization";
import { DoctorAppointmentsClient } from "@/components/doctor/DoctorAppointmentsClient";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Appointments | PersoCare" };

export default async function DoctorAppointmentsPage() {
  await requireRole(["profession"]);

  const orgsData = await getDoctorOrganizations();
  const orgs = orgsData.employees.map((e) => ({
    id: e.organization.id,
    name: e.organization.name,
  }));

  const fd = new FormData();
  const appointments = await getDoctorAppointments(fd);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--teal-900)] font-semibold">
          Appointments
        </h1>
        <p className="font-body text-[var(--ink-soft)] mt-1">
          Manage your patient appointments and initiate checkups.
        </p>
      </div>
      <DoctorAppointmentsClient
        initialAppointments={appointments as Parameters<typeof DoctorAppointmentsClient>[0]["initialAppointments"]}
        organizations={orgs}
      />
    </div>
  );
}
