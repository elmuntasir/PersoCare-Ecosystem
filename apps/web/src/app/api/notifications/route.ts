import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await listNotificationsForUser(user.id, 12);
  return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const notificationId = typeof body?.notificationId === "string" ? body.notificationId : "";
  const markAll = body?.markAll === true;

  if (markAll) {
    await markAllNotificationsRead(user.id);
    return NextResponse.json({ success: true });
  }

  if (!notificationId) {
    return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
  }

  await markNotificationRead(user.id, notificationId);
  return NextResponse.json({ success: true });
}
