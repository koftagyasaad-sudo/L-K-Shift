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
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState('');
  const [managerName, setManagerName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');

  // الورديات الثلاث
  const [morningStart, setMorningStart] = useState('09:00');
  const [morningEnd, setMorningEnd] = useState('17:00');
  const [eveningStart, setEveningStart] = useState('17:00');
  const [eveningEnd, setEveningEnd] = useState('01:00');
  const [betweenStart, setBetweenStart] = useState('13:00');
  const [betweenEnd, setBetweenEnd] = useState('21:00');
  const [gracePeriod, setGracePeriod] = useState('15');

  const [managersList, setManagersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingGps, setIsCapturingGps] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/employees', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/branches?id=${branchId}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ]).then(([empData, branchData]) => {
      if (Array.isArray(empData)) setManagersList(empData);
      if (branchData) {
        setNameAr(branchData.nameAr || branchData.name || '');
        setNameEn(branchData.nameEn || '');
        setPhone(branchData.phone || '');
        setManagerId(branchData.managerId ? String(branchData.managerId) : '');
        setManagerName(branchData.managerName || '');
        setAddress(branchData.address || '');
        setLatitude(branchData.latitude ? String(branchData.latitude) : '');
        setLongitude(branchData.longitude ? String(branchData.longitude) : '');
        setRadiusMeters(String(branchData.radiusMeters || branchData.geofenceRadius || '100'));
        setMorningStart(branchData.morningStart || '09:00');
        setMorningEnd(branchData.morningEnd || '17:00');
        setEveningStart(branchData.eveningStart || '17:00');
        setEveningEnd(branchData.eveningEnd || '01:00');
        setBetweenStart(branchData.betweenStart || '13:00');
        setBetweenEnd(branchData.betweenEnd || '21:00');
        setGracePeriod(String(branchData.gracePeriod || '15'));
      }
      setIsLoading(false);
    });
  }, [branchId]);

  const handleManagerSelect = (mId: string) => {
    setManagerId(mId);
    const found = managersList.find((m) => String(m.id) === mId);
    if (found) {
      setManagerName(found.name || found.fullName);
    } else {
      setManagerName('');
    }
  };

  const captureCurrentGps = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      id: branchId,
      name: nameAr.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      phone: phone.trim(),
      managerId: managerId ? parseInt(managerId, 10) : null,
      managerName: managerName.trim(),
      address: address.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      radiusMeters: Number(radiusMeters) || 100,
      morningStart,
      morningEnd,
      eveningStart,
      eveningEnd,
      betweenStart,
      betweenEnd,
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

      alert('تم تحديث كافة بيانات الفرع ونطاق البصمة والورديات بنجاح!');
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
            تعديل بيانات الفرع ونطاق البصمة
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            تحديث شامل للإحداثيات، نصف قطر نطاق البصمة بالمتر، والورديات الثلاث
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
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                اسم الفرع بالعربي *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                اسم الفرع بالإنجليزي
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                مدير الفرع المسؤول
              </label>
              <select
                value={managerId}
                onChange={(e) => handleManagerSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">-- اختر مدير الفرع --</option>
                {managersList.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name || m.fullName} ({m.role || 'موظف'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                رقم هاتف الفرع
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* الورديات الثلاث */}
            <div className="sm:col-span-2 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                ⏰ مواعيد ورديات الفرع الثلاث (صباحية، بينية، مسائية)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-2">
                  <span className="text-xs font-bold text-orange-500">1. الصباحية</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500">من</label>
                      <input
                        type="time"
                        value={morningStart}
                        onChange={(e) => setMorningStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">إلى</label>
                      <input
                        type="time"
                        value={morningEnd}
                        onChange={(e) => setMorningEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-2">
                  <span className="text-xs font-bold text-blue-500">2. البينية (Between)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500">من</label>
                      <input
                        type="time"
                        value={betweenStart}
                        onChange={(e) => setBetweenStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">إلى</label>
                      <input
                        type="time"
                        value={betweenEnd}
                        onChange={(e) => setBetweenEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-2">
                  <span className="text-xs font-bold text-purple-500">3. المسائية</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500">من</label>
                      <input
                        type="time"
                        value={eveningStart}
                        onChange={(e) => setEveningStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">إلى</label>
                      <input
                        type="time"
                        value={eveningEnd}
                        onChange={(e) => setEveningEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <label className="font-semibold text-slate-600 dark:text-slate-400">فترة السماح قبل التأخير:</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  className="w-16 rounded-lg border border-slate-300 p-1.5 dark:bg-slate-900 text-center font-bold"
                />
                <span className="text-slate-500">دقيقة</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                خط العرض (Latitude) *
              </label>
              <input
                type="text"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                خط الطول (Longitude) *
              </label>
              <input
                type="text"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* نصف قطر نطاق البصمة */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                نصف قطر نطاق البصمة الجغرافي (بالمتر) *
              </label>
              <input
                type="number"
                min="10"
                max="3000"
                required
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                placeholder="100"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                المدى المسموح للموظف لتسجيل الحضور حول الفرع (مستحسن 50 - 150م لمراعاة ضعف الشبكة داخل المقرات).
              </span>
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={captureCurrentGps}
                disabled={isCapturingGps}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
              >
                {isCapturingGps ? 'جاري الالتقاط بالـ GPS...' : '🎯 تثبيت موقعي الحالي كإحداثيات للفرع'}
              </button>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                العنوان النصي للفرع
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
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
