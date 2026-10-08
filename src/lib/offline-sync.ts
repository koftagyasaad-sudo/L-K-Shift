// مكتبة إدارة الحضور أوفلاين وتخزينها محليًا في IndexedDB

const DB_NAME = "LKShiftOfflineDB";
const STORE_NAME = "pending_attendance";

export interface PendingAttendance {
  id?: number;
  userId: number;
  branchId: number;
  type: "CHECK_IN" | "CHECK_OUT";
  latitude: string;
  longitude: string;
  timestamp: string; // وقت التسجيل الفعلي المحفوظ لحظة الضغط
  photoBase64?: string;
  mode: string;
}

// فتح/إنشاء قاعدة البيانات المحلية IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// حفظ حركة الحضور محليًا عند غياب الإنترنت
export async function saveOfflineAttendance(data: Omit<PendingAttendance, "id">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// جلب جميع الحركات المعلقة
export async function getPendingAttendance(): Promise<PendingAttendance[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// حذف الحركة بعد نجاح رفعها للسيرفر
export async function removePendingAttendance(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// المزامنة التلقائية مع السيرفر فور عودة الإنترنت
export async function syncOfflineAttendance(): Promise<{ syncedCount: number }> {
  if (!navigator.onLine) return { syncedCount: 0 };

  const pendingList = await getPendingAttendance();
  let syncedCount = 0;

  for (const item of pendingList) {
    try {
      const formData = new FormData();
      formData.append("userId", item.userId.toString());
      formData.append("branchId", item.branchId.toString());
      formData.append("type", item.type);
      formData.append("latitude", item.latitude);
      formData.append("longitude", item.longitude);
      formData.append("timestamp", item.timestamp);
      formData.append("mode", item.mode);
      formData.append("isOfflineSync", "true");

      if (item.photoBase64) {
        formData.append("photoBase64", item.photoBase64);
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        if (item.id !== undefined) {
          await removePendingAttendance(item.id);
        }
        syncedCount++;
      }
    } catch (err) {
      console.error("فشل تزامن السجل أوفلاين:", err);
    }
  }

  return { syncedCount };
}
