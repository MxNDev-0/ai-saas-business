const CACHE_NAME = "mcn-engine-v6";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./dashboard.html",
  "./messages.html",
  "./manifest.json",
  "./assets/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

/* ================= INSTALL ================= */
self.addEventListener("install", event => {

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

/* ================= ACTIVATE ================= */
self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {

      return Promise.all(
        keys.map(key => {

          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );

    }).then(() => self.clients.claim())
  );
});

/* ================= FETCH ================= */
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  event.respondWith(

    caches.match(event.request)
      .then(cacheRes => {

        return cacheRes || fetch(event.request)
          .then(fetchRes => {

            const cloned = fetchRes.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, cloned);
              });

            return fetchRes;
          })
          .catch(async () => {

            if (
              event.request.destination === "document"
            ) {

              return await caches.match("./offline.html")
                || await caches.match("./index.html");
            }
          });
      })
  );
});