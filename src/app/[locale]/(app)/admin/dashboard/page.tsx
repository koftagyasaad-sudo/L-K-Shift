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

  // استعلام الإحصائيات مع الحماية من أي توقف في اتصال قاعدة البيانات
  try {
    const userRes = await db.select({ count: sql<number>`count(*)` }).from(users);
    totalUsers = Number(userRes[0]?.count || 0);

    const branchRes = await db.select({ count: sql<number>`count(*)` }).from(branches);
    totalBranches = Number(branchRes[0]?.count || 0);
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
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

      {/* بطاقات الإحصائيات الحية */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-[#121526]/80 p-5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-medium text-slate-400">
            {isRtl ? 'الفروع المسجلة' : 'Registered Branches'}
          </span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalBranches}</span>
            <span className="text-xs text-slate-500">{isRtl ? 'فرع' : 'branches'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#121526]/80 p-5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-medium text-slate-400">
            {isRtl ? 'الموظفين المسجلين' : 'Total Staff'}
          </span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalUsers}</span>
            <span className="text-xs text-slate-500">{isRtl ? 'موظف' : 'members'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#121526]/80 p-5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-medium text-slate-400">
            {isRtl ? 'محرك الـ Geofence' : 'Geofence Engine'}
          </span>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
              {isRtl ? 'متصل ونشط' : 'Active'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#121526]/80 p-5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-medium text-slate-400">
            {isRtl ? 'سجلات الحضور' : 'Attendance Logs'}
          </span>
          <div className="mt-4">
            <Link
              href={`/${locale}/admin/attendance-review`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
            >
              {isRtl ? 'مراجعة الحضور' : 'Review Attendance'}
              <span aria-hidden="true">&larr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* الروابط السريعة */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`/${locale}/admin/branches`}
          className="group rounded-2xl border border-white/5 bg-[#121526]/60 p-6 transition hover:border-orange-500/40 hover:bg-[#161a30]"
        >
          <h2 className="text-base font-bold text-white group-hover:text-orange-400 transition">
            {isRtl ? 'إدارة الفروع والبصمة' : 'Branch Management'}
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            {isRtl ? 'ضبط وتعديل النطاق الجغرافي والإحداثيات.' : 'Configure coordinates and geofence radiuses.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/employees`}
          className="group rounded-2xl border border-white/5 bg-[#121526]/60 p-6 transition hover:border-rose-500/40 hover:bg-[#161a30]"
        >
          <h2 className="text-base font-bold text-white group-hover:text-rose-400 transition">
            {isRtl ? 'سجل الموظفين' : 'Employees Directory'}
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            {isRtl ? 'إضافة وتعديل بيانات الموظفين وتوزيع الفروع.' : 'Manage employee profiles and branch allocations.'}
          </p>
        </Link>

        <Link
          href={`/${locale}/admin/attendance-review`}
          className="group rounded-2xl border border-white/5 bg-[#121526]/60 p-6 transition hover:border-emerald-500/40 hover:bg-[#161a30]"
        >
          <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
            {isRtl ? 'مراجعة الحضور الميداني' : 'Attendance Review'}
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            {isRtl ? 'مراجعة واعتماد بصمات الموظفين وساعات العمل.' : 'Audit check-in logs and branch geofence proofs.'}
          </p>
        </Link>
      </div>
    </div>
  );
}
