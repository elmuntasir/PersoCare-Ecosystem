import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrganizationsClient } from "@/components/platform-admin/OrganizationsClient";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    redirect("/dashboard");
  }

  const rawOrgs = await prisma.organization.findMany({
    include: {
      organizationType: true,
      admins: {
        where: { isActive: true },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      _count: {
        select: {
          memberships: true,
          appointments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const orgs = rawOrgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    verificationStatus: org.verificationStatus,
    createdAt: org.createdAt.toISOString(),
    organizationType: {
      name: org.organizationType?.name || "Healthcare Facility",
    },
    admins: org.admins.map((a) => ({
      user: {
        name: a.user.name,
        email: a.user.email,
      },
    })),
    _count: {
      memberships: org._count.memberships,
      appointments: org._count.appointments,
    },
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--teal-900)] tracking-tight">
          Manage Organizations
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          Supervise registered hospitals, clinics, diagnostic centers, and blood banks.
        </p>
      </div>

      <OrganizationsClient initialOrgs={orgs} />
    </div>
  );
}
