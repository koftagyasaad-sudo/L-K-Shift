const CACHE_NAME = 'lk-shift-v2026-mobile-scale-aurora-v11';

// الملفات الأساسية المحفوظة مسبقاً لفتح التطبيق أوفلاين فوري
const STATIC_ASSETS = [
  '/',
  '/ar/login',
  '/ar/forgot-password',
  '/Logo.png',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache partial fail, fallback runtime:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isSensitivePath =
    url.pathname === '/api' ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/_next/data' ||
    url.pathname.startsWith('/_next/data/') ||
    /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:admin|profile|attendance|requests|leave-requests|payroll|employee|roles)(?:\/|$)/i.test(url.pathname);

  if (isSensitivePath) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            try {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, networkResponse.clone());
            } catch (error) {
              console.warn('Navigation cache write failed:', error);
            }
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;
          const offlineFallback = await caches.match('/');
          if (offlineFallback) return offlineFallback;
          return Response.error();
        })
    );
    return;
  }

  if (event.request.method !== 'GET') return;

  const isStaticAsset = ['font', 'image', 'script', 'style'].includes(event.request.destination);
  if (!isStaticAsset) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedAsset) => {
      if (cachedAsset) return cachedAsset;
      return fetch(event.request, { cache: 'no-store' }).then(async (networkResponse) => {
        if (networkResponse.ok) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
          } catch (error) {
            console.warn('Static asset cache write failed:', error);
          }
        }
        return networkResponse;
      });
    })
  );
});

// استقبال وتمرير إشعارات الهاتف الخارجية (Lock Screen & Notification Drawer)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'تنبيه جديد - L-K Shift', message: event.data ? event.data.text() : 'لديك إشعار جديد في النظام' };
  }

  const title = data.title || 'L-K Shift Core';
  const options = {
    body: data.message || data.body || 'تنبيه وردية / إشعار حضور',
    icon: '/Logo.png',
    badge: '/Logo.png',
    vibrate: [300, 150, 300, 150, 450],
    tag: 'lk-shift-system-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/ar/attendance',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// عند النقر على إشعار شاشة القفل يفتح التطبيق مباشرة على الصفحة المعنية
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/ar/attendance';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
