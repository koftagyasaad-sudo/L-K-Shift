// src/utils/offlineSync.ts

export interface OfflineAttendanceRecord {
  id?: number;
  userId: string;
  userName: string;
  action: 'CHECK_IN' | 'CHECK_OUT';
  latitude: number;
  longitude: number;
  distanceMeters: number;
  photoBase64: string;
  timestamp: string;
  recordedAt?: string;
  deviceTimestamp?: string;
}

const DB_NAME = 'LKShiftOfflineDB';
const STORE_NAME = 'offline_attendance';
const DB_VERSION = 1;

// فتح أو إنشاء قاعدة بيانات IndexedDB للمتصفح
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. حفظ بصمة جديدة أوفلاين
export async function saveOfflineAttendance(record: OfflineAttendanceRecord): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => resolve(Number(req.result));
    req.onerror = () => reject(req.error);
  });
}

// 2. جلب جميع البصمات المعلقة أوفلاين
export async function getPendingOfflineAttendance(): Promise<OfflineAttendanceRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// 3. حذف بصمة بعد نجاح رفعها للسيرفر
export async function removeOfflineAttendance(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// 4. دالة المزامنة ورفع الداتا للسيرفر أول ما يلقط إنترنت
export async function syncOfflineAttendance(): Promise<{ syncedCount: number; errors: number }> {
  if (!navigator.onLine) {
    return { syncedCount: 0, errors: 0 };
  }

  const pending = await getPendingOfflineAttendance();
  if (pending.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errors = 0;

  for (const record of pending) {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: record.action,
          userId: record.userId,
          latitude: record.latitude,
          longitude: record.longitude,
          distanceMeters: record.distanceMeters,
          photoBase64: record.photoBase64,
          recordedAt: record.recordedAt || record.deviceTimestamp || record.timestamp,
        }),
      });

      if (res.ok && record.id) {
        await removeOfflineAttendance(record.id);
        syncedCount++;
      } else {
        errors++;
      }
    } catch {
      errors++;
      break; // انقطع النت مجدداً، إيقاف المحاولة مؤقتاً
    }
  }

  return { syncedCount, errors };
}
