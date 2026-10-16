const CACHE_NAME = "p5-study-hub-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./profile-picker.html",
  "./profile-picker.css",
  "./profile-picker.js",
  "./class-picker.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./data/profiles.json",
  "./data/dictionary.json",
  "./data/typing.json",
  "./data/p1/subjects.json",
  "./data/p2/subjects.json",
  "./data/p3/subjects.json",
  "./data/p4/subjects.json",
  "./data/p5/subjects.json",
  "./data/p5/maths.json",
  "./data/p5/science.json",
  "./data/p6/subjects.json",
  "./data/jhs1/subjects.json",
  "./data/jhs2/subjects.json",
  "./data/jhs3/subjects.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});