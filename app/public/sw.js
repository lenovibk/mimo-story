// Minimal service worker: just enough for "Add to Home Screen" installability
// plus an offline fallback for the app shell. Deliberately network-first so it
// never fights Vite's dev server / HMR, and never touches story video/audio.
const CACHE_NAME = "mimokids-shell-v4";
const SHELL_URLS = ["/", "/manifest.webmanifest", "/icons/icon-192.png?v=4", "/icons/icon-512.png?v=4"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isDevInternal = url.pathname.startsWith("/@") || url.pathname.startsWith("/src/");
  const isStoryMedia = url.pathname.startsWith("/stories/");
  if (isDevInternal || isStoryMedia) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy).catch(() => {}));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/")))
  );
});
