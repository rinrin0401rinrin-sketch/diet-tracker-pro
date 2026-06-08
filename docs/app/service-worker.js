const CACHE_NAME = "diet-tracker-pro-pages-app-v3";
const APP_SHELL = [
  "./",
  "./?source=pwa",
  "./index.html",
  "./styles.css?v=2",
  "./app.js?v=2",
  "./manifest.webmanifest",
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
const APP_SHELL_URLS = new Set(APP_SHELL.map((entry) => new URL(entry, self.registration.scope).href));

function isAppShellRequest(request) {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);
  return url.origin === self.location.origin && APP_SHELL_URLS.has(url.href);
}

function isCacheableResponse(response) {
  return response && response.ok && response.type === "basic";
}

async function cacheIfAppShell(request, response) {
  if (!isAppShellRequest(request) || !isCacheableResponse(response)) {
    return;
  }

  const copy = response.clone();
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, copy);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name.startsWith("diet-tracker-pro-") && name !== CACHE_NAME).map((name) => caches.delete(name)))
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
          cacheIfAppShell(event.request, response);
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request, { ignoreSearch: true });
          return cached || caches.match("./index.html", { ignoreSearch: true }) || caches.match("./");
        })
    );
    return;
  }

  if (!isAppShellRequest(event.request)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        cacheIfAppShell(event.request, response);
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
