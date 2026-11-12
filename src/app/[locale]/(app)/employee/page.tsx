import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
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

export default async function EmployeeDashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  // التحقق من هوية الموظف الحالي
  const session = await auth().catch(() => null);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    redirect(`/${locale}/login`);
  }

  // استعلام محدد بالأعمدة الصحيحة لجدول users ومطابقة رقم المعرف
  const userResults = await db
    .select({
      id: users.id,
      name: users.fullNameAr,
      phone: users.phone,
      role: users.jobRole,
    })
    .from(users)
    .where(eq(users.id, String(sessionUserId)))
    .limit(1)
    .catch((err) => {
      console.error('Database query error in EmployeeDashboardPage:', err);
      return [];
    });

  const currentUser = userResults[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترحيب بالموظف */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {isRtl ? `مرحباً بك، ${currentUser?.name || 'زميلنا'}` : `Welcome back, ${currentUser?.name || 'Colleague'}`}
        </h1>
        <p className="mt-2 text-sm text-emerald-100">
          {isRtl ? 'لوحة الخدمات الذاتية: تسجيل الحضور، الاطلاع على الوردية ومراجعة الراتب' : 'Self-service portal: Attendance check-in, shifts, and salary overview'}
        </p>
      </div>

      {/* الروابط السريعة المباشرة للموظف */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* تسجيل الحضور والانصراف */}
        <Link
          href={`/${locale}/attendance`}
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 group-hover:text-emerald-600 transition">
            {isRtl ? 'تسجيل الحضور والانصراف' : 'Check In / Out'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isRtl ? 'إثبات البصمة الذكية داخل النطاق الجغرافي للفرع' : 'Geofence-based smart check-in'}
          </p>
        </Link>

        {/* بيان الراتب */}
        <Link
          href={`/${locale}/employee/salary`}
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-600 transition">
            {isRtl ? 'بيان الراتب والبدلات' : 'Salary & Payroll'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isRtl ? 'تفاصيل الساعات المعتمدة وسجل الاستحقاقات' : 'Approved hours and payout history'}
          </p>
        </Link>

        {/* الملف الشخصي */}
        <Link
          href={`/${locale}/profile`}
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 group-hover:text-purple-600 transition">
            {isRtl ? 'الملف الشخصي' : 'Profile'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isRtl ? 'بيانات الحساب ورقم الهاتف المسجل' : 'Account information and phone number'}
          </p>
        </Link>
      </div>
    </div>
  );
}
