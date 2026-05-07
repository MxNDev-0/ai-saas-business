const CACHE_NAME = "mcn-engine-v5";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./dashboard.html",
  "./manifest.json",
  "./assets/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// ================= INSTALL =================
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        await cache.addAll(STATIC_ASSETS);
        console.log("✅ Static assets cached");
      } catch (err) {
        console.log("❌ Cache install failed:", err);
      }
    })
  );
});

// ================= ACTIVATE =================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("🗑 Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ================= FETCH =================
self.addEventListener("fetch", event => {

  // Ignore unsupported requests
  if (
    event.request.method !== "GET" ||
    event.request.url.startsWith("chrome-extension")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {

      // ✅ Return cached asset immediately
      if (cachedResponse) {
        return cachedResponse;
      }

      // ✅ Otherwise fetch from network
      return fetch(event.request)
        .then(networkResponse => {

          // Prevent broken responses from caching
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();

          // Save successful responses
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(async () => {

          // ================= OFFLINE FALLBACK =================

          // HTML pages
          if (event.request.destination === "document") {
            return (
              await caches.match("./offline.html")
            ) || (
              await caches.match("./index.html")
            );
          }

          // Images fallback
          if (event.request.destination === "image") {
            return caches.match("./assets/logo.png");
          }

        });
    })
  );
});