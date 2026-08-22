"use client";

import { useState, useTransition } from "react";
import type { ComponentType, ReactNode, FormEvent } from "react";
import { updateSettings, type UserSettingsPayload } from "@/actions/settings";
import { Bell, CheckSquare, Globe, MoonStar, Save, SunMedium } from "lucide-react";

interface SettingsClientProps {
  initialSettings: UserSettingsPayload;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (key: "showConfirmModal" | "enableNotifications") => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.append("preferredLanguage", settings.preferredLanguage);
      fd.append("showConfirmModal", String(settings.showConfirmModal));
      fd.append("enableNotifications", String(settings.enableNotifications));
      fd.append("theme", settings.theme);

      try {
        await updateSettings(fd);
        setMessage({ type: "success", text: "Settings saved successfully." });
      } catch (err: unknown) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to save settings.",
        });
      }
    });
  };

  return (
    <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <SettingRow
          icon={Globe}
          title="Language"
          description="Choose your preferred language across the app."
          control={
            <select
              value={settings.preferredLanguage}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  preferredLanguage: e.target.value as UserSettingsPayload["preferredLanguage"],
                }))
              }
              className="rounded-full border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2 text-sm text-[var(--ink)]"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          }
        />

        <SettingRow
          icon={CheckSquare}
          title="Confirmation Modal"
          description="Show a confirmation step before completing medicine actions."
          control={
            <Toggle
              checked={settings.showConfirmModal}
              onChange={() => toggle("showConfirmModal")}
            />
          }
        />

        <SettingRow
          icon={Bell}
          title="Notifications"
          description="Enable in-app reminders and system notifications."
          control={
            <Toggle
              checked={settings.enableNotifications}
              onChange={() => toggle("enableNotifications")}
            />
          }
        />

        <SettingRow
          icon={settings.theme === "dark" ? MoonStar : SunMedium}
          title="Theme"
          description="Choose the look and feel you prefer."
          control={
            <select
              value={settings.theme}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  theme: e.target.value as UserSettingsPayload["theme"],
                }))
              }
              className="rounded-full border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2 text-sm text-[var(--ink)]"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          }
        />

        {message && (
          <div
            className={`rounded-2xl border p-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--teal-900)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--teal-700)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  control,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--sage-200)] pb-5 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--teal-900)]">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-semibold text-[var(--ink)]">{title}</p>
          <p className="text-sm text-[var(--ink-soft)]">{description}</p>
        </div>
      </div>
      <div>{control}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full border transition-colors ${
        checked ? "border-[var(--teal-900)] bg-[var(--teal-900)]" : "border-[var(--sage-200)] bg-[var(--sage-200)]"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
