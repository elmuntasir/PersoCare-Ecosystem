"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const BLOOD_TYPES = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"] as const;

const searchSchema = z.object({
  bloodType: z.enum(BLOOD_TYPES).optional(),
  units: z.coerce.number().int().min(0).optional(),
});

export type OrganizationBloodResult = {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  address: string | null;
  availableUnits: number;
  bloodTypeCounts: Array<{ bloodType: string; count: number; expiringSoon: number }>;
  expiringSoonUnits: number;
  lastUpdated: string;
};

export async function searchOrganizationsWithBlood(
  formData: FormData
): Promise<OrganizationBloodResult[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const data = searchSchema.parse({
    bloodType: (formData.get("bloodType") as string) || undefined,
    units: formData.get("units") ? Number(formData.get("units")) : undefined,
  });

  // Blood units that are safe to use right now (READY) and match the requested type.
  const unitWhere: Prisma.BloodDonationUnitWhereInput = {
    status: "READY",
  };
  if (data.bloodType) unitWhere.bloodType = data.bloodType;

  const units = await prisma.bloodDonationUnit.findMany({
    where: unitWhere,
    include: {
      organization: {
        include: {
          organizationType: true,
        },
      },
    },
    orderBy: { expiryDate: "asc" },
  });

  // Aggregate units per organization (with per-blood-type breakdown).
  const byOrg = new Map<
    string,
    {
      organization: (typeof units)[number]["organization"];
      total: number;
      expiringSoon: number;
      byType: Map<string, { count: number; expiringSoon: number }>;
      latestCollection: Date;
    }
  >();

  for (const unit of units) {
    let bucket = byOrg.get(unit.organizationId);
    if (!bucket) {
      bucket = {
        organization: unit.organization,
        total: 0,
        expiringSoon: 0,
        byType: new Map<string, { count: number; expiringSoon: number }>(),
        latestCollection: unit.collectionDate,
      };
      byOrg.set(unit.organizationId, bucket);
    }
    bucket.total += 1;
    const typeBucket = bucket.byType.get(unit.bloodType) ?? { count: 0, expiringSoon: 0 };
    typeBucket.count += 1;
    if (unit.expiryDate.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000) {
      bucket.expiringSoon += 1;
      typeBucket.expiringSoon += 1;
    }
    bucket.byType.set(unit.bloodType, typeBucket);
    if (unit.collectionDate > bucket.latestCollection) {
      bucket.latestCollection = unit.collectionDate;
    }
  }

  let results = Array.from(byOrg.entries()).map(([organizationId, bucket]) => {
    const bloodTypeCounts = Array.from(bucket.byType.entries())
      .map(([bloodType, { count, expiringSoon }]) => ({ bloodType, count, expiringSoon }))
      .sort((a, b) => b.count - a.count);
    return {
      organizationId,
      organizationName: bucket.organization.name,
      organizationType: bucket.organization.organizationType.name,
      address: bucket.organization.address,
      availableUnits: bucket.total,
      bloodTypeCounts,
      expiringSoonUnits: bucket.expiringSoon,
      lastUpdated: bucket.latestCollection.toISOString(),
    };
  });

  if (data.units && data.units > 0) {
    const requiredUnits = data.units;
    results = results.filter((r) => {
      if (data.bloodType) {
        const entry = r.bloodTypeCounts.find((c) => c.bloodType === data.bloodType);
        return (entry?.count ?? 0) >= requiredUnits;
      }
      return r.availableUnits >= requiredUnits;
    });
  }

  results.sort((a, b) => b.availableUnits - a.availableUnits);

  return results;
}