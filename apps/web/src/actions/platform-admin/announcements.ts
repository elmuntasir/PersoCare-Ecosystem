"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  targetRoles: z.array(z.string()).optional(), // "patient", "doctor", "admin"
});

export async function sendAnnouncement(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !(await isPlatformOwner(user.id))) {
    throw new Error("Unauthorized – Platform Owner access only");
  }

  const rawTargetRoles = formData.get("targetRoles");
  let parsedRoles: string[] | undefined;
  if (rawTargetRoles && typeof rawTargetRoles === "string") {
    try {
      parsedRoles = JSON.parse(rawTargetRoles);
    } catch {
      parsedRoles = undefined;
    }
  }

  const data = announcementSchema.parse({
    title: formData.get("title"),
    message: formData.get("message"),
    targetRoles: parsedRoles,
  });

  // Build filter for users
  let where: any = {};
  if (data.targetRoles && data.targetRoles.length > 0) {
    const hasPatient = data.targetRoles.includes("patient");
    const professionCodes = data.targetRoles
      .filter((r) => r !== "patient")
      .map((r) => r.toUpperCase());

    const conditions: any[] = [];

    if (professionCodes.length > 0) {
      conditions.push({
        professions: {
          some: {
            professionType: { code: { in: professionCodes } },
            status: "VERIFIED",
          },
        },
      });
    }

    if (hasPatient) {
      // Users with no verified profession or matching regular users
      conditions.push({
        professions: {
          none: {
            status: "VERIFIED",
          },
        },
      });
    }

    if (conditions.length > 0) {
      where = { OR: conditions };
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  if (users.length > 0) {
    const notifications = users.map((u) => ({
      userId: u.id,
      title: data.title,
      message: data.message,
      type: "INFO" as const,
      link: "/dashboard",
    }));

    await prisma.notification.createMany({
      data: notifications,
    });
  }

  // Log the action in SystemAuditLog
  await prisma.systemAuditLog.create({
    data: {
      userId: user.id,
      action: "SEND_ANNOUNCEMENT",
      details: {
        title: data.title,
        targetRoles: data.targetRoles || "ALL",
        recipientCount: users.length,
      },
    },
  });

  revalidatePath("/platform-admin/announcements");
  revalidatePath("/dashboard");
  return { success: true, sentCount: users.length };
}
