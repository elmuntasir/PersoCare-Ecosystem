"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const WORKFLOW_ID = "56c41d5d-04de-4b06-92eb-ce5fb1d951b8"; // Free KYC workflow

export async function createDiditSession() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const apiKey = process.env.DIDIT_API_KEY;
  if (!apiKey) throw new Error("DIDIT_API_KEY is not configured");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured");

  const res = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: WORKFLOW_ID,
      vendor_data: user.id,
      callback: `${appUrl}/verify/done`,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Didit session error:", error);
    throw new Error("Failed to create verification session");
  }

  const session = await res.json();

  await prisma.verification.upsert({
    where: { userId: user.id },
    update: { status: "PENDING", provider: "DIDIT" },
    create: {
      userId: user.id,
      provider: "DIDIT",
      status: "PENDING",
    },
  });

  return { url: session.url as string, sessionId: session.session_id as string };
}

export async function isUserVerified() {
  const user = await getSessionUser();
  if (!user) return false;

  const verification = await prisma.verification.findFirst({
    where: { userId: user.id, status: "APPROVED" },
  });
  return !!verification;
}

export async function getVerificationStatus() {
  const user = await getSessionUser();
  if (!user) return null;

  const verification = await prisma.verification.findUnique({
    where: { userId: user.id },
  });
  if (!verification) return null;

  return {
    status: verification.status,
    livenessScore: verification.livenessScore,
    faceMatchScore: verification.faceMatchScore,
    verifiedAt: verification.verifiedAt,
    documentNumber: verification.documentNumber,
  };
}
