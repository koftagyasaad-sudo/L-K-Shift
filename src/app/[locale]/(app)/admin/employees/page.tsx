import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';

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

  const employeeList = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.updatedAt))
    .catch((err) => {
      console.error('Failed to load employees list:', err);
      return [];
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isRtl ? 'إدارة الموظفين' : 'Employees Management'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRtl ? 'قائمة حسابات الموظفين والصلاحيات المسندة' : 'Staff directory and access permissions'}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/employees/new`}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none"
        >
          {isRtl ? 'إضافة موظف جديد' : 'Add Employee'}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-right text-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">
                  {isRtl ? 'اسم الموظف' : 'Name'}
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  {isRtl ? 'رقم الهاتف' : 'Phone'}
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  {isRtl ? 'الدور الوظيفي' : 'Role'}
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  {isRtl ? 'الحالة' : 'Status'}
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">
                  {isRtl ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {employeeList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {isRtl ? 'لا يوجد موظفون مسجلون حالياً' : 'No employees registered yet'}
                  </td>
                </tr>
              ) : (
                employeeList.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {emp.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {emp.phone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          emp.isActive ?? true
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {emp.isActive ?? true
                          ? isRtl
                            ? 'نشط'
                            : 'Active'
                          : isRtl
                          ? 'معطل'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/${locale}/admin/employees/${emp.id}`}
                        className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        {isRtl ? 'تعديل' : 'Edit'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
