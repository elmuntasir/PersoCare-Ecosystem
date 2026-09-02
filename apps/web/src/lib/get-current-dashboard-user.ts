import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_ROLE_COOKIE,
  INVENTORY_MANAGER_ROLE,
  type SwitchableRole,
} from "@/lib/auth-constants";

export type DashboardRole =
  | { kind: "platform_owner"; label: "Platform Owner" }
  | { kind: "profession"; label: string } // e.g. "Doctor", verified UserProfession
  | { kind: "org_role"; label: string; organizationName: string } // active OrganizationMembership
  | { kind: "inventory_manager"; label: string; organizationName: string } // active INVENTORY_MANAGER employee
  | { kind: "user"; label: "" }; // default regular user without forcing "PATIENT" title

export type DashboardUser = {
  id: string;
  authId: string;
  name: string;
  email: string;
  /**
   * The role shown in the topbar/sidebar when applicable (verified doctor / org membership / platform owner).
   */
  primaryRole: DashboardRole;
};

/**
 * Wrapped in React's cache() so calling this from both dashboard/layout.tsx
 * and a page.tsx in the same request hits the DB once, not twice — Next
 * doesn't dedupe Prisma calls the way it dedupes fetch().
 */
const getDashboardUserOrNull = cache(async (): Promise<DashboardUser | null> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: {
      platformOwner: true,
      adminRoles: {
        where: { isActive: true },
        include: { organization: true },
      },
      professions: {
        where: { status: "VERIFIED" },
        include: { professionType: true },
      },
      memberships: {
        where: { status: "ACTIVE" },
        include: { role: true, organization: true },
      },
      employees: {
        where: { isActive: true },
        include: { organization: true },
      },
    },
  });

  // Auth account exists in Supabase but the profile row is missing —
  // shouldn't happen if register/actions.ts ran, but don't let it 500.
  if (!user) {
    return null;
  }

  // ── Compute default role from DB ─────────────────────────────────────────
  let primaryRole: DashboardRole = { kind: "user", label: "" };

  if (user.adminRoles[0]) {
    const a = user.adminRoles[0];
    primaryRole = {
      kind: "org_role",
      label: a.isPrimaryAdmin ? "Primary Admin" : "Admin",
      organizationName: a.organization.name,
    };
  } else if (user.memberships[0]) {
    const m = user.memberships[0];
    primaryRole = {
      kind: "org_role",
      label: m.role.name,
      organizationName: m.organization.name,
    };
  } else if (user.employees.some((e) => e.role === INVENTORY_MANAGER_ROLE)) {
    const inv = user.employees.find((e) => e.role === INVENTORY_MANAGER_ROLE)!;
    primaryRole = {
      kind: "inventory_manager",
      label: "Inventory Manager",
      organizationName: inv.organization.name,
    };
  } else if (user.professions[0]) {
    primaryRole = {
      kind: "profession",
      label: user.professions[0].professionType.name,
    };
  }

  if (user.platformOwner) {
    primaryRole = { kind: "platform_owner", label: "Platform Owner" };
  }

  // ── Apply cookie-based role override (from profile role-switcher) ─────────
  const cookieRole = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value as SwitchableRole | undefined;

  if (cookieRole) {
    if (cookieRole === "user") {
      primaryRole = { kind: "user", label: "" };
    } else if (cookieRole === "admin") {
      const a = user.adminRoles[0];
      primaryRole = {
        kind: "org_role",
        label: a?.isPrimaryAdmin ? "Primary Admin" : "Admin",
        organizationName: a?.organization?.name || "Organization",
      };
    } else if (cookieRole === "inventory_manager") {
      const inv = user.employees.find((e) => e.role === INVENTORY_MANAGER_ROLE);
      primaryRole = {
        kind: "inventory_manager",
        label: "Inventory Manager",
        organizationName: inv?.organization?.name || "Organization",
      };
    } else if (["doctor", "physiotherapist", "radiologist"].includes(cookieRole)) {
      const prof = user.professions.find(
        (p) => p.professionType.code.toLowerCase() === cookieRole.toLowerCase()
      );
      const roleLabel =
        prof?.professionType.name ||
        (cookieRole === "doctor"
          ? "Doctor"
          : cookieRole === "physiotherapist"
          ? "Physiotherapist"
          : "Radiologist");
      primaryRole = { kind: "profession", label: roleLabel };
    }
  }

  return {
    id: user.id,
    authId: authUser.id,
    name: user.name,
    email: user.email,
    primaryRole,
  };
});

/**
 * Fetches the current dashboard user or redirects to /login.
 */
export async function requireDashboardUser(): Promise<DashboardUser> {
  const user = await getDashboardUserOrNull();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Use inside a route segment that only some roles should reach.
 */
export async function requireRole(
  allowed: DashboardRole["kind"][]
): Promise<DashboardUser> {
  const user = await requireDashboardUser();
  if (!allowed.includes(user.primaryRole.kind)) {
    redirect("/dashboard");
  }
  return user;
}
