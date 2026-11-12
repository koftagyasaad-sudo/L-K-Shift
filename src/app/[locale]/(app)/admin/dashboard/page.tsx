import Link from 'next/link';
import { Building2, CalendarDays, ClipboardCheck, Shield, Users, Wallet } from 'lucide-react';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSqlRows } from '@/lib/db';
import DashboardBranchesTable from './DashboardBranchesTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

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
  } catch (error) {
    console.error('Failed to fetch branches list for dashboard:', error);
  }

  const metrics = [
    { href: '/admin/branches', label: isRtl ? 'الفروع' : 'Branches', value: totalBranches, icon: Building2 },
    { href: '/admin/employees', label: isRtl ? 'الموظفون' : 'Employees', value: totalUsers, icon: Users },
    { href: '/admin/attendance-review', label: isRtl ? 'مراجعة الحضور' : 'Attendance review', value: null, icon: ClipboardCheck },
    { href: '/requests', label: isRtl ? 'طلبات الموظفين' : 'Employee requests', value: null, icon: CalendarDays },
    { href: '/admin/attendance-review', label: isRtl ? 'الرواتب' : 'Payroll', value: null, icon: Wallet },
    { href: '/admin/roles', label: isRtl ? 'الأدوار والصلاحيات' : 'Roles & permissions', value: null, icon: Shield },
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {isRtl ? 'نظرة عامة' : 'Overview'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-3xl">
            {isRtl ? 'مساحة الإدارة' : 'Executive overview'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-zinc-400">
            {isRtl
              ? 'ملخص سريع للفروع والموظفين، مع وصول مباشر للمهام الإدارية اليومية.'
              : 'A concise view of your branches and team, with direct access to daily operations.'}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/branches/new`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-medium text-white transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        >
          {isRtl ? 'إضافة فرع' : 'Add branch'}
        </Link>
      </section>

      {'\n'}
      <section
        aria-label={isRtl ? 'إجراءات تحتاج إلى متابعة' : 'Items needing attention'}
        className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-[#141519]"
      >
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {isRtl ? 'متابعة اليوم' : 'Today’s priorities'}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
            {isRtl ? 'راجع الطلبات الواردة وسجلات الحضور عند الحاجة.' : 'Review incoming requests and attendance records as needed.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/admin/leave-requests`}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:bg-[#1c1e24]"
          >
            {isRtl ? 'مراجعة الطلبات' : 'Review requests'}
          </Link>
          <Link
            href={`/${locale}/admin/attendance-review`}
            className="inline-flex h-9 items-center rounded-lg bg-orange-600 px-3 text-xs font-medium text-white transition hover:bg-orange-700"
          >
            {isRtl ? 'سجلات الحضور' : 'Attendance records'}
          </Link>
        </div>
      </section>

      {'\n'}
      <section
        aria-label={isRtl ? 'روابط الإدارة' : 'Management links'}
        className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200/90 bg-white divide-x divide-y divide-slate-200/90 sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse dark:border-white/[0.08] dark:bg-[#141519] dark:divide-white/[0.08] lg:grid-cols-4"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.href + metric.label}
              href={`/${locale}${metric.href}`}
              className="group min-w-0 p-4 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-orange-600 dark:hover:bg-[#1c1e24] dark:focus-visible:outline-orange-500 sm:p-5"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-slate-600 dark:text-zinc-400">{metric.label}</span>
                <Icon className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-orange-600 dark:text-zinc-500 dark:group-hover:text-orange-500" aria-hidden="true" />
              </span>
              <span className="mt-3 block font-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-zinc-100">
                {metric.value ?? (isRtl ? 'عرض' : 'View')}
              </span>
            </Link>
          );
        })}
      </section>

      {'\n'}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-white/[0.08] dark:bg-[#141519]">
        <div className="flex flex-col gap-3 border-b border-slate-200/90 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {isRtl ? 'الفروع' : 'Branches'}
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
              {isRtl ? 'قائمة الفروع المسجلة ونطاق التغطية' : 'Registered locations and attendance coverage'}
            </p>
          </div>
          <Link
            href={`/${locale}/admin/branches`}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400"
          >
            {isRtl ? 'عرض جميع الفروع' : 'View all branches'}
          </Link>
        </div>
        <DashboardBranchesTable branches={branchesList} locale={locale} />
      </section>
    </div>
  );
}
