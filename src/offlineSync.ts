export interface OfflineAttendanceRecord {
  id?: number;
  userId: string;
  userName: string;
  userPhone?: string;
  branchId?: string;
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

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function notifySyncStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lk-offline-sync-updated'));
  }
}

export async function saveOfflineAttendance(record: OfflineAttendanceRecord): Promise<number> {
  const db = await openDB();
  const id = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => resolve(Number(req.result));
    req.onerror = () => reject(req.error);
  });
  notifySyncStateChanged();
  return id;
}

export async function getPendingOfflineAttendance(): Promise<OfflineAttendanceRecord[]> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeOfflineAttendance(id: number): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notifySyncStateChanged();
}

let isSyncingNow = false;
export async function syncOfflineAttendance(): Promise<{ syncedCount: number; errors: number; lastError?: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, errors: 0 };
  }
  if (isSyncingNow) {
    return { syncedCount: 0, errors: 0 };
  }

  isSyncingNow = true;
  let syncedCount = 0;
  let errors = 0;
  let lastError = '';

  try {
    const pending = await getPendingOfflineAttendance();
    if (pending.length === 0) {
      return { syncedCount: 0, errors: 0 };
    }

    for (const record of pending) {
      try {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: record.action,
            userId: record.userId,
            branchId: record.branchId,
            latitude: record.latitude,
            longitude: record.longitude,
            distanceMeters: record.distanceMeters,
            photoBase64: record.photoBase64,
            timestamp: record.timestamp,
            recordedAt: record.recordedAt || record.deviceTimestamp || record.timestamp,
            offlineSync: true,
          }),
        });

        if (res.ok && record.id !== undefined) {
          await removeOfflineAttendance(record.id);
          syncedCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData?.message || `HTTP ${res.status}`;
          // If record already exists or is permanently invalid (400/409), remove from queue so it doesn't block future punches
          if (res.status === 400 || res.status === 409) {
            if (record.id !== undefined) await removeOfflineAttendance(record.id);
          } else {
            errors++;
          }
        }
      } catch (e) {
        errors++;
        lastError = e instanceof Error ? e.message : 'Network error';
        break;
      }
    }
  } finally {
    isSyncingNow = false;
    notifySyncStateChanged();
  }

  return { syncedCount, errors, lastError };
}
