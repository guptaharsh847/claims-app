const CACHE_NAME = "claims-portal-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./login.html",
  "./claim.html",
  "./status.html",
  "./js/utils.js",
  "./js/api.js",
  "./js/config.js",
  "./js/auth.js",
  "./images/icon-192-192x192.png",
  "./images/icon-192-512x512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.error(`Failed to cache ${asset}:`, err);
        }
      }
    }),
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
