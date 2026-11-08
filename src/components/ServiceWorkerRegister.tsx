'use client';

import { useEffect } from 'react';
import { syncOfflineAttendance } from '@/utils/offlineSync';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // 1. تسجيل السيرفيس ووركر ليعمل التطبيق بدون إنترنت
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
      });
    }

    // 2. مراقبة عودة الإنترنت للمزامنة التلقائية فوراً
    const handleOnline = async () => {
      console.log('Online detected. Triggering offline sync...');
      await syncOfflineAttendance();
    };

    window.addEventListener('online', handleOnline);

    // فحص البصمات المعلقة عند فتح التطبيق
    if (navigator.onLine) {
      syncOfflineAttendance();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
