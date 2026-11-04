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

  // حالات النموذج
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  // حالات التحميل والتنبيهات
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mapsExtractedMessage, setMapsExtractedMessage] = useState<string | null>(null);

  // استخراج الإحداثيات الذكي من رابط أو نص Google Maps
  const handleMapsUrlInput = (url: string) => {
    setGoogleMapsUrl(url);
    setMapsExtractedMessage(null);

    if (!url.trim()) return;

    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      setLatitude(atMatch[1]);
      setLongitude(atMatch[2]);
      setMapsExtractedMessage(
        isRtl
          ? `✓ تم استخراج الإحداثيات تلقائياً: (${atMatch[1]}, ${atMatch[2]})`
          : `✓ Extracted Coordinates: (${atMatch[1]}, ${atMatch[2]})`
      );
      return;
    }

    const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      setLatitude(qMatch[1]);
      setLongitude(qMatch[2]);
      setMapsExtractedMessage(
        isRtl
          ? `✓ تم استخراج الإحداثيات تلقائياً: (${qMatch[1]}, ${qMatch[2]})`
          : `✓ Extracted Coordinates: (${qMatch[1]}, ${qMatch[2]})`
      );
      return;
    }

    const rawCoordsMatch = url.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
    if (rawCoordsMatch) {
      setLatitude(rawCoordsMatch[1]);
      setLongitude(rawCoordsMatch[2]);
      setMapsExtractedMessage(
        isRtl
          ? `✓ تم ضبط الإحداثيات بنجاح: (${rawCoordsMatch[1]}, ${rawCoordsMatch[2]})`
          : `✓ Adjusted Coordinates: (${rawCoordsMatch[1]}, ${rawCoordsMatch[2]})`
      );
    }
  };

  // جلب بيانات الفرع الحالية
  useEffect(() => {
    if (!branchId) return;

    const fetchBranchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const res = await fetch(`/api/branches?id=${branchId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('فشل جلب بيانات الفرع');
        }

        const data = await res.json();
        setNameAr(data.nameAr || data.name || '');
        setNameEn(data.nameEn || '');
        setAddress(data.address || '');
        setLatitude(data.latitude ? String(data.latitude) : '');
        setLongitude(data.longitude ? String(data.longitude) : '');
        setRadiusMeters(String(data.radiusMeters || data.geofenceRadius || '100'));
        setIsActive(data.isActive ?? true);
      } catch (err: any) {
        setErrorMessage(err?.message || 'حدث خطأ أثناء تحميل بيانات الفرع');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranchData();
  }, [branchId]);

  // حفظ التعديلات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      id: branchId,
      name: nameAr.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      address: address.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      radiusMeters: Number(radiusMeters) || 100,
      geofenceRadius: Number(radiusMeters) || 100,
      isActive: Boolean(isActive),
    };

    try {
      const res = await fetch('/api/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'فشل تحديث بيانات الفرع');
      }

      setSuccessMessage(isRtl ? 'تم تحديث بيانات الفرع بنجاح' : 'Branch updated successfully');

      setTimeout(() => {
        router.push(`/${locale}/admin/branches`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isRtl ? 'جاري تحميل بيانات الفرع...' : 'Loading branch data...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة مع زر العودة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'تعديل بيانات الفرع' : 'Edit Branch'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'تحديث النطاق الجغرافي والإحداثيات وحالة تشغيل الفرع'
              : 'Update geographic geofence, coordinates, and operating status'}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/branches`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isRtl ? 'العودة لقائمة الفروع' : 'Back to Branches'}
        </Link>
      </div>

      {/* رسائل التنبيه والنجاح */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-sm font-medium text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <span className="font-bold">{isRtl ? 'تنبيه:' : 'Notice:'}</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* بطاقة النموذج المتوافقة مع الثيمين */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/10 dark:bg-[#121526] dark:shadow-xl sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* اسم الفرع بالعربي */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'اسم الفرع' : 'Branch Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder={isRtl ? 'كفتجي دسوق' : 'Branch Name'}
              />
            </div>

            {/* اسم الفرع بالإنجليزي */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'الاسم بالإنجليزية (English Name)' : 'English Name'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder="Koftagy Desouk"
              />
            </div>

            {/* خانة رابط خرائط جوجل الذكية */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'رابط Google Maps أو الإحداثيات' : 'Google Maps URL / Coordinates'}
              </label>
              <input
                type="text"
                value={googleMapsUrl}
                onChange={(e) => handleMapsUrlInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder="https://www.google.com/maps/@31.1218,30.6480,17z أو الصق خط الطول والعرض مباشرة"
              />
              {mapsExtractedMessage && (
                <p className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {mapsExtractedMessage}
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {isRtl
                  ? 'الصق رابط الفرع من خرائط Google لاستخراج خط الطول والعرض وتحديث النطاق تلقائياً.'
                  : 'Paste Google Maps URL to automatically extract coordinates.'}
              </p>
            </div>

            {/* خط العرض (Latitude) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'خط العرض (Latitude)' : 'Latitude'}
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder="31.121838"
              />
            </div>

            {/* خط الطول (Longitude) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'خط الطول (Longitude)' : 'Longitude'}
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder="30.648094"
              />
            </div>

            {/* نصف قطر النطاق الجغرافي */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'نصف قطر نطاق البصمة (بالمتر)' : 'Geofence Radius (meters)'}
              </label>
              <input
                type="number"
                min="5"
                max="5000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder="100"
              />
            </div>

            {/* العنوان التفصيلي */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'العنوان التفصيلي' : 'Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                placeholder={isRtl ? 'المدينة، الشارع، علامة مميزة' : 'City, Street...'}
              />
            </div>

            {/* تفعيل الفرع */}
            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isRtl
                    ? 'تفعيل الفرع ضمن خطة التشغيل والشفتات النشطة'
                    : 'Activate branch for operations and shifts'}
                </span>
              </label>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-white/5">
            <Link
              href={`/${locale}/admin/branches`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
