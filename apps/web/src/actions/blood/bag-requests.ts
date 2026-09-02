"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveInventoryOrganization } from "@/lib/resolve-inventory-org";

const BLOOD_TYPES = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"] as const;

const applySchema = z.object({
  organizationId: z.string().min(1),
  bloodType: z.enum(BLOOD_TYPES),
  unitsNeeded: z.coerce.number().int().min(1).max(10),
  patientName: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Patient applies for ready blood bags at an organization ───

export async function applyForBloodBag(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("You must be signed in to request blood");

  const data = applySchema.parse({
    organizationId: formData.get("organizationId"),
    bloodType: formData.get("bloodType"),
    unitsNeeded: formData.get("unitsNeeded") || 1,
    patientName: (formData.get("patientName") as string) || undefined,
    contactPhone: (formData.get("contactPhone") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });

  const available = await prisma.bloodDonationUnit.count({
    where: { organizationId: data.organizationId, bloodType: data.bloodType, status: "READY" },
  });

  if (available < data.unitsNeeded) {
    throw new Error(
      `Only ${available} READY ${data.bloodType.replace("_", "+")} bag(s) available at this organization.`
    );
  }

  const request = await prisma.bloodBagRequest.create({
    data: {
      requesterId: user.id,
      organizationId: data.organizationId,
      bloodType: data.bloodType,
      unitsNeeded: data.unitsNeeded,
      patientName: data.patientName,
      contactPhone: data.contactPhone,
      notes: data.notes,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/blood-donation");
  revalidatePath("/dashboard/inventory/blood-bags");
  return { success: true, requestId: request.id };
}

// ─── Requests the current user has submitted ───

export async function getMyBloodBagRequests() {
  const user = await getSessionUser();
  if (!user) return [];

  return prisma.bloodBagRequest.findMany({
    where: { requesterId: user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          organizationType: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Incoming requests for an organization (hospital side) ───

export async function getOrganizationBloodBagRequests(organizationId: string) {
  const user = await getSessionUser();
  if (!user) return [];

  const org = await resolveInventoryOrganization();
  if (!org || org.id !== organizationId) return [];

  const requests = await prisma.bloodBagRequest.findMany({
    where: { organizationId },
    include: {
      requester: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // PENDING requests first, most recent first within each group.
  const order = { PENDING: 0, APPROVED: 1, DECLINED: 2, CANCELLED: 3 } as const;
  return [...requests].sort(
    (a, b) => order[a.status] - order[b.status] || b.createdAt.getTime() - a.createdAt.getTime()
  );
}

// ─── Hospital responds to an application ───

const respondSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["APPROVED", "DECLINED"]),
});

export async function respondToBloodBagRequest(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const data = respondSchema.parse({
    requestId: formData.get("requestId"),
    action: formData.get("action"),
  });

  const request = await prisma.bloodBagRequest.findUnique({ where: { id: data.requestId } });
  if (!request) throw new Error("Blood request not found");

  const org = await resolveInventoryOrganization();
  if (!org || org.id !== request.organizationId) throw new Error("Cannot respond to this request");

  await prisma.bloodBagRequest.update({
    where: { id: data.requestId },
    data: { status: data.action, respondedAt: new Date() },
  });

  revalidatePath("/dashboard/inventory/blood-bags");
  revalidatePath("/dashboard/blood-donation");
  return { success: true };
}