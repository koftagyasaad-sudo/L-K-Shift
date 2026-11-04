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
  const [code, setCode] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  // حالات التحميل والرسائل
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mapsExtractedMessage, setMapsExtractedMessage] = useState<string | null>(null);

  // دالة ذكية لاستخراج الإحداثيات فورياً من رابط أو نص خرائط جوجل
  const handleMapsUrlInput = (url: string) => {
    setGoogleMapsUrl(url);
    setMapsExtractedMessage(null);

    if (!url.trim()) return;

    // 1. نمط الإحداثيات بعد @ مثل: /@31.1218381,30.6480945,17z
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

    // 2. نمط الاستعلام مثل: ?q=31.1218381,30.6480945 أو ll=31.1218381,30.6480945
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

    // 3. نمط الإحداثيات المجردة المنسوخة مباشرة (31.121838, 30.648094)
    const rawCoordsMatch = url.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
    if (rawCoordsMatch) {
      setLatitude(rawCoordsMatch[1]);
      setLongitude(rawCoordsMatch[2]);
      setMapsExtractedMessage(
        isRtl
          ? `✓ تم ضبط خطوط الطول والعرض بنجاح: (${rawCoordsMatch[1]}, ${rawCoordsMatch[2]})`
          : `✓ Adjusted Coordinates: (${rawCoordsMatch[1]}, ${rawCoordsMatch[2]})`
      );
    }
  };

  // استرداد بيانات الفرع الحالية
  useEffect(() => {
    if (!branchId) return;

    const fetchBranchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const res = await fetch(`/api/admin/branches/${branchId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('فشل جلب بيانات الفرع المسجل');
        }

        const data = await res.json();
        setNameAr(data.nameAr || data.name || '');
        setNameEn(data.nameEn || '');
        setCode(data.code || '');
        setAddress(data.address || '');
        setGoogleMapsUrl(data.googleMapsUrl || '');
        setLatitude(data.latitude || '');
        setLongitude(data.longitude || '');
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

  // إرسال التحديث
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      name: nameAr.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      code: code.trim(),
      address: address.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      radiusMeters: Number(radiusMeters) || 100,
      geofenceRadius: Number(radiusMeters) || 100,
      isActive: Boolean(isActive),
    };

    try {
      const res = await fetch(`/api/admin/branches/${branchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تحديث بيانات الفرع');
      }

      setSuccessMessage(isRtl ? 'تم حفظ وتحديث بيانات الفرع بنجاح' : 'Branch updated successfully');

      // توجيه تلقائي بعد نجاح الحفظ بثانية واحدة
      setTimeout(() => {
        router.push(`/${locale}/admin/branches`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل تحديث بيانات الفرع، يرجى المحاولة مرة أخرى');
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
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
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

      {/* بطاقة النموذج - متطابقة التباين في الوضعين */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* اسم الفرع بالعربي */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'اسم الفرع' : 'Branch Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500"
                placeholder={isRtl ? 'كفتجي دسوق' : 'Branch Name'}
              />
            </div>

            {/* كود الفرع */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'كود الفرع (Branch Code)' : 'Branch Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500"
                placeholder="Koftagy D"
              />
            </div>

            {/* خانة رابط خرائط جوجل الذكية */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'رابط Google Maps أو الإحداثيات' : 'Google Maps URL / Coordinates'}
              </label>
              <input
                type="text"
                value={googleMapsUrl}
                onChange={(e) => handleMapsUrlInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500"
                placeholder="https://www.google.com/maps/@31.1218,30.6480,17z أو الصق خط العرض والطول"
              />
              {mapsExtractedMessage && (
                <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {mapsExtractedMessage}
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {isRtl
                  ? 'الصق رابط الفرع من خرائط جوجل لاستخراج خط الطول والعرض تلقائياً.'
                  : 'Paste the Google Maps link to automatically extract coordinates.'}
              </p>
            </div>

            {/* خط العرض (Latitude) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'خط العرض (Latitude)' : 'Latitude'}
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500"
                placeholder="31.121838"
              />
            </div>

            {/* خط الطول (Longitude) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'خط الطول (Longitude)' : 'Longitude'}
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500"
                placeholder="30.648094"
              />
            </div>

            {/* نصف قطر النطاق الجغرافي للبصمة */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'نصف قطر النطاق الجغرافي للبصمة (بالمتر)' : 'Geofence Radius (meters)'}
              </label>
              <input
                type="number"
                min="5"
                max="5000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500"
                placeholder="100"
              />
            </div>

            {/* تفعيل الفرع */}
            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-white/10 dark:bg-slate-900"
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
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
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
