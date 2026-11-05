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
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mapsExtractedMessage, setMapsExtractedMessage] = useState<string | null>(null);

  // ميزة المعايرة الميدانية الفورية: التقاط موقعك الفعلي كإحداثيات للفرع
  const captureCurrentGpsLocation = () => {
    if (!navigator.geolocation) {
      alert(isRtl ? 'المتصفح لا يدعم تحديد الموقع GPS' : 'GPS not supported');
      return;
    }

    setIsCapturingGps(true);
    setMapsExtractedMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCapturingGps(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setMapsExtractedMessage(
          isRtl
            ? `✓ تم التقاط إحداثيات موقعك الفعلي بنجاح: (${lat}, ${lng}) بدقة ±${Math.round(pos.coords.accuracy)}م`
            : `✓ Captured Current GPS: (${lat}, ${lng})`
        );
      },
      (err) => {
        setIsCapturingGps(false);
        alert(isRtl ? 'تعذر التقاط الموقع، تأكد من تفعيل الـ GPS والسماح للمتصفح' : 'Failed to capture GPS');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // استخراج الإحداثيات الذكي من الرابط
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
          ? `✓ تم استخراج الإحداثيات من الرابط: (${atMatch[1]}, ${atMatch[2]})`
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
          ? `✓ تم استخراج الإحداثيات من الرابط: (${qMatch[1]}, ${qMatch[2]})`
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
          ? `✓ تم تعيين الإحداثيات بنجاح: (${rawCoordsMatch[1]}, ${rawCoordsMatch[2]})`
          : `✓ Adjusted Coordinates: (${rawCoordsMatch[1]}, ${rawCoordsMatch[2]})`
      );
    }
  };

  useEffect(() => {
    if (!branchId) return;

    const fetchBranchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const res = await fetch(`/api/branches?id=${branchId}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('فشل جلب بيانات الفرع');

        const data = await res.json();
        setNameAr(data.nameAr || data.name || '');
        setNameEn(data.nameEn || '');
        setPhone(data.phone || '');
        setManagerName(data.managerName || '');
        setGoogleMapsUrl(data.googleMapsUrl || '');
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
      phone: phone.trim(),
      managerName: managerName.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
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

      setSuccessMessage(isRtl ? 'تم تحديث بيانات الفرع والإحداثيات بنجاح' : 'Branch updated successfully');

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'تعديل بيانات وإحداثيات الفرع' : 'Edit Branch Coordinates'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'معايرة النطاق الجغرافي ونصف قطر البصمة بدقة الأمتار'
              : 'Calibrate GPS geofence and radius in meters'}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/branches`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isRtl ? 'العودة لقائمة الفروع' : 'Back to Branches'}
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-sm font-medium text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/10 dark:bg-[#121526] dark:shadow-xl sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'اسم الفرع بالعربي' : 'Branch Name (Arabic)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'اسم الفرع بالإنجليزي' : 'English Name'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'هاتف الفرع' : 'Phone'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="05XXXXXXXX"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'اسم المدير / المشرف' : 'Manager'}
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* ميزة المعايرة الميدانية وحقل الخرائط */}
            <div className="sm:col-span-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isRtl ? '📍 المعايرة الميدانية المباشرة (حل مشكلة المسافة للأبد)' : 'Ground-Truth Calibration'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isRtl
                      ? 'إذا كنت متواجداً داخل الفرع حالياً، اضغط هنا لالتقاط إحداثيات هاتفك الحقيقية وتثبيتها للفرع بنسبة 100%:'
                      : 'Capture your current GPS directly while standing in the branch:'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={captureCurrentGpsLocation}
                  disabled={isCapturingGps}
                  className="shrink-0 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isCapturingGps
                    ? (isRtl ? 'جاري الالتقاط بالـ GPS...' : 'Capturing...')
                    : (isRtl ? '🎯 تثبيت موقعي الحالي كإحداثيات للفرع' : 'Set Current Location as Branch GPS')}
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'أو الصق رابط الفرع من Google Maps' : 'Or Paste Google Maps URL'}
                </label>
                <input
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => handleMapsUrlInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {mapsExtractedMessage && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {mapsExtractedMessage}
                </p>
              )}
            </div>

            {/* خط العرض وخط الطول */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'خط العرض (Latitude)' : 'Latitude'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="31.121838"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'خط الطول (Longitude)' : 'Longitude'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="30.648094"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'نصف قطر نطاق البصمة (بالمتر)' : 'Geofence Radius (meters)'}
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="100"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {isRtl ? 'يُفضل ضبطه بين 50 إلى 150 متراً لمراعاة المباني المغلقة وضعف الإشارة داخل المكاتب.' : 'Recommended between 50 to 150 meters for indoor accuracy.'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'العنوان النصي' : 'Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isRtl ? 'تفعيل الفرع ضمن خطة الحضور والبصمة' : 'Activate Branch'}
                </span>
              </label>
            </div>
          </div>

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
              className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
