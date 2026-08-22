import "server-only";

import { prisma } from "@/lib/prisma";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
};

export function serializeNotification(notification: {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationItem {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type as NotificationType,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function createNotification(input: NotificationInput) {
  const notificationModel = (prisma as typeof prisma & {
    notification?: typeof prisma.notification;
  }).notification;

  if (!notificationModel) {
    return null;
  }

  return notificationModel.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "INFO",
      link: input.link ?? null,
    },
  });
}

export async function listNotificationsForUser(userId: string, take = 10) {
  const notificationModel = (prisma as typeof prisma & {
    notification?: typeof prisma.notification;
  }).notification;

  if (!notificationModel) {
    return { notifications: [], unreadCount: 0 };
  }

  const [notifications, unreadCount] = await Promise.all([
    notificationModel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    notificationModel.count({
      where: { userId, isRead: false },
    }),
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount,
  };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notificationModel = (prisma as typeof prisma & {
    notification?: typeof prisma.notification;
  }).notification;

  if (!notificationModel) {
    return { success: true };
  }

  const notification = await notificationModel.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await notificationModel.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return { success: true };
}

export async function markAllNotificationsRead(userId: string) {
  const notificationModel = (prisma as typeof prisma & {
    notification?: typeof prisma.notification;
  }).notification;

  if (!notificationModel) {
    return { success: true };
  }

  await notificationModel.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}
