'use client';

import Link from 'next/link';
import { usePaginatedItems, PaginationControls } from '@/components/ui/PaginationControls';

interface DashboardBranch {
  id: string;
  nameAr: string | null;
  nameEn: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
  address: string | null;
  radiusMeters: number;
  geofenceRadius: number;
  geofence_radius?: number;
  isActive: boolean;
  is_active?: boolean;
}

export default function DashboardBranchesTable({
  branches,
  locale,
}: {
  branches: DashboardBranch[];
  locale: string;
}) {
  const isRtl = locale === 'ar';
  const branchPage = usePaginatedItems(branches, locale);

  if (branches.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <p className="text-sm font-medium">
          {isRtl ? 'لا توجد فروع مسجلة حتى الآن.' : 'No branches found.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
          <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الفرع' : 'Branch Name'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'العنوان' : 'Address'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'نصف القطر (GPS)' : 'Geofence'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
              <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {branchPage.pageItems.map((branch) => {
              const branchName = branch.nameAr || branch.name_ar || branch.name || 'فرع بدون اسم';
              const branchEn = branch.nameEn || branch.name_en || '';
              return (
                <tr key={branch.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    <div>{branchName}</div>
                    {branchEn && (
                      <div className="text-xs font-normal text-slate-400">{branchEn}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {branch.address || '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {branch.radiusMeters || branch.geofenceRadius || branch.geofence_radius || 100} م
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        branch.isActive ?? branch.is_active ?? true
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {branch.isActive ?? branch.is_active ?? true ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/${locale}/admin/branches/${branch.id}`}
                      prefetch
                      className="text-xs font-bold text-orange-600 hover:text-orange-500 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {isRtl ? 'تعديل' : 'Edit'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PaginationControls
        page={branchPage.page}
        pageCount={branchPage.pageCount}
        itemCount={branches.length}
        onPageChange={branchPage.setPage}
        isRtl={isRtl}
      />
    </>
  );
}
