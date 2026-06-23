// Minimal offline-friendly service worker.
const CACHE = 'mimi-v1';
const ASSETS = ['/', '/dashboard', '/icon.svg', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return; // never cache API
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached
        ? cached
        : fetch(e.request)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
              return res;
            })
            .catch(() => cached as any),
    ),
  );
});
