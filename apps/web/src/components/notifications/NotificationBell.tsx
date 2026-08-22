"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CircleAlert, Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { NotificationItem } from "@/lib/notifications";

type NotificationsPayload = {
  notifications: NotificationItem[];
  unreadCount: number;
};

const TYPE_STYLES: Record<NotificationItem["type"], { icon: typeof Info; ring: string; dot: string }> = {
  INFO: { icon: Info, ring: "border-sky-200 bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  SUCCESS: { icon: CheckCircle2, ring: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  WARNING: { icon: CircleAlert, ring: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  ERROR: { icon: ShieldAlert, ring: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-500" },
};

export function NotificationBell() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const unreadLabel = useMemo(() => {
    if (unreadCount > 99) return "99+";
    return String(unreadCount);
  }, [unreadCount]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as NotificationsPayload;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 60000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(initial);
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const markReadAndGo = async (item: NotificationItem) => {
    if (!item.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id }),
      });
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === item.id ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    setOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--sage-200)] bg-white text-[var(--teal-900)] transition-colors hover:bg-[var(--paper)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.8} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--coral)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-[var(--sage-200)] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--sage-200)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--teal-900)]">Notifications</p>
              <p className="text-[11px] text-[var(--ink-soft)]">
                {unreadCount} unread
                {loading ? " · Refreshing" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sage-200)] px-3 py-1.5 text-xs font-medium text-[var(--teal-900)] hover:bg-[var(--paper)]"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Mark all read
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-[var(--teal-900)]">You&apos;re all caught up.</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  New appointment, prescription, and system alerts will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--sage-200)]">
                {notifications.map((item) => {
                  const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.INFO;
                  const Icon = style.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markReadAndGo(item)}
                      className={`block w-full px-4 py-3 text-left transition-colors hover:bg-[var(--paper)] ${
                        item.isRead ? "opacity-80" : "bg-[var(--paper)]/60"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${style.ring}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-[var(--teal-900)]">
                              {item.title}
                            </p>
                            {!item.isRead ? (
                              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${style.dot}`} />
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-[var(--ink-soft)]">{item.message}</p>
                          <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
