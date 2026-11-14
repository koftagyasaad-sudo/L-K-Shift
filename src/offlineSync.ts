export interface OfflineAttendanceRecord {
  id?: number;
  userId: string;
  userName: string;
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

let isSyncingNow = false;
export async function syncOfflineAttendance(): Promise<{ syncedCount: number; errors: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, errors: 0 };
  }
  if (isSyncingNow) {
    return { syncedCount: 0, errors: 0 };
  }

  isSyncingNow = true;
  let syncedCount = 0;
  let errors = 0;

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
          }),
        });

        if (res.ok && record.id !== undefined) {
          await removeOfflineAttendance(record.id);
          syncedCount++;
        } else {
          errors++;
        }
      } catch {
        errors++;
        break;
      }
    }
  } finally {
    isSyncingNow = false;
  }

  return { syncedCount, errors };
}
