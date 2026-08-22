"use client";

import { useEffect } from "react";

export function WebDevCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        // Best-effort cleanup only.
      }
    };

    void cleanup();
  }, []);

  return null;
}
