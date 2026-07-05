const CACHE_NAME = "soma-cache-v1"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Network-first: always try the live network so chat responses stay fresh.
// Falls back to cache only if the network request fails (e.g. briefly offline).
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})