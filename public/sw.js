// AppPassport service worker — cache-on-visit strategy.
// We do NOT pre-cache the whole site; we cache country pages the user actually
// visits so they're readable offline afterward (bad hotel wifi, on a plane...).

const CACHE = "apppassport-v1";
const APP_SHELL = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only handle same-origin navigations/pages.
  if (url.origin !== self.location.origin) return;

  const isCountryPage = url.pathname.startsWith("/country/");
  const isNavigation = request.mode === "navigate";

  if (isCountryPage || isNavigation) {
    // Network-first, fall back to cache (so visited countries work offline).
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/offline"))
        )
    );
  }
});
