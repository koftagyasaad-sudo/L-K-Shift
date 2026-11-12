import React from 'react';
import Link from 'next/link';
import { ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSqlRows } from '@/lib/db';
import DashboardBranchesTable from './DashboardBranchesTable';

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
  const Arrow = isRtl ? ArrowUpLeft : ArrowUpRight;

  let totalUsers = 0;
  let totalBranches = 0;
  let branchesList: Array<{
    id: string;
    nameAr: string | null;
    nameEn: string | null;
    name_ar?: string | null;
    name_en?: string | null;
    name?: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    radiusMeters: number;
    geofenceRadius: number;
    geofence_radius?: number;
    isActive: boolean;
    is_active?: boolean;
    createdAt: Date;
  }> = [];

  // 1. حساب الإحصائيات المركزية
  try {
    const userRes = await db.execute(sql`SELECT count(*)::int as count FROM users;`);
    const uRows = getSqlRows<{ count: number | string }>(userRes);
    totalUsers = Number(uRows[0]?.count || 0);

    const branchRes = await db.execute(sql`SELECT count(*)::int as count FROM branches;`);
    const bRows = getSqlRows<{ count: number | string }>(branchRes);
    totalBranches = Number(bRows[0]?.count || 0);
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
  }

  // 2. استعلام بيانات الفروع مع المطابقة المزدوجة للأسماء لمنع "فرع بدون اسم"
  try {
    const raw = await db.execute(sql`
      SELECT 
        id, 
        name_ar as "nameAr", 
        name_en as "nameEn", 
        name_ar, 
        name_en, 
        address, 
        latitude::text, 
        longitude::text, 
        geofence_radius as "radiusMeters",
        geofence_radius as "geofenceRadius",
        is_active as "isActive",
        created_at as "createdAt"
      FROM branches 
      ORDER BY id ASC;
    `);
    branchesList = getSqlRows<typeof branchesList[number]>(raw);
  } catch (err) {
    console.error('Failed to fetch branches list for dashboard:', err);
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* بطاقة الترحيب العلوية */}
      <div className="sonomir-card relative overflow-hidden rounded-2xl border-s-[3px] border-s-[#46f4ff] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full border border-[#9d6bff]/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-[#6e42bd] backdrop-blur-md dark:text-[#c9c0e8]">
            L-K Shift Core
          </span>
          <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#756c91] dark:text-[#c9c0e8]">
            Section 01 · {isRtl ? 'العمليات' : 'Operations'}
          </p>
          <h1 className="sonomir-gradient-text mt-2 text-2xl font-black tracking-tight sm:text-4xl">
            {isRtl ? 'لوحة التحكم والعمليات المركزية' : 'Operations Dashboard'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#433b5c] dark:text-[#c9c0e8] sm:text-base">
            {isRtl
              ? 'متابعة مباشرة لانتشار الفروع، قوى الموظفين، وسجلات البصمة الذكية للنظام.'
              : 'Live overview of branches, staff management, and smart geofence records.'}
          </p>
        </div>
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#9d6bff]/10 blur-2xl" />
      </div>

      {'\n'}
      {/* كروت الإحصائيات المتوافقة مع الثيمين */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* الفروع المسجلة */}
        <Link
          href={`/${locale}/admin/branches`}
          prefetch
          className="sonomir-card group relative cursor-pointer border-s-[3px] border-s-[#46f4ff] rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-[#46f4ff] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#46f4ff]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'الفروع المسجلة' : 'Registered Branches'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <Arrow size={15} className="text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#46f4ff] dark:text-[#c9c0e8]" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono tabular-nums text-3xl font-extrabold text-[#0a0814] dark:text-[#f6f0ff]">{totalBranches}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRtl ? 'فرع نشط' : 'branches'}</span>
          </div>
        </Link>

        {/* إجمالي الموظفين */}
        <Link
          href={`/${locale}/admin/employees`}
          prefetch
          className="sonomir-card group cursor-pointer border-s-[3px] border-s-[#ff2bd6] rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-[#ff2bd6] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2bd6]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'الموظفين المسجلين' : 'Total Staff'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <Arrow size={15} className="text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#ff2bd6] dark:text-[#c9c0e8]" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono tabular-nums text-3xl font-extrabold text-[#0a0814] dark:text-[#f6f0ff]">{totalUsers}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRtl ? 'موظف' : 'members'}</span>
          </div>
        </Link>

        {/* محرك الـ Geofence */}
        <Link
          href={`/${locale}/admin/branches`}
          prefetch
          className="sonomir-card group cursor-pointer border-s-[3px] border-s-[#9d6bff] rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-[#9d6bff] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9d6bff]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'محرك الـ Geofence' : 'Geofence Engine'}
            </span>
            <Arrow size={15} className="text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#9d6bff] dark:text-[#c9c0e8]" />
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="sonomir-live-dot relative inline-flex h-3 w-3 rounded-full" />
            </span>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-lg bg-lime-400/15 px-2.5 py-1 text-xs font-bold text-[#557700] dark:text-[#cdff4d]">
              {isRtl ? 'متصل ونشط' : 'Active'}
            </span>
          </div>
        </Link>

        {/* مراجعة الحضور */}
        <Link
          href={`/${locale}/admin/attendance-review`}
          prefetch
          className="sonomir-card group cursor-pointer border-s-[3px] border-s-[#46f4ff] rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-[#46f4ff] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#46f4ff]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isRtl ? 'سجلات الحضور' : 'Attendance Logs'}
            </span>
            <Arrow size={15} className="text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#46f4ff] dark:text-[#c9c0e8]" />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-[#6e42bd] dark:text-[#46f4ff]">
            {isRtl ? 'مراجعة الحضور' : 'Review Attendance'}
          </div>
        </Link>
      </div>

      {'\n'}
      {/* استعراض الفروع المسجلة ونطاق التغطية */}
      <div className="sonomir-card min-w-0 overflow-hidden rounded-xl">
        <div className="flex flex-col gap-4 border-b border-violet-950/10 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-[#c4b2ff]/15">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#756c91] dark:text-[#c9c0e8]">
              Section 02 · {isRtl ? 'شبكة الفروع' : 'Branch Network'}
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#0a0814] dark:text-[#f6f0ff]">
              {isRtl ? 'الفروع المسجلة ونطاق التغطية' : 'Branches & Geofence Coverage'}
            </h2>
            <p className="mt-1 text-xs text-[#433b5c] dark:text-[#c9c0e8]">
              {isRtl
                ? 'قائمة الفروع المرتبطة بالنظام مع بيانات الموقع ونصف القطر الجغرافي'
                : 'Active branches with GPS coordinates and attendance radius'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/admin/branches/new`}
              className="sonomir-iridescent inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-[#050309] shadow-md transition hover:-translate-y-0.5"
            >
              {isRtl ? '+ إضافة فرع' : '+ Add Branch'}
            </Link>
            <Link
              href={`/${locale}/admin/branches`}
              className="rounded-xl border border-violet-950/10 bg-violet-50 px-4 py-2 text-xs font-semibold text-[#433b5c] transition hover:bg-violet-100 dark:border-[#c4b2ff]/15 dark:bg-[#110e1f] dark:text-[#c9c0e8] dark:hover:bg-[#1a1530]"
            >
              {isRtl ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
        </div>

        <DashboardBranchesTable branches={branchesList} locale={locale} />
      </div>

      {'\n'}
      {/* الروابط السريعة */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href={`/${locale}/admin/branches`}
          prefetch
          className="sonomir-card group relative cursor-pointer border-s-[3px] border-s-[#46f4ff] rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-[#46f4ff] hover:shadow-lg"
        >
          <Arrow size={16} className="absolute end-5 top-5 text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#46f4ff] dark:text-[#c9c0e8]" />
          <h2 className="pe-8 text-base font-bold text-[#0a0814] transition group-hover:text-[#6e42bd] dark:text-[#f6f0ff] dark:group-hover:text-[#46f4ff]">
            {isRtl ? 'إدارة الفروع والبصمة' : 'Branch Management'}
          </h2>
          <p className="mt-2 text-xs text-[#433b5c] dark:text-[#c9c0e8]">
            {isRtl ? 'ضبط وتعديل النطاق الجغرافي والإحداثيات لجميع الفروع.' : 'Configure branch coordinates and geofence radiuses.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/employees`}
          prefetch
          className="sonomir-card group relative cursor-pointer border-s-[3px] border-s-[#ff2bd6] rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-[#ff2bd6] hover:shadow-lg"
        >
          <Arrow size={16} className="absolute end-5 top-5 text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#ff2bd6] dark:text-[#c9c0e8]" />
          <h2 className="pe-8 text-base font-bold text-[#0a0814] transition group-hover:text-[#6e42bd] dark:text-[#f6f0ff] dark:group-hover:text-[#ff2bd6]">
            {isRtl ? 'سجل الموظفين' : 'Employees Directory'}
          </h2>
          <p className="mt-2 text-xs text-[#433b5c] dark:text-[#c9c0e8]">
            {isRtl ? 'إضافة وتعديل بيانات الموظفين وتوزيعهم على الفروع.' : 'Manage employee profiles and branch allocations.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/attendance-review`}
          prefetch
          className="sonomir-card group relative cursor-pointer border-s-[3px] border-s-[#46f4ff] rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-[#46f4ff] hover:shadow-lg"
        >
          <Arrow size={16} className="absolute end-5 top-5 text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#46f4ff] dark:text-[#c9c0e8]" />
          <h2 className="pe-8 text-base font-bold text-[#0a0814] transition group-hover:text-[#6e42bd] dark:text-[#f6f0ff] dark:group-hover:text-[#46f4ff]">
            {isRtl ? 'مراجعة الحضور الميداني' : 'Attendance Review'}
          </h2>
          <p className="mt-2 text-xs text-[#433b5c] dark:text-[#c9c0e8]">
            {isRtl ? 'مراجعة واعتماد بصمات الموظفين وساعات العمل الحية.' : 'Audit check-in logs and branch geofence proofs.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/requests`}
          prefetch
          className="sonomir-card group relative cursor-pointer border-s-[3px] border-s-[#9d6bff] rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-[#9d6bff] hover:shadow-lg"
        >
          <Arrow size={16} className="absolute end-5 top-5 text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#9d6bff] dark:text-[#c9c0e8]" />
          <h2 className="pe-8 text-base font-bold text-[#0a0814] transition group-hover:text-[#6e42bd] dark:text-[#f6f0ff] dark:group-hover:text-[#9d6bff]">
            {isRtl ? 'الإجازات والطلبات' : 'Leaves & Requests'}
          </h2>
          <p className="mt-2 text-xs text-[#433b5c] dark:text-[#c9c0e8]">
            {isRtl ? 'تقديم ومتابعة طلبات الموظفين.' : 'Submit and track employee requests.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/attendance-review`}
          prefetch
          className="sonomir-card group relative cursor-pointer border-s-[3px] border-s-[#ff2bd6] rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-[#ff2bd6] hover:shadow-lg"
        >
          <Arrow size={16} className="absolute end-5 top-5 text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#ff2bd6] dark:text-[#c9c0e8]" />
          <h2 className="pe-8 text-base font-bold text-[#0a0814] transition group-hover:text-[#6e42bd] dark:text-[#f6f0ff] dark:group-hover:text-[#ff2bd6]">
            {isRtl ? 'الرواتب' : 'Payroll'}
          </h2>
          <p className="mt-2 text-xs text-[#433b5c] dark:text-[#c9c0e8]">
            {isRtl ? 'مراجعة ساعات العمل وسجلات الرواتب.' : 'Review work hours and payroll records.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/roles`}
          prefetch
          className="sonomir-card group relative cursor-pointer border-s-[3px] border-s-[#46f4ff] rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-[#46f4ff] hover:shadow-lg"
        >
          <Arrow size={16} className="absolute end-5 top-5 text-[#756c91] transition group-hover:-translate-y-0.5 group-hover:text-[#46f4ff] dark:text-[#c9c0e8]" />
          <h2 className="pe-8 text-base font-bold text-[#0a0814] transition group-hover:text-[#6e42bd] dark:text-[#f6f0ff] dark:group-hover:text-[#46f4ff]">
            {isRtl ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
          </h2>
          <p className="mt-2 text-xs text-[#433b5c] dark:text-[#c9c0e8]">
            {isRtl ? 'إدارة أدوار الوصول المصرح بها.' : 'Manage authorized access roles.'}
          </p>
        </Link>
      </div>
    </div>
  );
}
