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
      <div className="p-12 text-center text-slate-600 dark:text-zinc-400">
        <p className="text-sm font-medium">
          {isRtl ? 'لا توجد فروع مسجلة حتى الآن.' : 'No branches found.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200/90 text-right text-sm text-slate-600 dark:divide-white/[0.08] dark:text-zinc-400" dir={isRtl ? 'rtl' : 'ltr'}>
          <thead className="bg-slate-50 text-slate-600 dark:bg-[#1c1e24] dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الفرع' : 'Branch Name'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'العنوان' : 'Address'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'نصف القطر (GPS)' : 'Geofence'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
              <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {branchPage.pageItems.map((branch) => {
              const branchName = branch.nameAr || branch.name_ar || branch.name || 'فرع بدون اسم';
              const branchEn = branch.nameEn || branch.name_en || '';
              return (
                <tr key={branch.id} className="transition hover:bg-slate-50 dark:hover:bg-[#1c1e24]">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-zinc-100">
                    <div>{branchName}</div>
                    {branchEn && (
                      <div className="text-xs font-normal text-slate-500 dark:text-zinc-400">{branchEn}</div>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-slate-600 dark:text-zinc-400">
                    {branch.address || '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs tabular-nums text-slate-600 dark:text-zinc-400">
                    {branch.radiusMeters || branch.geofenceRadius || branch.geofence_radius || 100} م
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        branch.isActive ?? branch.is_active ?? true
                          ? 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-zinc-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-zinc-500'
                      }`}
                    >
                      <span className={`me-1.5 h-1.5 w-1.5 rounded-full ${
                        branch.isActive ?? branch.is_active ?? true ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                      {branch.isActive ?? branch.is_active ?? true ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/${locale}/admin/branches/${branch.id}`}
                      prefetch
                      className="text-xs font-medium text-slate-600 hover:text-orange-600 hover:underline dark:text-zinc-300 dark:hover:text-orange-500"
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
