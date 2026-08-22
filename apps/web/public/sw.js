self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const registrations = await self.registration.unregister();
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        return registrations;
      } catch {
        return false;
      }
    })()
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
