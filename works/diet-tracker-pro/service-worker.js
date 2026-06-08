const CACHE_NAME = "diet-tracker-pro-v30";
const APP_SHELL = [
  "./",
  "./?source=pwa",
  "./index.html",
  "./clear-cache.html",
  "./styles.css?v=29",
  "./app.js?v=29",
  "./manifest.webmanifest",
  "./lp-concepts/",
  "./lp-concepts/index.html",
  "./lp-concepts/styles.css",
  "./lp-concepts/assets/apple-luxury-wide.png",
  "./lp-concepts/assets/apple-luxury-mobile.png",
  "./lp-concepts/assets/apple-luxury-controls.png",
  "./assets/apple-luxury-wide.png",
  "./assets/apple-luxury-mobile.png",
  "./assets/apple-luxury-controls.png",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/apple-touch-icon-v2.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request, { ignoreSearch: true });
          return cached || caches.match("./index.html", { ignoreSearch: true }) || caches.match("./");
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
