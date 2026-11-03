'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface BranchItem {
  id: string | number;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  managerName?: string;
  phone?: string;
  address?: string;
  googleMapsUrl?: string;
  latitude?: string;
  longitude?: string;
  radiusMeters?: number;
  isActive?: boolean;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function BranchesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [branchesList, setBranchesList] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // جلب الفروع من مسار الـ API المعتمد
  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await fetch('/api/admin/branches', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('فشل جلب قائمة الفروع');
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.branches || data?.data || [];
      setBranchesList(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الفروع';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة مع زر الإضافة المباشر */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 bg-[#121526]/80 p-6 shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {isRtl ? 'إدارة الفروع ونطاق الـ Geofence' : 'Branch Management'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRtl
              ? 'متابعة الفروع المسجلة، إحداثيات GPS، ونصف قطر بصمة الحضور'
              : 'Registered locations, coordinates, and geofence radius'}
          </p>
        </div>

        <Link
          href={`/${locale}/branches/new`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none"
        >
          {isRtl ? '+ إضافة فرع جديد' : '+ Add New Branch'}
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {errorMessage}
        </div>
      )}

      {/* جدول الفروع */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#121526]/80 shadow-xl backdrop-blur-md">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : branchesList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-base font-medium">
              {isRtl ? 'لا توجد فروع مسجلة حالياً.' : 'No branches found.'}
            </p>
            <Link
              href={`/${locale}/branches/new`}
              className="mt-4 inline-block text-sm font-bold text-orange-400 hover:text-orange-300"
            >
              {isRtl ? 'ابدأ بإضافة أول فرع الآن' : 'Create your first branch'} &larr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-right text-sm" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الفرع' : 'Branch'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'المشرف / الهاتف' : 'Manager / Phone'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'العنوان' : 'Address'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'نصف القطر (GPS)' : 'Geofence'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {branchesList.map((branch) => (
                  <tr key={branch.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-bold text-white">
                      <div>{branch.nameAr || branch.name || 'فرع بدون اسم'}</div>
                      {branch.nameEn && (
                        <div className="text-xs font-normal text-slate-400">{branch.nameEn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div>{branch.managerName || '—'}</div>
                      <div className="text-xs text-slate-500">{branch.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                      {branch.address || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                      {branch.radiusMeters || 100} م
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          branch.isActive ?? true
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {branch.isActive ?? true
                          ? isRtl ? 'نشط' : 'Active'
                          : isRtl ? 'معطل' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/${locale}/branches/${branch.id}`}
                        className="text-xs font-bold text-orange-400 hover:text-orange-300 hover:underline"
                      >
                        {isRtl ? 'تعديل' : 'Edit'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
