import "server-only";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { INVENTORY_MANAGER_ROLE } from "@/lib/auth-constants";

export type ResolvedInventoryOrg = {
  id: string;
  name: string;
  slug: string;
  organizationType: { name: string; code: string };
} | null;

/**
 * Resolves which organization's inventory the current user may manage.
 * Rights come from (in priority order):
 *  - an active OrganizationAdmin assignment
 *  - an active employee record with role INVENTORY_MANAGER
 *  - an active OrganizationMembership
 */
export async function resolveInventoryOrganization(): Promise<ResolvedInventoryOrg> {
  const user = await getSessionUser();
  if (!user) return null;

  const [admin, inventoryManager, membership] = await Promise.all([
    prisma.organizationAdmin.findFirst({
      where: { userId: user.id, isActive: true },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            organizationType: { select: { name: true, code: true } },
          },
        },
      },
    }),
    prisma.organizationEmployee.findFirst({
      where: { userId: user.id, role: INVENTORY_MANAGER_ROLE, isActive: true },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            organizationType: { select: { name: true, code: true } },
          },
        },
      },
    }),
    prisma.organizationMembership.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            organizationType: { select: { name: true, code: true } },
          },
        },
      },
    }),
  ]);

  const org = admin?.organization ?? inventoryManager?.organization ?? membership?.organization ?? null;
  return org;
}

export async function isInventoryManager(organizationId: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const [admin, employee] = await Promise.all([
    prisma.organizationAdmin.findFirst({
      where: { userId: user.id, organizationId, isActive: true },
      select: { id: true },
    }),
    prisma.organizationEmployee.findFirst({
      where: { userId: user.id, organizationId, role: INVENTORY_MANAGER_ROLE, isActive: true },
      select: { id: true },
    }),
  ]);

  return Boolean(admin || employee);
}