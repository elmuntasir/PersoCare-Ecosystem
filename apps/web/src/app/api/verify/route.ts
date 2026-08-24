import { NextResponse } from "next/server";
import { createDiditSession } from "@/actions/ekyc/didit";

export async function POST() {
  try {
    const result = await createDiditSession();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
