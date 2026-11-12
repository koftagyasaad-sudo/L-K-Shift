const CACHE_NAME = 'lk-shift-v2026-offline-layout-password-v2';

// الملفات الأساسية المحفوظة مسبقاً لفتح التطبيق أوفلاين فوري
const STATIC_ASSETS = [
  '/',
  '/ar/attendance',
  '/ar/profile',
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
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية التشغيل الأوفلاين: جلب من المخبأ فوراً إذا انقطع النت
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // استبعاد مسارات الـ API الحساسة من التخزين الثابت
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // إذا انقطع النت، يتم تسليم الصفحة المخبأة فوراً
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
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
