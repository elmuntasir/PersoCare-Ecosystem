"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const settingsSchema = z.object({
  preferredLanguage: z.enum(["en", "bn"]).optional(),
  showConfirmModal: z.boolean().optional(),
  enableNotifications: z.boolean().optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

export type UserSettingsPayload = {
  preferredLanguage: "en" | "bn";
  showConfirmModal: boolean;
  enableNotifications: boolean;
  theme: "light" | "dark";
};

const defaultSettings: UserSettingsPayload = {
  preferredLanguage: "en",
  showConfirmModal: true,
  enableNotifications: true,
  theme: "light",
};

export async function getSettings(): Promise<UserSettingsPayload> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (!settings) {
    return defaultSettings;
  }

  return {
    preferredLanguage: settings.preferredLanguage === "bn" ? "bn" : "en",
    showConfirmModal: settings.showConfirmModal,
    enableNotifications: settings.enableNotifications,
    theme: settings.theme === "dark" ? "dark" : "light",
  };
}

export async function updateSettings(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const rawConfirm = formData.get("showConfirmModal");
  const rawNotifications = formData.get("enableNotifications");

  const parsed = settingsSchema.parse({
    preferredLanguage: formData.get("preferredLanguage") || undefined,
    showConfirmModal: rawConfirm === null ? undefined : rawConfirm === "true",
    enableNotifications: rawNotifications === null ? undefined : rawNotifications === "true",
    theme: formData.get("theme") || undefined,
  });

  const nextSettings = {
    preferredLanguage: parsed.preferredLanguage ?? defaultSettings.preferredLanguage,
    showConfirmModal: parsed.showConfirmModal ?? defaultSettings.showConfirmModal,
    enableNotifications: parsed.enableNotifications ?? defaultSettings.enableNotifications,
    theme: parsed.theme ?? defaultSettings.theme,
  };

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: nextSettings,
    create: {
      userId: user.id,
      ...nextSettings,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/medicine");
  revalidatePath("/medicine-log");

  return { success: true };
}
