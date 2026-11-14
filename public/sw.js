const CACHE_NAME = 'lk-shift-v2026-offline-pwa-v26';
const APP_SHELL_URLS = [
  '/ar/attendance',
  '/ar/requests',
  '/ar/employee/salary',
  '/ar/profile',
  '/ar/login',
  '/manifest.json',
  '/Logo.png?v=25',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        APP_SHELL_URLS.map((url) =>
          fetch(url, { credentials: 'include' }).then((res) => {
            if (res.ok) return cache.put(url, res);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // For API GET requests (like /api/branches), use Network-First and fall back to cached response when offline
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/branches' || url.pathname === '/api/auth/session') {
      event.respondWith(
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => caches.match(req))
      );
    }
    return;
  }

  // For Next.js static chunks (_next/static), images, fonts: Cache-First with Network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // For HTML page navigations & RSC payloads: Network-First, fallback to cached page or /ar/attendance shell when offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const exactMatch = await caches.match(req);
        if (exactMatch) return exactMatch;
        const pathOnlyMatch = await caches.match(url.pathname);
        if (pathOnlyMatch) return pathOnlyMatch;
        const attendanceFallback = await caches.match('/ar/attendance');
        if (attendanceFallback) return attendanceFallback;
        return caches.match('/ar/login');
      })
  );
});
