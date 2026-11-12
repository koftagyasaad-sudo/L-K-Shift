'use client';

import React, { useState, useEffect, use } from 'react';
import { PaginationControls, usePaginatedItems } from '@/components/ui/PaginationControls';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface EmployeeBrief {
  id: string;
  name?: string;
  fullName?: string;
  role?: string;
  phone?: string;
  branchId?: string | number | null;
}

interface BranchSummary {
  nameAr?: string;
  name?: string;
  address?: string;
  phone?: string;
  managerName?: string;
  radiusMeters?: number;
}

export default function MyBranchStaffPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [branchInfo, setBranchInfo] = useState<BranchSummary | null>(null);
  const [colleagues, setColleagues] = useState<EmployeeBrief[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const colleaguesPage = usePaginatedItems(colleagues, `${branchInfo?.nameAr || ''}|${locale}`);

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'عمر عبدالحليم';

    const loadBranchAndStaff = async () => {
      try {
        setIsLoading(true);
        // 1. معرفة فرع الموظف الحالي
        const empRes = await fetch('/api/employees', { cache: 'no-store' });
        if (!empRes.ok) throw new Error('فشل قراءة البيانات');
        const responseData = await empRes.json();
        const empList: EmployeeBrief[] = Array.isArray(responseData) ? responseData : [];
        const me = Array.isArray(empList)
          ? empList.find((u) => u.name === storedName || u.fullName === storedName) || empList[0]
          : null;

        if (me && me.branchId) {
          // 2. جلب بيانات الفرع للقراءة فقط
          const branchRes = await fetch(`/api/branches?id=${me.branchId}`, { cache: 'no-store' });
          if (branchRes.ok) {
            const bData = await branchRes.json();
            setBranchInfo(bData);
          }

          // 3. تصفية زملاء العمل في نفس الفرع فقط للقراءة
          const branchStaff = empList.filter((u) => String(u.branchId) === String(me.branchId));
          setColleagues(branchStaff);
        }
      } catch (err) {
        console.error('Failed to load my branch:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBranchAndStaff();
  }, []);

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* بطاقة الفرع (قراءة فقط بدون أزرار تعديل) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <span className="inline-flex rounded-lg bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
          {isRtl ? 'الفرع المسند إليك (للاطلاع فقط)' : 'Your Branch (Read-Only)'}
        </span>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          {branchInfo ? branchInfo.nameAr || branchInfo.name : isRtl ? 'جاري تحميل الفرع...' : 'Loading...'}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {branchInfo ? branchInfo.address || '—' : ''}
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-white/5 font-mono text-xs text-slate-600 dark:text-slate-300">
          <div>{isRtl ? 'هاتف الفرع:' : 'Phone:'} <strong>{branchInfo?.phone || '—'}</strong></div>
          <div>{isRtl ? 'المشرف المسؤول:' : 'Manager:'} <strong>{branchInfo?.managerName || '—'}</strong></div>
          <div>{isRtl ? 'نصف قطر البصمة:' : 'Geofence Radius:'} <strong className="text-orange-600">{branchInfo?.radiusMeters || 100} متر</strong></div>
        </div>
      </div>

      {/* جدول زملاء العمل في نفس الفرع (قراءة فقط بدون إجراءات تعديل أو حذف) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isRtl ? 'فريق العمل في نفس الفرع' : 'Branch Colleagues'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl ? 'قائمة الزملاء المسندين لنفس الفرع للتعاون والتنسيق' : 'Colleagues assigned to this branch'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : colleagues.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            {isRtl ? 'لا يوجد موظفون آخرون مسجلون في هذا الفرع' : 'No other staff in this branch'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الموظف' : 'Name'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الدور الوظيفي' : 'Role'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {colleaguesPage.pageItems.map((colleague) => (
                  <tr key={colleague.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {colleague.name || colleague.fullName}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                        {colleague.role || 'موظف'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300" dir="ltr">
                      {colleague.phone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {isRtl ? 'نشط' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              page={colleaguesPage.page}
              pageCount={colleaguesPage.pageCount}
              itemCount={colleagues.length}
              onPageChange={colleaguesPage.setPage}
              isRtl={isRtl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
