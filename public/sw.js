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
  const url = new URL(event.request.url);
  // Passthrough must not wrap Google Maps / Supabase — fetch() in a SW
  // breaks CORS and the Maps script never starts.
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request));
});
