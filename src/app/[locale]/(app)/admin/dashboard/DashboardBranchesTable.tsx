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
      <div className="p-12 text-center text-[#433b5c] dark:text-[#c9c0e8]">
        <p className="text-sm font-medium">
          {isRtl ? 'لا توجد فروع مسجلة حتى الآن.' : 'No branches found.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-violet-950/10 text-right text-sm text-[#433b5c] dark:divide-[#c4b2ff]/15 dark:text-[#c9c0e8]" dir={isRtl ? 'rtl' : 'ltr'}>
          <thead className="bg-violet-50 text-[#433b5c] dark:bg-[#110e1f] dark:text-[#c9c0e8]">
            <tr>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الفرع' : 'Branch Name'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'العنوان' : 'Address'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'نصف القطر (GPS)' : 'Geofence'}</th>
              <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
              <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-violet-950/10 dark:divide-[#c4b2ff]/15">
            {branchPage.pageItems.map((branch) => {
              const branchName = branch.nameAr || branch.name_ar || branch.name || 'فرع بدون اسم';
              const branchEn = branch.nameEn || branch.name_en || '';
              return (
                <tr key={branch.id} className="transition hover:bg-violet-50/80 dark:hover:bg-[#110e1f]">
                  <td className="px-6 py-4 font-bold text-[#0a0814] dark:text-[#f6f0ff]">
                    <div>{branchName}</div>
                    {branchEn && (
                      <div className="text-xs font-normal text-[#756c91] dark:text-[#c9c0e8]">{branchEn}</div>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-[#433b5c] dark:text-[#c9c0e8]">
                    {branch.address || '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs tabular-nums text-[#433b5c] dark:text-[#c9c0e8]">
                    {branch.radiusMeters || branch.geofenceRadius || branch.geofence_radius || 100} م
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        branch.isActive ?? branch.is_active ?? true
                          ? 'bg-lime-400/15 text-[#557700] dark:bg-lime-400/10 dark:text-[#cdff4d]'
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
                      className="text-xs font-bold text-[#6e42bd] hover:text-[#9d6bff] hover:underline dark:text-[#46f4ff] dark:hover:text-[#f6f0ff]"
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
