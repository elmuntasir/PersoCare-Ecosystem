"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Get blood units for an organization ───────────────────

export async function getOrganizationBloodUnits(organizationId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const [unitsRaw, batches, donors] = await Promise.all([
    prisma.bloodDonationUnit.findMany({
      where: { organizationId },
      include: {
        donorProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, dob: true } },
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            item: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ expiryDate: "asc" }, { collectionDate: "desc" }],
    }),
    prisma.inventoryBatch.findMany({
      where: {
        organizationId,
        isActive: true,
        item: { is: { category: { is: { name: "BLOOD" } } } },
      },
      include: {
        item: { select: { id: true, name: true } },
      },
      orderBy: [{ expiryDate: "asc" }, { receivedAt: "desc" }],
    }),
    prisma.bloodDonorProfile.findMany({
      where: {
        OR: [
          { verifiedBy: organizationId },
          { user: { donorVerificationsReceived: { some: { organizationId, status: "APPROVED" } } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: [{ verifiedAt: "desc" }, { isVerified: "desc" }],
    }),
  ]);

  const units = unitsRaw.map((unit) => ({
    ...unit,
    expiringSoon:
      unit.status === "READY" &&
      unit.expiryDate.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000,
  }));

  return { units, batches, donors };
}

// ─── Create a blood donation unit ───────────────────────────

const createUnitSchema = z.object({
  organizationId: z.string().min(1),
  donorProfileId: z.string().min(1),
  bloodType: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]),
  volume: z.coerce.number().int().min(1).default(450),
  batchId: z.string().optional(),
  collectionDate: z.string().optional(),
  expiryDate: z.string().min(1),
  notes: z.string().optional(),
});

export async function createBloodDonationUnit(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const data = createUnitSchema.parse({
    organizationId: formData.get("organizationId"),
    donorProfileId: formData.get("donorProfileId"),
    bloodType: formData.get("bloodType"),
    volume: formData.get("volume") || 450,
    batchId: (formData.get("batchId") as string) || undefined,
    collectionDate: (formData.get("collectionDate") as string) || undefined,
    expiryDate: formData.get("expiryDate"),
    notes: (formData.get("notes") as string) || undefined,
  });

  const collectionDate = data.collectionDate ? new Date(data.collectionDate) : new Date();
  const expiryDate = new Date(data.expiryDate);

  await prisma.$transaction(async (tx) => {
    const unit = await tx.bloodDonationUnit.create({
      data: {
        donorProfileId: data.donorProfileId,
        organizationId: data.organizationId,
        bloodType: data.bloodType,
        volume: data.volume,
        collectionDate,
        expiryDate,
        batchId: data.batchId || null,
        notes: data.notes,
        status: "COLLECTED",
      },
    });

    // If linked to an inventory batch, increase its quantity by one bag.
    if (data.batchId) {
      const batch = await tx.inventoryBatch.findUnique({ where: { id: data.batchId } });
      if (batch) {
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity + 1 },
        });
        await tx.inventoryMovement.create({
          data: {
            batchId: batch.id,
            quantity: 1,
            type: "DONATION",
            performedBy: user.id,
            notes: `Blood bag collected (${data.bloodType}) – ${unit.id.slice(0, 8)}`,
          },
        });
      }
    }
  });

  revalidatePath("/dashboard/inventory/blood-bags");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/blood-donation");
  return { success: true };
}

// ─── Update blood unit status ──────────────────────────────

const statusSchema = z.object({
  unitId: z.string().min(1),
  status: z.enum(["COLLECTED", "TESTED", "READY", "DISPENSED", "WASTED"]),
  notes: z.string().optional(),
});

export async function updateBloodDonationUnitStatus(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const data = statusSchema.parse({
    unitId: formData.get("unitId"),
    status: formData.get("status"),
    notes: (formData.get("notes") as string) || undefined,
  });

  const unit = await prisma.bloodDonationUnit.findUnique({
    where: { id: data.unitId },
    include: { batch: true },
  });
  if (!unit) throw new Error("Blood unit not found");

  await prisma.$transaction(async (tx) => {
    await tx.bloodDonationUnit.update({
      where: { id: data.unitId },
      data: {
        status: data.status,
        notes: data.notes,
      },
    });

    // When a bag leaves stock, decrement the linked batch quantity.
    if (unit.batch && (data.status === "DISPENSED" || data.status === "WASTED")) {
      await tx.inventoryBatch.update({
        where: { id: unit.batch.id },
        data: { quantity: Math.max(0, unit.batch.quantity - 1) },
      });
      await tx.inventoryMovement.create({
        data: {
          batchId: unit.batch.id,
          quantity: -1,
          type: data.status === "DISPENSED" ? "DISPENSE" : "WASTAGE",
          performedBy: user.id,
          notes: `Blood bag ${data.status.toLowerCase()} (${unit.bloodType}) – ${unit.id.slice(0, 8)}`,
        },
      });
    }
  });

  revalidatePath("/dashboard/inventory/blood-bags");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/blood-donation");
  return { success: true };
}