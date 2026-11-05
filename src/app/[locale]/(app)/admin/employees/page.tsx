'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface EmployeeItem {
  id: number | string;
  name?: string;
  phone?: string;
  role?: string;
  branchName?: string;
  isActive?: boolean;
  isOnboarded?: boolean;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminEmployeesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [employeesList, setEmployeesList] = useState<EmployeeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/employees', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEmployeesList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDeleteEmployee = async (id: number | string, name?: string) => {
    const confirmMessage = isRtl
      ? `هل أنت متأكد من حذف الموظف "${name || 'المحدد'}" نهائياً؟`
      : `Are you sure you want to delete employee "${name || 'selected'}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('فشل حذف الموظف');
      }

      setEmployeesList((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (err) {
      alert(isRtl ? 'حدث خطأ أثناء محاولة حذف الموظف' : 'Failed to delete employee');
    } finally {
      setDeletingId(null);
    }
  };

  // الموظفون الجدد الذين سجلوا بأنفسهم وبانتظار التعيين
  const pendingOnboardingCount = employeesList.filter((e) => e.branchName === '—' || !e.branchName || e.role === 'موظف جديد').length;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'إدارة الموظفين والكوادر' : 'Employees Management'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'متابعة حسابات الموظفين، الفروع المسندة، وإكمال بيانات الحسابات المسجلة ذاتياً'
              : 'Staff directory & onboarding management'}
          </p>
        </div>

        <Link
          href={`/${locale}/admin/employees/new`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none"
        >
          {isRtl ? '+ إضافة موظف مباشرة' : '+ Add New Employee'}
        </Link>
      </div>

      {/* شريط تنبيه الموظفين الجدد المسجلين ذاتياً */}
      {pendingOnboardingCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <span>
              {isRtl
                ? `يوجد (${pendingOnboardingCount}) موظف مسجلين ذاتياً بانتظار إسناد الفرع وتحديد الصلاحيات.`
                : `There are (${pendingOnboardingCount}) self-registered staff awaiting branch & role assignment.`}
            </span>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : employeesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base font-medium">
              {isRtl ? 'لا يوجد موظفون مسجلون حالياً' : 'No employees registered yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الموظف' : 'Employee Name'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الدور الوظيفي' : 'Role'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الفرع المسند' : 'Branch'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'حالة التعيين' : 'Status'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {employeesList.map((emp) => {
                  const isPending = emp.branchName === '—' || !emp.branchName || emp.role === 'موظف جديد';
                  return (
                    <tr key={emp.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {emp.name || 'موظف'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300" dir="ltr">
                        {emp.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <span className="inline-flex rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                          {emp.role || 'موظف'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {emp.branchName || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            {isRtl ? '⏳ بانتظار إسناد الفرع' : 'Pending'}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            {isRtl ? 'نشط ومعين' : 'Active'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/${locale}/admin/employees/${emp.id}/edit`}
                            className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
                          >
                            {isPending ? (isRtl ? 'إسناد البيانات والفرع' : 'Assign') : (isRtl ? 'تعديل' : 'Edit')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                            disabled={deletingId === emp.id}
                            className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400 cursor-pointer"
                          >
                            {deletingId === emp.id ? (isRtl ? 'جاري الحذف...' : 'Deleting...') : (isRtl ? 'حذف' : 'Delete')}
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
