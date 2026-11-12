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
    <div className="mx-auto w-full max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترحيب بالموظف */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 dark:border-white/[0.08] dark:bg-[#141519]">
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{isRtl ? 'بوابة الموظف' : 'Employee portal'}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-3xl">
          {isRtl ? `مرحباً بك، ${currentUser?.name || 'زميلنا'}` : `Welcome back, ${currentUser?.name || 'Colleague'}`}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          {isRtl ? 'لوحة الخدمات الذاتية: تسجيل الحضور، الاطلاع على الوردية ومراجعة الراتب' : 'Self-service portal: Attendance check-in, shifts, and salary overview'}
        </p>
      </div>

      {/* الروابط السريعة المباشرة للموظف */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* تسجيل الحضور والانصراف */}
        <Link
          href={`/${locale}/attendance`}
          className="group rounded-xl border border-slate-200/90 bg-white p-5 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#141519] dark:hover:bg-[#1c1e24]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition dark:bg-[#1c1e24] dark:text-zinc-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 transition dark:text-zinc-100">
            {isRtl ? 'تسجيل الحضور والانصراف' : 'Check In / Out'}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
            {isRtl ? 'إثبات البصمة الذكية داخل النطاق الجغرافي للفرع' : 'Geofence-based smart check-in'}
          </p>
        </Link>

        {/* بيان الراتب */}
        <Link
          href={`/${locale}/employee/salary`}
          className="group rounded-xl border border-slate-200/90 bg-white p-5 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#141519] dark:hover:bg-[#1c1e24]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition dark:bg-[#1c1e24] dark:text-zinc-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 transition dark:text-zinc-100">
            {isRtl ? 'بيان الراتب والبدلات' : 'Salary & Payroll'}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
            {isRtl ? 'تفاصيل الساعات المعتمدة وسجل الاستحقاقات' : 'Approved hours and payout history'}
          </p>
        </Link>

        {/* الملف الشخصي */}
        <Link
          href={`/${locale}/profile`}
          className="group rounded-xl border border-slate-200/90 bg-white p-5 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#141519] dark:hover:bg-[#1c1e24]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition dark:bg-[#1c1e24] dark:text-zinc-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 transition dark:text-zinc-100">
            {isRtl ? 'الملف الشخصي' : 'Profile'}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
            {isRtl ? 'بيانات الحساب ورقم الهاتف المسجل' : 'Account information and phone number'}
          </p>
        </Link>
      </div>
    </div>
  );
}
