import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { getDoctorProfile } from "@/actions/appointments/getDoctor";
import { DoctorProfileClient } from "@/components/appointments/doctor/DoctorProfileClient";

interface DoctorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DoctorProfilePage({ params }: DoctorPageProps) {
  await requireDashboardUser();
  const { id } = await params;

  const formData = new FormData();
  formData.append("doctorId", id);

  const data = await getDoctorProfile(formData);

  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <DoctorProfileClient data={data} />
    </main>
  );
}
