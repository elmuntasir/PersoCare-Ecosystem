"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isInventoryManager } from "@/lib/resolve-inventory-org";

export type ManageItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  reorderLevel: number | null;
  stockMethod: string;
  isActive: boolean;
  createdAt: string;
  category: { id: string; name: string };
  totalUnits: number;
  batchCount: number;
  batches: Array<{
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string | null;
    receivedAt: string;
  }>;
};

export type ManageBatch = {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string | null;
  expiringSoon: boolean;
  receivedAt: string;
  notes: string | null;
  department: { id: string; name: string } | null;
  item: { id: string; name: string; unit: string | null };
};

export type InventoryManagementData = {
  categories: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
  items: ManageItem[];
  batches: ManageBatch[];
};

async function assertAccess(organizationId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  const ok = await isInventoryManager(organizationId);
  if (!ok) throw new Error("Unauthorized – Inventory Manager or Admin access required");
}

export async function getInventoryManagementData(
  organizationId: string
): Promise<InventoryManagementData> {
  await assertAccess(organizationId);

  const [categories, departments, items, batches] = await Promise.all([
    prisma.inventoryCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.inventoryItem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        batches: {
          where: { organizationId, isActive: true },
          select: {
            id: true,
            batchNumber: true,
            quantity: true,
            expiryDate: true,
            receivedAt: true,
          },
        },
      },
    }),
    prisma.inventoryBatch.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ expiryDate: "asc" }, { receivedAt: "desc" }],
      include: {
        item: { select: { id: true, name: true, unit: true } },
        department: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    departments: departments.map((d) => ({ id: d.id, name: d.name })),
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      unit: i.unit,
      reorderLevel: i.reorderLevel,
      stockMethod: i.stockMethod,
      isActive: i.isActive,
      createdAt: i.createdAt.toISOString(),
      category: { id: i.category.id, name: i.category.name },
      totalUnits: i.batches.reduce((sum, b) => sum + b.quantity, 0),
      batchCount: i.batches.length,
      batches: i.batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        expiryDate: b.expiryDate ? b.expiryDate.toISOString() : null,
        receivedAt: b.receivedAt.toISOString(),
      })),
    })),
    batches: batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      quantity: b.quantity,
      expiryDate: b.expiryDate ? b.expiryDate.toISOString() : null,
      expiringSoon: b.expiryDate
        ? b.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : false,
      receivedAt: b.receivedAt.toISOString(),
      notes: b.notes,
      department: b.department,
      item: { id: b.item.id, name: b.item.name, unit: b.item.unit },
    })),
  };
}

export type MovementHistoryItem = {
  id: string;
  type: string;
  quantity: number;
  notes: string | null;
  performedAt: string;
  batchNumber: string;
  itemId: string;
  itemName: string;
  category: string;
  performedByName: string | null;
};

export type MovementHistoryData = {
  items: MovementHistoryItem[];
  itemOptions: Array<{ id: string; name: string }>;
  totals: { incoming: number; outgoing: number };
};

export async function getInventoryMovementHistory(
  organizationId: string
): Promise<MovementHistoryData> {
  await assertAccess(organizationId);

  const movements = await prisma.inventoryMovement.findMany({
    where: { batch: { is: { organizationId } } },
    orderBy: { performedAt: "desc" },
    take: 500,
    include: {
      batch: {
        include: {
          item: { include: { category: { select: { name: true } } } },
        },
      },
    },
  });

  const performerIds = Array.from(new Set(movements.map((m) => m.performedBy)));
  const performers = performerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: performerIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(performers.map((u) => [u.id, u.name]));

  const itemOptions = Array.from(
    new Map(movements.map((m) => [m.batch.item.id, m.batch.item])).values()
  ).map((item) => ({ id: item.id, name: item.name }));

  const list = movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    notes: m.notes,
    performedAt: m.performedAt.toISOString(),
    batchNumber: m.batch.batchNumber,
    itemId: m.batch.item.id,
    itemName: m.batch.item.name,
    category: m.batch.item.category.name,
    performedByName: nameById.get(m.performedBy) ?? null,
  }));

  const totals = list.reduce(
    (acc, m) => {
      if (m.quantity >= 0) acc.incoming += m.quantity;
      else acc.outgoing += Math.abs(m.quantity);
      return acc;
    },
    { incoming: 0, outgoing: 0 }
  );

  return { items: list, itemOptions, totals };
}