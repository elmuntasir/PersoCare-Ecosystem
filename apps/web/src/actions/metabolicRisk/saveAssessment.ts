"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import type { RawInputs, RiskResult } from "@/lib/metabolicRisk/types";

export type SaveAssessmentResult =
  | { success: true }
  | { success: false; error: string };

export async function saveMetabolicRiskAssessment(data: {
  inputs: RawInputs;
  tier: string;
  results: RiskResult[];
}): Promise<SaveAssessmentResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.metabolicRiskAssessment.create({
      data: {
        userId: user.id,
        inputs: data.inputs as unknown as Prisma.InputJsonValue,
        tier: data.tier,
        results: data.results as unknown as Prisma.InputJsonValue,
      },
    });

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save assessment history.";

    if (message.includes("MetabolicRiskAssessment") && message.includes("does not exist")) {
      return {
        success: false,
        error:
          "History table is not set up yet. Run: cd packages/database && npx prisma db push --config prisma.config.ts --schema prisma/schema.prisma",
      };
    }

    console.error("saveMetabolicRiskAssessment:", err);
    return { success: false, error: "Could not save assessment to history." };
  }
}
