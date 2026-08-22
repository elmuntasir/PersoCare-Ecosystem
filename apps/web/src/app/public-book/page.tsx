import { Suspense } from "react";
import { getPublicBookingContext } from "@/actions/public/getBookingContext";
import { PublicBookingClient } from "@/components/public/PublicBookingClient";

export const metadata = {
  title: "Public Appointment Booking | PersoCare",
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function PublicBookPage({ searchParams }: PageProps) {
  const orgId = typeof searchParams?.orgId === "string" ? searchParams.orgId : "";
  const doctorId = typeof searchParams?.doctorId === "string" ? searchParams.doctorId : "";

  if (!orgId) {
    return (
      <div className="min-h-screen bg-[var(--paper)] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-white p-6 text-rose-700 shadow-sm">
          Missing organization link.
        </div>
      </div>
    );
  }

  const fd = new FormData();
  fd.append("orgId", orgId);
  if (doctorId) fd.append("doctorId", doctorId);
  const initialContext = await getPublicBookingContext(fd);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--paper)] px-4 py-10">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
            Loading booking form...
          </div>
        </div>
      }
    >
      <PublicBookingClient initialContext={initialContext} initialOrgId={orgId} initialDoctorId={doctorId} />
    </Suspense>
  );
}
