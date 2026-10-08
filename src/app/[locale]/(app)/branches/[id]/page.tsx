"use client";

import React, { useState, useEffect } from "react";

interface Branch {
  id: number;
  nameAr: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  isActive: boolean;
}

export default function BranchesManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    latitude: "",
    longitude: "",
    geofenceRadius: "100",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // جلب قائمة الفروع
  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || data || []);
      }
    } catch (err) {
      console.error("فشل جلب الفروع:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // إضافة فرع جديد
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!form.nameAr || !form.latitude || !form.longitude) {
      setStatusMessage("يرجى ملء جميع الحقول المطلوبة (الاسم بالعربي، خط العرض، خط الطول)");
      return;
    }

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: form.nameAr,
          nameEn: form.nameEn || form.nameAr,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          geofenceRadius: parseInt(form.geofenceRadius, 10),
        }),
      });

      if (res.ok) {
        setStatusMessage("تم حفظ الفرع بنجاح ✅");
        setForm({ nameAr: "", nameEn: "", latitude: "", longitude: "", geofenceRadius: "100" });
        fetchBranches();
      } else {
        const errData = await res.json();
        setStatusMessage(errData.error || "حدث خطأ أثناء إضافة الفرع");
      }
    } catch (err: any) {
      setStatusMessage("فشل الاتصال بالسيرفر");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-right dir-rtl">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        🏢 إدارة الفروع والنطاق الجغرافي (Geofencing)
      </h1>

      {/* نموذج إضافة فرع جديد */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">
          إضافة فرع جديد
        </h2>

        {statusMessage && (
          <div className="mb-4 p-3 text-sm rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">اسم الفرع (بالعربي)</label>
            <input
              type="text"
              placeholder="مثال: الفرع الرئيسي - القاهرة"
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">خط العرض (Latitude)</label>
            <input
              type="number"
              step="any"
              placeholder="مثال: 30.0444"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">خط الطول (Longitude)</label>
            <input
              type="number"
              step="any"
              placeholder="مثال: 31.2357"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              نصف قطر نطاق الحضور (بالأمتار)
            </label>
            <input
              type="number"
              value={form.geofenceRadius}
              onChange={(e) => setForm({ ...form, geofenceRadius: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              حفظ الفرع الجديد
            </button>
          </div>
        </form>
      </div>

      {/* جدول عرض الفروع المسجلة */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">
          الفروع المضافة حالياً
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">جاري تحميل الفروع...</p>
        ) : (
          <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">اسم الفرع</th>
                <th className="p-3">خط العرض (Lat)</th>
                <th className="p-3">خط الطول (Lng)</th>
                <th className="p-3">نطاق المسموح (متر)</th>
              </tr>
            </thead>
            <tbody>
              {branches.length > 0 ? (
                branches.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">{b.id}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{b.nameAr}</td>
                    <td className="p-3">{b.latitude}</td>
                    <td className="p-3">{b.longitude}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">{b.geofenceRadius} متر</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    لا توجد فروع مضافة حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
