const CACHE_NAME = "claims-portal-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./login.html",
  "./admin.html",
  "./analytics.html",
  "./manage-users.html",
  "./add-user.html",
  "./claim.html",
  "./status.html",
  "./js/utils.js",
  "./js/api.js",
  "./js/config.js",
  "./js/auth.js",
  "./js/admin.js",
  "./images/icon-192-192x192.png",
  "./images/icon-192-512x512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell");
      return cache.addAll(ASSETS);
    }),
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
