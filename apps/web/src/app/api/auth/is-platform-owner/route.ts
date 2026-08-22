import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ isPlatformOwner: false });
  const isOwner = await isPlatformOwner(user.id);
  return NextResponse.json({ isPlatformOwner: isOwner });
}
