/* Forge service worker — hand-rolled (no Workbox) for Vite 8 / Rolldown safety.
 *
 * Strategy:
 *   - navigations  -> network-first, fall back to cached shell (offline SPA)
 *   - same-origin static assets (hashed JS/CSS/icons) -> cache-first
 *   - cross-origin (the API) -> not intercepted; always hits the network so
 *     auth'd/live data is never served stale from cache.
 *
 * Bump CACHE to invalidate everything on a new deploy.
 */
const CACHE = 'forge-cache-v1';

// Stable, non-hashed assets worth precaching. Hashed build assets are cached
// lazily on first fetch, so they don't need to be listed here.
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Let cross-origin requests (the API) go straight to the network.
  if (url.origin !== self.location.origin) return;
  // Never cache API traffic, even if it's ever proxied under the same origin.
  if (url.pathname.startsWith('/api')) return;

  // App navigations: network-first, fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Static assets: cache-first, populate on first successful fetch.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
