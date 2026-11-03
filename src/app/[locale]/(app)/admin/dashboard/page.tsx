import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { users, branches } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  let totalUsers = 0;
  let totalBranches = 0;
  let branchesList: any[] = [];

  // 1. استعلام الإحصائيات الإجمالية
  try {
    const userRes = await db.select({ count: sql<number>`count(*)` }).from(users);
    totalUsers = Number(userRes[0]?.count || 0);

    const branchRes = await db.select({ count: sql<number>`count(*)` }).from(branches);
    totalBranches = Number(branchRes[0]?.count || 0);
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
  }

  // 2. استعلام بيانات الفروع المسجلة لعرضها مباشرة داخل لوحة التحكم
  try {
    branchesList = await db.select().from(branches).limit(10);
  } catch {
    try {
      const raw = await db.execute(sql`SELECT * FROM branches ORDER BY created_at DESC LIMIT 10`);
      branchesList = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    } catch (err) {
      console.error('Failed to fetch branches list for dashboard:', err);
    }
  }

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* بطاقة الترحيب العلوية */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            L-K Shift Core
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
            {isRtl ? 'لوحة التحكم والعمليات المركزية' : 'Operations Dashboard'}
          </h1>
          <p className="mt-2 max-w-xl text-sm sm:text-base text-white/90">
            {isRtl
              ? 'متابعة مباشرة لانتشار الفروع، قوى الموظفين، وسجلات البصمة الذكية للنظام.'
              : 'Live overview of branches, staff management, and smart geofence records.'}
          </p>
        </div>
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* كروت الإحصائيات الحية - متوافقة بالكامل مع الوضع النهاري والليلي */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* إجمالي الفروع */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'الفروع المسجلة' : 'Registered Branches'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalBranches}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRtl ? 'فرع نشط' : 'branches'}</span>
          </div>
        </div>

        {/* إجمالي الموظفين */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'الموظفين المسجلين' : 'Total Staff'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalUsers}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRtl ? 'موظف' : 'members'}</span>
          </div>
        </div>

        {/* حالة البصمة الجغرافية */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'محرك الـ Geofence' : 'Geofence Engine'}
            </span>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {isRtl ? 'متصل ونشط' : 'Active'}
            </span>
          </div>
        </div>

        {/* مراجعة الحضور */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'سجلات الحضور' : 'Attendance Logs'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/${locale}/admin/attendance-review`}
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-500 transition dark:text-orange-400 dark:hover:text-orange-300"
            >
              {isRtl ? 'مراجعة الحضور' : 'Review Attendance'}
              <span aria-hidden="true">&larr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* القسم الميداني: استعراض الفروع المسجلة داخل الداشبورد مباشرة */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isRtl ? 'الفروع المسجلة ونطاق التغطية' : 'Branches & Geofence Coverage'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isRtl
                ? 'قائمة الفروع المرتبطة بالنظام مع بيانات الموقع ونصف القطر الجغرافي'
                : 'Active branches with GPS coordinates and attendance radius'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/branches/new`}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:opacity-95"
            >
              {isRtl ? '+ إضافة فرع' : '+ Add Branch'}
            </Link>
            <Link
              href={`/${locale}/branches`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
            >
              {isRtl ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
        </div>

        {branchesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm font-medium">
              {isRtl ? 'لا توجد فروع مسجلة حتى الآن.' : 'No branches found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الفرع' : 'Branch Name'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'المشرف / الهاتف' : 'Manager / Phone'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'العنوان' : 'Address'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'نصف القطر (GPS)' : 'Geofence'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {branchesList.map((branch: any) => (
                  <tr key={branch.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div>{branch.nameAr || branch.name || 'فرع بدون اسم'}</div>
                      {branch.nameEn && (
                        <div className="text-xs font-normal text-slate-400">{branch.nameEn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div>{branch.managerName || '—'}</div>
                      <div className="text-xs text-slate-400">{branch.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {branch.address || '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {branch.radiusMeters || branch.geofenceRadius || 100} م
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          branch.isActive ?? true
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {branch.isActive ?? true ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/${locale}/branches/${branch.id}`}
                        className="text-xs font-bold text-orange-600 hover:text-orange-500 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
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

      {/* الروابط السريعة للعمليات */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`/${locale}/branches`}
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-orange-500/50 hover:shadow-md dark:border-white/5 dark:bg-[#121526]/60 dark:hover:border-orange-500/40 dark:hover:bg-[#161a30]"
        >
          <h2 className="text-base font-bold text-slate-900 transition group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
            {isRtl ? 'إدارة الفروع والبصمة' : 'Branch Management'}
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isRtl ? 'ضبط وتعديل النطاق الجغرافي والإحداثيات لجميع الفروع.' : 'Configure branch coordinates and geofence radiuses.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/employees`}
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-rose-500/50 hover:shadow-md dark:border-white/5 dark:bg-[#121526]/60 dark:hover:border-rose-500/40 dark:hover:bg-[#161a30]"
        >
          <h2 className="text-base font-bold text-slate-900 transition group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400">
            {isRtl ? 'سجل الموظفين' : 'Employees Directory'}
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isRtl ? 'إضافة وتعديل بيانات الموظفين وتوزيعهم على الفروع.' : 'Manage employee profiles and branch allocations.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/attendance-review`}
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500/50 hover:shadow-md dark:border-white/5 dark:bg-[#121526]/60 dark:hover:border-emerald-500/40 dark:hover:bg-[#161a30]"
        >
          <h2 className="text-base font-bold text-slate-900 transition group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
            {isRtl ? 'مراجعة الحضور الميداني' : 'Attendance Review'}
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isRtl ? 'مراجعة واعتماد بصمات الموظفين وساعات العمل الحية.' : 'Audit check-in logs and branch geofence proofs.'}
          </p>
        </Link>
      </div>
    </div>
  );
}
