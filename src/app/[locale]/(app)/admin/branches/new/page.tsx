'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBranchAction } from '@/actions/branchActions';
import { 
  Building2, 
  MapPin, 
  Save, 
  ArrowRight, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

export default function NewBranchPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [nameAr, setNameAr] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [mapsUrl, setMapsUrl] = useState<string>('');

  const handleExtractFromUrl = (url: string) => {
    setMapsUrl(url);
    if (!url) return;

    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      setLatitude(atMatch[1]);
      setLongitude(atMatch[2]);
      return;
    }

    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      setLatitude(qMatch[1]);
      setLongitude(qMatch[2]);
      return;
    }

    const searchMatch = url.match(/search\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (searchMatch) {
      setLatitude(searchMatch[1]);
      setLongitude(searchMatch[2]);
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      setError('يرجى إدخال اسم الفرع');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        name: nameAr.trim(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || null,
        address: address.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        radiusMeters: Number(radiusMeters) || 100,
        geofenceRadius: Number(radiusMeters) || 100,
        isActive,
      };

      const res = await createBranchAction(payload);
      if (res && (res.success || !res.error)) {
        setSuccessMsg('تم إضافة الفرع بنجاح');
        setTimeout(() => {
          router.push('/admin/branches');
        }, 1500);
      } else {
        setError(res?.error || 'فشل إضافة الفرع');
      }
    } catch (err) {
      console.error('Error creating branch:', err);
      setError('حدث خطأ غير متوقع أثناء إضافة الفرع');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">إضافة فرع جديد</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحديد اسم الفرع والموقع الجغرافي ونطاق الحضور
              </p>
            </div>
          </div>
          <Link
            href="/admin/branches"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للفروع
          </Link>
        </div>

        {/* Banners */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اسم الفرع (بالعربية) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: فرع القاهرة - الرئيسي"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اسم الفرع (بالإنجليزية)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Cairo Main Branch"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              العنوان التفصيلي
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: الشارع الرئيسي، البرج الإداري، الدور الثالث"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Extract from Google Maps URL */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              استخراج الإحداثيات تلقائياً من رابط خرائط جوجل (Google Maps)
            </label>
            <input
              type="text"
              value={mapsUrl}
              onChange={(e) => handleExtractFromUrl(e.target.value)}
              placeholder="الصق رابط الموقع من خرائط جوجل هنا لتعبئة الإحداثيات تلقائياً..."
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>

          {/* Location Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> خط العرض (Latitude)
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="30.0444"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> خط الطول (Longitude)
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="31.2357"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Radius & Active Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نطاق الحضور المسموح به (بالأمتار - Geofence Radius)
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                الفرع نشط ومتاح لتسجيل الحضور
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              href="/admin/branches"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'جاري الحفظ...' : 'إنشاء الفرع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
