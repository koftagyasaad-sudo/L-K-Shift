import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: PageProps) {
  // فك الـ Asynchronous Params لتوافق Next.js 15+
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  // فحص الجلسة مع عزل أي استثناء لتفادي كسر الخادم في حال وجود خلل في مفاتيح البيئة
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error('Session resolution error in HomePage:', error);
  }

  // إذا كان المستخدم مسجل الدخول، يتم توجيهه تلقائياً إلى بوابته المناسبة
  if (session?.user) {
    const role = (session.user as { role?: string })?.role;
    if (role === 'admin') {
      redirect(`/${locale}/admin/branches`);
    } else {
      redirect(`/${locale}/employee`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            {isRtl ? 'منظومة إدارة الشفتات والحضور' : 'Shift & Attendance System'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isRtl ? 'بوابة البصمة الذكية وإدارة العمليات' : 'Smart Geofence Attendance & Operations'}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link
            href={`/${locale}/login`}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {isRtl ? 'تسجيل الدخول' : 'Sign In'}
          </Link>

          <Link
            href={`/${locale}/branches`}
            className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
          >
            {isRtl ? 'استعراض الفروع' : 'View Branches'}
          </Link>
        </div>
      </div>
    </div>
  );
}
