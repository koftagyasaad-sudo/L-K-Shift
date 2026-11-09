import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function EmployeeSalaryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  // 1. التحقق من جلسة الموظف المسجلة
  const session = await auth().catch(() => null);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    redirect(`/${locale}/login`);
  }
  const userId = Number(sessionUserId);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    redirect(`/${locale}/login`);
  }

  // 2. استعلام يقتصر حصراً على الأعمدة الحقيقية في جدول users لمنع سقوط SQL Engine
  const userResults = await db
    .select({
      id: users.id,
      name: users.fullNameAr,
      phone: users.phone,
      role: users.jobRole,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .catch((err) => {
      console.error('Database query error in EmployeeSalaryPage:', err);
      return [];
    });

  const rawUser = userResults[0];

  if (!rawUser) {
    notFound();
  }

  // 3. بناء كائن DTO يوفر الحقول المطلوبة لواجهة المستخدم دون كسر استعلام قاعدة البيانات
  const currentUser = {
    ...rawUser,
    fullNameAr: rawUser.name,
    fullNameEn: rawUser.name,
    jobTitle: rawUser.role === 'admin' ? (isRtl ? 'مدير نظام' : 'Administrator') : (isRtl ? 'موظف' : 'Staff'),
    hourlyRate: 0,
    monthlySalary: 0,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isRtl ? 'بيان الراتب والمستحقات' : 'Salary & Payroll'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRtl ? 'تفاصيل الراتب الأساسي والبدلات الشهرية' : 'Base salary and monthly payout allowances'}
          </p>
        </div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
        >
          {isRtl ? 'الرئيسية' : 'Home'}
        </Link>
      </div>

      {/* بطاقة ملخص الموظف والراتب */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{currentUser.fullNameAr || currentUser.name || 'موظف'}</h2>
              <p className="text-xs text-slate-500">{currentUser.jobTitle} • {currentUser.phone || ''}</p>
            </div>
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {currentUser.role || 'Employee'}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-medium text-slate-500">
                {isRtl ? 'الراتب الأساسي' : 'Base Salary'}
              </span>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {currentUser.monthlySalary > 0 ? `${currentUser.monthlySalary} ج.م` : '—'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-medium text-slate-500">
                {isRtl ? 'سعر ساعة العمل' : 'Hourly Rate'}
              </span>
              <p className="mt-2 text-xl font-bold text-emerald-600">
                {currentUser.hourlyRate > 0 ? `${currentUser.hourlyRate} ج.م` : '—'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <span className="text-xs font-medium text-slate-500">
                {isRtl ? 'إجمالي الخصومات' : 'Deductions'}
              </span>
              <p className="mt-2 text-xl font-bold text-rose-600">—</p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">
              {isRtl ? 'لا توجد مسيرات رواتب معتمدة للفترة الحالية' : 'No payroll records available for the current period'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
