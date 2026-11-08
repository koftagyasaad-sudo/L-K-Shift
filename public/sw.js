// public/sw.js - L-K Shift Service Worker for Offline Mode
const CACHE_NAME = 'lk-shift-cache-v1';

// الملفات الأساسية المخزنة للتشغيل أوفلاين
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/Logo.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// استراتيجية Network First مع العودة للكاش عند انقطاع النت
self.addEventListener('fetch', (event) => {
  // عدم اعتراض مسارات الـ API لتتم معالجتها عبر IndexedDB
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إذا كان المستخدم يطلب صفحة، يتم إرجاع الصفحة المخبأة
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});
