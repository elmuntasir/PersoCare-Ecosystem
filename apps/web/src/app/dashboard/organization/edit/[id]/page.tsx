import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditOrganizationClient } from "@/components/organization/EditOrganizationClient";
import { redirect } from "next/navigation";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Verify user is an active admin of this organization
  const admin = await prisma.organizationAdmin.findFirst({
    where: {
      userId: user.id,
      organizationId: id,
      isActive: true,
    },
  });

  if (!admin) redirect("/dashboard/organization");

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      organizationType: true,
      admins: {
        where: { isActive: true },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!organization) redirect("/dashboard/organization");

  const orgTypes = await prisma.organizationType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] tracking-tight font-bold">
            Edit Organization
          </h1>
          <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
            Update institutional details and coordinate governance votes with co-administrators.
          </p>
        </div>

        <EditOrganizationClient
          organization={organization}
          orgTypes={orgTypes}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
