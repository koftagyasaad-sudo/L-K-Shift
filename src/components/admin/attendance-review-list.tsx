"use client";

import React, { useState } from "react";

interface AttendanceRecord {
  id: number;
  employeeName: string;
  performanceId: string;
  branchName: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInPhotoUrl?: string;
  status: string;
  lateReason?: string;
}

export default function AttendanceReviewList({ initialLogs }: { initialLogs: AttendanceRecord[] }) {
  const [logs, setLogs] = useState<AttendanceRecord[]>(initialLogs);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/attendance-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: id, status }),
      });

      if (res.ok) {
        setLogs((prev) =>
          prev.map((log) => (log.id === id ? { ...log, status } : log))
        );
      } else {
        alert("فشل تحديث الحالة");
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 dir-rtl text-right">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{log.employeeName}</h4>
                  <p className="text-xs text-slate-500">رقم الأداء: {log.performanceId}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    log.status === "APPROVED" || log.status === "AUTO_APPROVED"
                      ? "bg-green-100 text-green-800"
                      : log.status === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {log.status === "APPROVED" || log.status === "AUTO_APPROVED"
                    ? "مقبول ✅"
                    : log.status === "REJECTED"
                    ? "مرفوض ❌"
                    : "قيد المراجعة ⏳"}
                </span>
              </div>

              {log.checkInPhotoUrl && (
                <div className="my-3 h-40 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border">
                  <img
                    src={log.checkInPhotoUrl}
                    alt="صورة الحضور"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 my-2">
                <p>📍 الفرع: <strong>{log.branchName}</strong></p>
                <p>🕒 الحضور: <strong>{new Date(log.checkInTime).toLocaleString("ar-EG")}</strong></p>
                {log.lateReason && (
                  <p className="text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠️ سبب التأخير: {log.lateReason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button
                onClick={() => handleAction(log.id, "APPROVED")}
                disabled={loadingId === log.id}
                className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                قبول
              </button>
              <button
                onClick={() => handleAction(log.id, "REJECTED")}
                disabled={loadingId === log.id}
                className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50 transition"
              >
                رفض
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
