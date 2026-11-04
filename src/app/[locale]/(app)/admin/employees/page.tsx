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

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة مع زر الإضافة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'إدارة الموظفين' : 'Employees Management'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'قائمة حسابات الموظفين، الفروع المسندة، والتحكم بالصلاحيات'
              : 'Staff directory, branch allocations, and access permissions'}
          </p>
        </div>

        <Link
          href={`/${locale}/admin/employees/new`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none"
        >
          {isRtl ? '+ إضافة موظف جديد' : '+ Add New Employee'}
        </Link>
      </div>

      {/* جدول الموظفين مع زري التعديل والحذف */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : employeesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base font-medium">
              {isRtl ? 'لا يوجد موظفون مسجلون حالياً' : 'No employees registered yet'}
            </p>
            <Link
              href={`/${locale}/admin/employees/new`}
              className="mt-4 inline-block text-sm font-bold text-orange-600 hover:underline dark:text-orange-400"
            >
              {isRtl ? 'ابدأ بإضافة أول موظف الآن' : 'Create first employee'} &larr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الموظف' : 'Employee Name'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الدور الوظيفي' : 'Role'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الفرع' : 'Branch'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {employeesList.map((emp) => (
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
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          emp.isActive ?? true
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {emp.isActive ?? true ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/${locale}/admin/employees/${emp.id}/edit`}
                          className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
                        >
                          {isRtl ? 'تعديل' : 'Edit'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          disabled={deletingId === emp.id}
                          className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
                        >
                          {deletingId === emp.id ? (isRtl ? 'جاري الحذف...' : 'Deleting...') : (isRtl ? 'حذف' : 'Delete')}
                        </button>
                      </div>
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
