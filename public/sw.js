// Minimal service worker: exists for PWA installability. Deliberately does
// not cache API/page responses — this app is live-data-dependent (map,
// chat, listings), so aggressive caching would serve stale data.
// ponytail: passthrough only; add real offline support later if needed.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
