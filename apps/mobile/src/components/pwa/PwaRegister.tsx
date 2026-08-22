"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const isProduction = process.env.NODE_ENV === "production";

    const disableDevelopmentWorker = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    };

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // Best-effort only.
      }
    };

    if (!isProduction) {
      void disableDevelopmentWorker();
      return;
    }

    if (document.readyState === "complete") {
      void register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
