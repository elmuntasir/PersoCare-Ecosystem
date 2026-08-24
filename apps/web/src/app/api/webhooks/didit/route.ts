import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── Helpers ────────────────────────────────────────────────

function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)]),
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v);
  return v;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

// ─── DB Updates ──────────────────────────────────────────────

type DiditDecision = {
  id_verifications?: Array<{
    document_number?: string;
    full_name?: string;
    date_of_birth?: string;
  }>;
  liveness_checks?: Array<{ score?: number }>;
  face_matches?: Array<{ score?: number }>;
};

async function setUserVerified(vendorData: string, decision: DiditDecision, eventId?: string) {
  const userId = vendorData;
  const idVerification = decision?.id_verifications?.[0] || {};
  const liveness = decision?.liveness_checks?.[0] || {};
  const faceMatch = decision?.face_matches?.[0] || {};

  const extractedData = {
    fullName: idVerification.full_name || "",
    dateOfBirth: idVerification.date_of_birth || "",
    documentNumber: idVerification.document_number || "",
  };

  await prisma.verification.upsert({
    where: { userId },
    update: {
      status: "APPROVED",
      decision: decision as Prisma.InputJsonValue,
      livenessScore: liveness.score ?? null,
      faceMatchScore: faceMatch.score ?? null,
      documentNumber: idVerification.document_number || null,
      extractedData,
      verifiedAt: new Date(),
      lastEventId: eventId ?? null,
    },
    create: {
      userId,
      provider: "DIDIT",
      status: "APPROVED",
      decision: decision as Prisma.InputJsonValue,
      livenessScore: liveness.score ?? null,
      faceMatchScore: faceMatch.score ?? null,
      documentNumber: idVerification.document_number || null,
      extractedData,
      verifiedAt: new Date(),
      lastEventId: eventId ?? null,
    },
  });
}

async function setUserDeclined(vendorData: string, decision: DiditDecision, eventId?: string) {
  const userId = vendorData;
  await prisma.verification.upsert({
    where: { userId },
    update: {
      status: "DECLINED",
      decision: decision as Prisma.InputJsonValue,
      lastEventId: eventId ?? null,
    },
    create: {
      userId,
      provider: "DIDIT",
      status: "DECLINED",
      decision: decision as Prisma.InputJsonValue,
      lastEventId: eventId ?? null,
    },
  });
}

async function setUserPendingReview(vendorData: string, eventId?: string) {
  const userId = vendorData;
  await prisma.verification.upsert({
    where: { userId },
    update: { status: "IN_REVIEW", lastEventId: eventId ?? null },
    create: {
      userId,
      provider: "DIDIT",
      status: "IN_REVIEW",
      lastEventId: eventId ?? null,
    },
  });
}

async function alreadyProcessed(userId: string | undefined, eventId: string | undefined) {
  if (!userId || !eventId) return false;
  const existing = await prisma.verification.findUnique({
    where: { userId },
    select: { lastEventId: true },
  });
  return existing?.lastEventId === eventId;
}

// ─── Main Handler ────────────────────────────────────────────

export async function POST(req: Request) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("DIDIT_WEBHOOK_SECRET is not configured");
    return new NextResponse("misconfigured", { status: 500 });
  }

  const raw = await req.text();
  const sig = req.headers.get("x-signature-v2") ?? "";
  const ts = Number(req.headers.get("x-timestamp"));

  // 1. Freshness check (≤300s)
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
    return new NextResponse("stale", { status: 401 });
  }

  // 2. Canonicalise
  let parsed: {
    event_id?: string;
    status?: string;
    vendor_data?: string;
    decision?: DiditDecision;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse("invalid json", { status: 400 });
  }

  const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));

  // 3. HMAC verification
  const expected = crypto
    .createHmac("sha256", secret)
    .update(canonical, "utf8")
    .digest("hex");

  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return new NextResponse("bad sig", { status: 401 });
  }

  // 4. Idempotency (DB-backed — safe across serverless instances)
  if (await alreadyProcessed(parsed.vendor_data, parsed.event_id)) {
    return new NextResponse("ok");
  }

  // 5. Apply status
  const { status, vendor_data, decision, event_id } = parsed;
  if (!vendor_data) {
    console.warn("Didit webhook missing vendor_data");
    return new NextResponse("ok");
  }

  switch (status) {
    case "Approved":
      await setUserVerified(vendor_data, decision || {}, event_id);
      break;
    case "Declined":
      await setUserDeclined(vendor_data, decision || {}, event_id);
      break;
    case "In Review":
      await setUserPendingReview(vendor_data, event_id);
      break;
    case "Resubmitted":
      console.log("Resubmitted for user:", vendor_data);
      break;
    case "Kyc Expired":
      await prisma.verification.upsert({
        where: { userId: vendor_data },
        update: { status: "EXPIRED", lastEventId: event_id ?? null },
        create: {
          userId: vendor_data,
          provider: "DIDIT",
          status: "EXPIRED",
          lastEventId: event_id ?? null,
        },
      });
      break;
    default:
      // "Not Started", "In Progress", "Awaiting User", "Abandoned", "Expired"
      console.log(`Didit webhook status: ${status} for user ${vendor_data}`);
      break;
  }

  return new NextResponse("ok");
}
