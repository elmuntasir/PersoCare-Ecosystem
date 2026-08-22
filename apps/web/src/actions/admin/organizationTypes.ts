"use server";

import { prisma } from "@/lib/prisma";

export async function getOrganizationTypes() {
  const types = await prisma.organizationType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  if (types.length === 0) {
    // Seed essential types if empty
    const defaultTypes = [
      { code: "HOSPITAL", name: "Hospital", requiredDocuments: ["Trade License", "Health Directorate Approval"] },
      { code: "CLINIC", name: "Specialized Clinic", requiredDocuments: ["Trade License"] },
      { code: "DIAGNOSTIC", name: "Diagnostic Center", requiredDocuments: ["AEC Approval", "Trade License"] },
      { code: "PHARMACY", name: "Pharmacy / Drug Store", requiredDocuments: ["Drug License"] },
    ];

    for (const dt of defaultTypes) {
      await prisma.organizationType.upsert({
        where: { code: dt.code },
        update: {},
        create: {
          code: dt.code,
          name: dt.name,
          requiredDocuments: dt.requiredDocuments,
          verifyingBody: "Ministry of Health / Local Authority",
          isActive: true,
        },
      });
    }

    return await prisma.organizationType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });
  }

  return types;
}
