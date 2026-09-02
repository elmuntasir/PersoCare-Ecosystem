"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_ROLE_COOKIE,
  INVENTORY_MANAGER_ROLE,
  type SwitchableRole,
} from "@/lib/auth-constants";


/**
 * Sets the active role cookie and validates that the user actually holds that
 * verified profession before allowing the switch. "user" is always allowed.
 */
export async function switchActiveRole(role: SwitchableRole): Promise<{ ok: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { ok: false, error: "Unauthorized" };

  // "user" role is always available — no profession check needed
  if (role === "user") {
    cookieStore.set(ACTIVE_ROLE_COOKIE, "user", {
      path: "/",
      sameSite: "lax",
      httpOnly: false, // readable client-side for initialising dropdown
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return { ok: true };
  }

  // For professional roles, verify the user holds a VERIFIED profession
  const dbUser = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: {
      platformOwner: true,
      professions: {
        include: { professionType: true },
        where: { status: "VERIFIED" },
      },
      adminRoles: { where: { isActive: true } },
      employees: {
        where: { isActive: true, role: INVENTORY_MANAGER_ROLE },
        select: { id: true, organizationId: true },
      },
    },
  });

  if (!dbUser) return { ok: false, error: "User not found" };

  // Platform owners can switch to and test any role without restrictions
  if (dbUser.platformOwner) {
    cookieStore.set(ACTIVE_ROLE_COOKIE, role, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });
    return { ok: true };
  }

  if (role === "inventory_manager") {
    const isInventoryManager = dbUser.employees.length > 0;
    if (!isInventoryManager) return { ok: false, error: "Not an inventory manager" };
  } else if (role === "admin") {
    const isAdmin =
      dbUser.adminRoles.length > 0 ||
      dbUser.professions.some((p) => p.professionType.code.toUpperCase() === "ADMIN");
    if (!isAdmin) return { ok: false, error: "Not an admin" };
  } else {
    const hasRole = dbUser.professions.some(
      (p) => p.professionType.code.toLowerCase() === role.toLowerCase()
    );
    if (!hasRole) return { ok: false, error: "Profession not verified" };
  }

  cookieStore.set(ACTIVE_ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
  });

  return { ok: true };
}

/** Read the currently persisted active role from the cookie (server-side). */
export async function getPersistedActiveRole(): Promise<SwitchableRole | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value;
  const valid: SwitchableRole[] = [
    "user",
    "doctor",
    "physiotherapist",
    "radiologist",
    "admin",
    "inventory_manager",
  ];
  return valid.includes(val as SwitchableRole) ? (val as SwitchableRole) : null;
}
