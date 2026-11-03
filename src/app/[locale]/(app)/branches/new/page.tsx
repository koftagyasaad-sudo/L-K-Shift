'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function NewBranchPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('24.7136');
  const [longitude, setLongitude] = useState('46.6753');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // استخراج الإحداثيات تلقائياً إن وجدت في رابط الخريطة
  const handleMapsUrlChange = (url: string) => {
    setGoogleMapsUrl(url);
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      setLatitude(match[1]);
      setLongitude(match[2]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: nameAr.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      managerName: managerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      radiusMeters: Number(radiusMeters) || 100,
      geofenceRadius: Number(radiusMeters) || 100,
      isActive: Boolean(isActive),
    };

    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل حفظ بيانات الفرع');
      }

      // توجيه سليم ومنضبط بمعمارية i18n
      router.push(`/${locale}/branches`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الفرع';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {isRtl ? 'إضافة فرع جديد' : 'Add New Branch'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRtl ? 'تحديد موقع الفرع ونطاق GPS الجغرافي للتحقق من الحضور' : 'Configure branch location and GPS geofence'}
          </p>
        </div>
        <Link
          href={`/${locale}/branches`}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] transition"
        >
          {isRtl ? 'العودة للفروع' : 'Back to Branches'}
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {errorMessage}
        </div>
      )}

      <div className="rounded-2xl border border-white/5 bg-[#121526]/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'اسم الفرع بالعربي' : 'Branch Name (Arabic)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                placeholder={isRtl ? 'كفتجي دسوق' : 'Branch Name'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'اسم الفرع بالإنجليزي' : 'Branch Name (English)'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                placeholder="Koftagy Desouk"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'اسم المدير / المشرف' : 'Branch Manager'}
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                placeholder={isRtl ? 'هشام' : 'Manager Name'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'رقم هاتف الفرع' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                placeholder="010xxxxxxxx"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'العنوان النصي' : 'Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                placeholder={isRtl ? 'المدينة، الحي، الشارع...' : 'City, Street...'}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'رابط Google Maps' : 'Google Maps URL'}
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => handleMapsUrlChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'خط العرض (Latitude)' : 'Latitude'}
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white focus:border-orange-500 focus:outline-none sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'خط الطول (Longitude)' : 'Longitude'}
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white focus:border-orange-500 focus:outline-none sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isRtl ? 'نصف قطر GPS (متر)' : 'Geofence Radius (meters)'}
              </label>
              <input
                type="number"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white focus:border-orange-500 focus:outline-none sm:text-sm"
                min="10"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-900 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-xs font-medium text-slate-200">
                  {isRtl ? 'تفعيل الفرع (السماح بتسجيل الحضور فيه)' : 'Branch Active'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Link
              href={`/${locale}/branches`}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الفرع' : 'Save Branch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
