// ============================================================
// Study Hub — Service Worker
// Cache per-file so a single 404 doesn't kill the whole install.
// Skip caching for data/*.json so the app always gets fresh content.
// ============================================================

const CACHE_NAME = "p5-study-hub-v7";

// Only static shell assets — no data/*.json
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./profile-picker.html",
  "./profile-picker.css",
  "./profile-picker.js",
  "./class-picker.html",
  "./style.css",
  "./script.js",
  "./manifest.json"
];

// Install: cache each file individually, tolerate failures
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        SHELL_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn("[SW] Skipped caching:", url, err.message);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for everything, cache fallback only if offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Always go to network first — falls back to cache only if offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful GET responses for offline
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Last resort for navigations
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Allow page to trigger immediate update
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});