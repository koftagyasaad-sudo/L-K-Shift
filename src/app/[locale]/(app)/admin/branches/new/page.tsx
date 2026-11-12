'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface ManagerOption {
  id: string;
  name?: string;
  fullName?: string;
  role?: string;
}

export default function NewBranchPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState('');
  const [managerName, setManagerName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('31.1218');
  const [longitude, setLongitude] = useState('30.6480');
  const [radiusMeters, setRadiusMeters] = useState('100');

  // الورديات الثلاث
  const [morningStart, setMorningStart] = useState('09:00');
  const [morningEnd, setMorningEnd] = useState('17:00');
  const [eveningStart, setEveningStart] = useState('17:00');
  const [eveningEnd, setEveningEnd] = useState('01:00');
  const [betweenStart, setBetweenStart] = useState('13:00');
  const [betweenEnd, setBetweenEnd] = useState('21:00');
  const [gracePeriod, setGracePeriod] = useState('15');

  const [managersList, setManagersList] = useState<ManagerOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/employees', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setManagersList(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load employees for managers list:', err));
  }, []);

  const handleManagerSelect = (mId: string) => {
    setManagerId(mId);
    const found = managersList.find((m) => String(m.id) === mId);
    if (found) {
      setManagerName(found.name || found.fullName || '');
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
    if (!nameAr.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      phone: phone.trim(),
      managerId: managerId || null,
      managerName: managerName.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
      address: address.trim(),
      latitude: parseFloat(latitude) || 31.1218,
      longitude: parseFloat(longitude) || 30.6480,
      radiusMeters: parseInt(radiusMeters, 10) || 100,
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'فشل حفظ الفرع');
      }

      router.push(`/${locale}/admin/branches`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الفرع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            إضافة فرع جديد
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            تحديد موقع الفرع، نطاق البصمة الجغرافي، وتعيين مدير الفرع والورديات
          </p>
        </div>

        <Link
          href={`/${locale}/admin/branches`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
        >
          العودة للفروع
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          {errorMessage}
        </div>
      )}

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
                placeholder="فرع دسوق / كفر الشيخ..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none"
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
                placeholder="Branch Name (EN)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                تعيين مدير الفرع المسؤول (تصل إليه إجازات الفرع)
              </label>
              <select
                value={managerId}
                onChange={(e) => handleManagerSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">-- اختر مدير الفرع من القائمة --</option>
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
                placeholder="05XXXXXXXX"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* الورديات الثلاث بعد تصحيح التباين وظهور النص بوضوح تام */}
            <div className="sm:col-span-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>⏰</span> مواعيد ورديات الفرع الثلاث (صباحية، بينية، مسائية)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. الصباحية */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2.5">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block">1. الوردية الصباحية</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">من</label>
                      <input
                        type="time"
                        value={morningStart}
                        onChange={(e) => setMorningStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/40 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">إلى</label>
                      <input
                        type="time"
                        value={morningEnd}
                        onChange={(e) => setMorningEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/40 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. البينية */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">2. الوردية البينية (Between)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">من</label>
                      <input
                        type="time"
                        value={betweenStart}
                        onChange={(e) => setBetweenStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/40 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">إلى</label>
                      <input
                        type="time"
                        value={betweenEnd}
                        onChange={(e) => setBetweenEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/40 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. المسائية */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">3. الوردية المسائية</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">من</label>
                      <input
                        type="time"
                        value={eveningStart}
                        onChange={(e) => setEveningStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/40 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">إلى</label>
                      <input
                        type="time"
                        value={eveningEnd}
                        onChange={(e) => setEveningEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/40 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">فترة السماح قبل احتساب تأخير:</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black/40 p-1.5 text-center text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
                placeholder="الشارع، الحي، المعلم الرئيسي..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الفرع الجديد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
