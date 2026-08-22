import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/platform-admin/UsersClient";

export const dynamic = "force-dynamic";

export default async function ManageUsersPage() {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    redirect("/dashboard");
  }

  const rawUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dob: true,
      gender: true,
      createdAt: true,
      platformOwner: {
        select: {
          id: true,
        },
      },
      professions: {
        where: { status: "VERIFIED" },
        select: {
          status: true,
          professionType: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const users = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    dob: u.dob ? u.dob.toISOString() : null,
    gender: u.gender,
    createdAt: u.createdAt.toISOString(),
    platformOwner: u.platformOwner ? { id: u.platformOwner.id } : null,
    professions: u.professions.map((p) => ({
      status: p.status,
      professionType: { name: p.professionType.name },
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--teal-900)] tracking-tight">
          Manage Platform Users
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          View all registered healthcare providers, patients, and administrators across the network.
        </p>
      </div>

      <UsersClient initialUsers={users} />
    </div>
  );
}
