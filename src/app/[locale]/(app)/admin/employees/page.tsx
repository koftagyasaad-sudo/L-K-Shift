import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminEmployeesPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  let employeesList: any[] = [];

  // جلب مباشر ومحصن للموظفين من جدول users مع اسم الفرع التابع له
  try {
    const raw = await db.execute(sql`
      SELECT 
        u.id,
        u.full_name_ar as name,
        u.phone,
        u.job_role as role,
        u.is_active as "isActive",
        b.name_ar as "branchName"
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id = b.id
      ORDER BY u.id ASC;
    `);

    employeesList = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
  } catch (error) {
    console.error('Failed to load employees from DB:', error);
  }

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
              ? 'قائمة حسابات الموظفين والصلاحيات المسندة'
              : 'Staff accounts and assigned branch authorizations'}
          </p>
        </div>

        <Link
          href={`/${locale}/admin/employees/new`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none"
        >
          {isRtl ? '+ إضافة موظف جديد' : '+ Add New Employee'}
        </Link>
      </div>

      {/* جدول عرض الموظفين */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md">
        {employeesList.length === 0 ? (
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
                {employeesList.map((emp: any) => (
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
                      <Link
                        href={`/${locale}/admin/employees/${emp.id}/edit`}
                        className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
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
