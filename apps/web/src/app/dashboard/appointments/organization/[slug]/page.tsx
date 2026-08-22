import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { getOrganizationBySlug } from "@/actions/appointments/getOrganization";
import { OrganizationClient } from "@/components/appointments/organization/OrganizationClient";

interface OrganizationPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationShowcasePage({ params }: OrganizationPageProps) {
  await requireDashboardUser();
  const { slug } = await params;

  const formData = new FormData();
  formData.append("slug", slug);

  const data = await getOrganizationBySlug(formData);

  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <OrganizationClient data={data} />
    </main>
  );
}
