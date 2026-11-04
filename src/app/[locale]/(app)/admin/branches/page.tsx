'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface BranchItem {
  id: number | string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  address?: string;
  radiusMeters?: number;
  isActive?: boolean;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminBranchesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [branchesList, setBranchesList] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/branches', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBranchesList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleDeleteBranch = async (id: number | string, name?: string) => {
    const confirmMessage = isRtl
      ? `هل أنت متأكد من حذف الفرع "${name || 'المحدد'}" نهائياً؟`
      : `Are you sure you want to delete branch "${name || 'selected'}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/branches?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('فشل حذف الفرع');
      }

      setBranchesList((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (err) {
      alert(isRtl ? 'حدث خطأ أثناء محاولة حذف الفرع' : 'Failed to delete branch');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'إدارة الفروع ونطاق الـ Geofence' : 'Branch Management'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'متابعة الفروع المسجلة، إحداثيات GPS، ونصف قطر بصمة الحضور'
              : 'Registered locations, GPS coordinates, and geofence radiuses'}
          </p>
        </div>

        <Link
          href={`/${locale}/admin/branches/new`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none"
        >
          {isRtl ? '+ إضافة فرع جديد' : '+ Add New Branch'}
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : branchesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base font-medium">
              {isRtl ? 'لا توجد فروع مسجلة حالياً.' : 'No branches found.'}
            </p>
            <Link
              href={`/${locale}/admin/branches/new`}
              className="mt-4 inline-block text-sm font-bold text-orange-600 hover:underline dark:text-orange-400"
            >
              {isRtl ? 'ابدأ بإضافة أول فرع الآن' : 'Create your first branch'} &larr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الفرع' : 'Branch'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'العنوان' : 'Address'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'نصف القطر (GPS)' : 'Geofence'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {branchesList.map((branch) => {
                  const bName = branch.nameAr || branch.name || 'فرع بدون اسم';
                  return (
                    <tr key={branch.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <div>{bName}</div>
                        {branch.nameEn && (
                          <div className="text-xs font-normal text-slate-400">{branch.nameEn}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {branch.address || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {branch.radiusMeters || 100} م
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            branch.isActive ?? true
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                          }`}
                        >
                          {branch.isActive ?? true ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/${locale}/admin/branches/${branch.id}`}
                            className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
                          >
                            {isRtl ? 'تعديل' : 'Edit'}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(branch.id, bName)}
                            disabled={deletingId === branch.id}
                            className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
                          >
                            {deletingId === branch.id ? (isRtl ? 'جاري الحذف...' : 'Deleting...') : (isRtl ? 'حذف' : 'Delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
