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

export default async function EmployeeProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  // 1. التحقق من جلسة المستخدم الحالية
  const session = await auth().catch(() => null);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    redirect(`/${locale}/login`);
  }

  // 2. استعلام الحقول الفعلية والمؤكدة فقط في جدول users
  const userResults = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      role: users.role,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1)
    .catch((err) => {
      console.error('Database query error in EmployeeProfilePage:', err);
      return [];
    });

  const rawUser = userResults[0];

  if (!rawUser) {
    notFound();
  }

  // 3. بناء كائن البيانات الموحد (DTO) لدعم واجهة المستخدم بأمان تام
  const currentUser = {
    ...rawUser,
    fullNameAr: rawUser.name,
    fullNameEn: rawUser.name,
    email: (session?.user as { email?: string | null })?.email || null,
  };

  const isRtl = locale === 'ar';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة والملاحة */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isRtl ? 'الملف الشخصي للموظف' : 'Employee Profile'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRtl ? 'بيانات الحساب ومعلومات الاتصال الرسمية' : 'Account details and official contact information'}
          </p>
        </div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
        >
          {isRtl ? 'الرئيسية' : 'Home'}
        </Link>
      </div>

      {/* بطاقة عرض البيانات */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {currentUser.fullNameAr || currentUser.name || (isRtl ? 'غير محدد' : 'N/A')}
              </h2>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {currentUser.role || (isRtl ? 'موظف' : 'Employee')}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">
                {isRtl ? 'الاسم الكامل' : 'Full Name'}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {currentUser.name || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {currentUser.email || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">
                {isRtl ? 'رقم الهاتف' : 'Phone Number'}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {currentUser.phone || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">
                {isRtl ? 'الدور الوظيفي' : 'System Role'}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {currentUser.role || '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
