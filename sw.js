const VERSION = "v4.2";
const CACHE = "flip2pdf-" + VERSION;
const SHELL = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // API — network only
  if (url.pathname.startsWith("/api/")) return;

  // External (fonts, CDN) — stale-while-revalidate
  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetching = fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((c) => c.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetching;
      }),
    );
    return;
  }

  // Local — cache first
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((c) => c.put(event.request, clone));
            }
            return response;
          })
        );
      })
      .catch(() => {
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/");
        }
      }),
  );
});
