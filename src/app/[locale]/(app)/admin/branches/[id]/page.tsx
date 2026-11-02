'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BranchData {
  id: string | number;
  name?: string | null;
  code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radiusMeters?: number | null;
  geofenceRadius?: number | null;
  isActive?: boolean | null;
  address?: string | null;
}

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default function EditBranchPage({ params }: PageProps) {
  const router = useRouter();

  const resolvedParams = use(params);
  const { locale, id: branchId } = resolvedParams;

  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchBranch() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/branches/${branchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('فشل استرداد بيانات الفرع من الخادم');
        }

        const data = await response.json();
        const branch: BranchData = data?.branch || data;

        if (isMounted) {
          if (branch && branch.id) {
            setName(branch.name || '');
            setCode(branch.code || '');
            setLatitude(
              branch.latitude !== null && branch.latitude !== undefined
                ? String(branch.latitude)
                : ''
            );
            setLongitude(
              branch.longitude !== null && branch.longitude !== undefined
                ? String(branch.longitude)
                : ''
            );
            setRadiusMeters(
              Number(branch.radiusMeters || branch.geofenceRadius || 100)
            );
            setIsActive(branch.isActive ?? true);
          } else {
            setError('لم يتم العثور على الفرع المطلوب');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'حدث خطأ غير متوقع أثناء تحميل البيانات';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (branchId) {
      fetchBranch();
    }

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      name: name.trim(),
      code: code.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      radiusMeters: Number(radiusMeters),
      geofenceRadius: Number(radiusMeters),
      isActive: Boolean(isActive),
    };

    try {
      const response = await fetch(`/api/admin/branches/${branchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تحديث بيانات الفرع');
      }

      setSuccessMessage('تم تحديث بيانات الفرع بنجاح');
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التعديلات';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">جاري تحميل بيانات الفرع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            تعديل بيانات الفرع
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            تحديث النطاق الجغرافي والإحداثيات وحالة تشغيل الفرع
          </p>
        </div>
        <Link
          href={`/${locale}/admin/branches`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
        >
          العودة لقائمة الفروع
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-rose-900">تنبيه:</span>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-emerald-900">نجاح:</span>
            <p className="text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="branchName" className="block text-sm font-medium text-slate-700">
              اسم الفرع <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="branchName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none sm:text-sm"
              placeholder="مثال: فرع كفر الشيخ الرئيسي"
            />
          </div>

          <div>
            <label htmlFor="branchCode" className="block text-sm font-medium text-slate-700">
              كود الفرع (Branch Code)
            </label>
            <input
              type="text"
              id="branchCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none sm:text-sm"
              placeholder="مثال: BR-01"
            />
          </div>

          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-slate-700">
              خط العرض (Latitude)
            </label>
            <input
              type="number"
              step="any"
              id="latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none sm:text-sm"
              placeholder="31.1107"
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-slate-700">
              خط الطول (Longitude)
            </label>
            <input
              type="number"
              step="any"
              id="longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none sm:text-sm"
              placeholder="30.9388"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="radiusMeters" className="block text-sm font-medium text-slate-700">
              نصف قطر النطاق الجغرافي للبصمة (بالمتر)
            </label>
            <input
              type="number"
              id="radiusMeters"
              min={10}
              max={5000}
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-900">
                تفعيل الفرع ضمن خطة التشغيل والشفتات النشطة
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <Link
            href={`/${locale}/admin/branches`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </div>
  );
}
