'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default function EditBranchPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const branchId = resolvedParams?.id;
  const isRtl = locale === 'ar';

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');

  // إعدادات الشيفتات والورديات
  const [morningStart, setMorningStart] = useState('09:00');
  const [morningEnd, setMorningEnd] = useState('17:00');
  const [eveningStart, setEveningStart] = useState('17:00');
  const [eveningEnd, setEveningEnd] = useState('01:00');
  const [gracePeriod, setGracePeriod] = useState('15');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingGps, setIsCapturingGps] = useState(false);

  // ميزة التقاط الموقع الميداني الفوري
  const captureCurrentGpsLocation = () => {
    if (!navigator.geolocation) return;
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCapturingGps(false);
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        alert('تم التقاط إحداثيات موقعك الفعلي بنجاح!');
      },
      () => {
        setIsCapturingGps(false);
        alert('تعذر الوصول للـ GPS');
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!branchId) return;

    fetch(`/api/branches?id=${branchId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setNameAr(data.nameAr || data.name || '');
          setNameEn(data.nameEn || '');
          setPhone(data.phone || '');
          setManagerName(data.managerName || '');
          setAddress(data.address || '');
          setLatitude(data.latitude ? String(data.latitude) : '');
          setLongitude(data.longitude ? String(data.longitude) : '');
          setRadiusMeters(String(data.radiusMeters || data.geofenceRadius || '100'));
          setMorningStart(data.morningStart || '09:00');
          setMorningEnd(data.morningEnd || '17:00');
          setEveningStart(data.eveningStart || '17:00');
          setEveningEnd(data.eveningEnd || '01:00');
          setGracePeriod(String(data.gracePeriod || '15'));
        }
      })
      .finally(() => setIsLoading(false));
  }, [branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      id: branchId,
      name: nameAr.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      phone: phone.trim(),
      managerName: managerName.trim(),
      address: address.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      radiusMeters: Number(radiusMeters) || 100,
      morningStart,
      morningEnd,
      eveningStart,
      eveningEnd,
      gracePeriod: parseInt(gracePeriod, 10) || 15,
      isActive: true,
    };

    try {
      const res = await fetch('/api/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('فشل تحديث بيانات الفرع');

      alert('تم تحديث بيانات الفرع ومواعيد الشيفتات بنجاح!');
      router.push(`/${locale}/admin/branches`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            تعديل بيانات الفرع والورديات (الشيفتات)
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            ضبط الإحداثيات ونطاق البصمة ومواعيد الشيفت الصباحي والمسائي
          </p>
        </div>
        <Link
          href={`/${locale}/admin/branches`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
        >
          العودة للفروع
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/10 dark:bg-[#121526] sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">اسم الفرع بالعربي *</label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">اسم المدير / المشرف</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* إعدادات مواعيد الورديات الصباحية والمسائية */}
            <div className="sm:col-span-2 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                ⏰ مواعيد ورديات وتشغيل الفرع (لمطابقة الحضور والانصراف والتأخير)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-2">
                  <span className="text-xs font-bold text-orange-500">الوردية الصباحية (Morning Shift)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500">بداية الشيفت</label>
                      <input
                        type="time"
                        value={morningStart}
                        onChange={(e) => setMorningStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">نهاية الشيفت</label>
                      <input
                        type="time"
                        value={morningEnd}
                        onChange={(e) => setMorningEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-2">
                  <span className="text-xs font-bold text-purple-500">الوردية المسائية (Evening Shift)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500">بداية الشيفت</label>
                      <input
                        type="time"
                        value={eveningStart}
                        onChange={(e) => setEveningStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">نهاية الشيفت</label>
                      <input
                        type="time"
                        value={eveningEnd}
                        onChange={(e) => setEveningEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <label className="font-semibold text-slate-600 dark:text-slate-400">فترة السماح قبل احتساب تأخير:</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  className="w-20 rounded-lg border border-slate-300 p-1.5 dark:bg-slate-900 text-center font-bold"
                />
                <span className="text-slate-500">دقيقة</span>
              </div>
            </div>

            {/* معايرة الإحداثيات */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">خط العرض (Latitude) *</label>
              <input
                type="text"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">خط الطول (Longitude) *</label>
              <input
                type="text"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={captureCurrentGpsLocation}
                disabled={isCapturingGps}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
              >
                {isCapturingGps ? 'جاري الالتقاط بالـ GPS...' : '🎯 تثبيت موقعي الحالي كإحداثيات للفرع'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-white/5">
            <Link
              href={`/${locale}/admin/branches`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات والورديات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
