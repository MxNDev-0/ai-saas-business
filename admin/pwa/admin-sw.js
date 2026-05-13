const CACHE_NAME =
  "mcn-admin-v1";

const urlsToCache = [

  "../admin.html",

  "../admin.js",

  "../admin-loader.js",

  "../admin-auth.js",

  "../emergency-control.js",

  "../hidden-monitor.js",

  "../mobile-diagnostics.js"
];

self.addEventListener("install", (event) => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then((cache) => {

        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("fetch", (event) => {

  event.respondWith(

    caches.match(event.request)
      .then((response) => {

        return response || fetch(event.request);
      })
  );
});