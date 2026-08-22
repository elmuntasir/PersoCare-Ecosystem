import { getSessionUser } from "@/lib/auth";
import { getPatientMedicalRecords } from "@/actions/medicalRecords/getAll";
import { MedicalRecordsClient } from "@/components/medical/MedicalRecordsClient";
import { redirect } from "next/navigation";

export default async function RecordsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getPatientMedicalRecords();

  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--coral)] mb-1">
            Clinical Summary
          </p>
          <h1 className="font-display text-3xl text-[var(--teal-900)]">Medical Records</h1>
          <p className="font-body text-[var(--ink-soft)] mt-1">
            Your unified health history, checkup prescriptions, clinical vitals, and diagnostic documents.
          </p>
        </div>
        <MedicalRecordsClient data={data} />
      </div>
    </main>
  );
}
