import Link from 'next/link';
import { Building2, CalendarDays, ClipboardCheck, Shield, Users, Wallet, MapPin } from 'lucide-react';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSqlRows } from '@/lib/db';
import { authorizeApi, hasApiPermission } from '@/lib/api-auth';
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

  const auth = await authorizeApi();
  const principal = 'principal' in auth && auth.principal ? auth.principal : null;

  const isSuperAdmin =
    principal?.systemRole === 'SUPER_ADMIN' ||
    principal?.jobRole === 'مدير النظام' ||
    principal?.permissions.includes('*');

  const hasSubPerm = (subPerm: string, parentFallback?: string) => {
    if (!principal) return false;
    if (isSuperAdmin) return true;
    if (hasApiPermission(principal, subPerm)) return true;
    // If no granular dashboard sub-permissions were explicitly configured on this role yet, fall back to parent permission
    const hasAnyGranularDash = principal.permissions.some((p) => p.startsWith('dashboard.cards.') || p === 'dashboard.priorities_bar' || p === 'dashboard.branches_table');
    if (!hasAnyGranularDash && parentFallback) {
      return hasApiPermission(principal, parentFallback);
    }
    return false;
  };

  const canManageBranches = Boolean(principal && (isSuperAdmin || hasApiPermission(principal, 'branches.manage')));

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
    const raw = await db.execute(sql`
      SELECT
        id::text AS id,
        COALESCE(name_ar, name, 'فرع') as "nameAr",
        COALESCE(name_en, name_ar, 'Branch') as "nameEn",
        name_ar,
        name_en,
        address,
        latitude::text,
        longitude::text,
        COALESCE(geofence_radius, 10) as "radiusMeters",
        COALESCE(geofence_radius, 10) as "geofenceRadius",
        COALESCE(is_active, true) as "isActive",
        created_at as "createdAt"
      FROM branches
      ORDER BY id ASC;
    `);
    const allBranches = getSqlRows<typeof branchesList[number]>(raw);

    // Filter branches strictly according to the user's branchScope
    if (!isSuperAdmin && principal && principal.branchScope !== 'ALL') {
      branchesList = allBranches.filter((b) => {
        const bid = String(b.id);
        if (principal.branchScope === 'CUSTOM' && principal.allowedBranchIds.length > 0) {
          return principal.allowedBranchIds.includes(bid);
        }
        if (principal.primaryBranchId) {
          return bid === String(principal.primaryBranchId);
        }
        return false;
      });
    } else {
      branchesList = allBranches;
    }
  } catch (error) {
    console.error('Failed to fetch branches list for dashboard:', error);
  }

  const allowedBranchIdsForCount = branchesList.map((b) => String(b.id));
  let totalUsers = 0;
  const totalBranches = branchesList.length;

  try {
    if (isSuperAdmin || principal?.branchScope === 'ALL') {
      const userRes = await db.execute(sql`SELECT count(*)::int as count FROM users;`);
      const uRows = getSqlRows<{ count: number | string }>(userRes);
      totalUsers = Number(uRows[0]?.count || 0);
    } else if (allowedBranchIdsForCount.length > 0) {
      const userRes = await db.execute(sql`
        SELECT count(*)::int as count
        FROM users
        WHERE primary_branch_id::text IN (${sql.join(allowedBranchIdsForCount.map((id) => sql`${id}`), sql`, `)});
      `);
      const uRows = getSqlRows<{ count: number | string }>(userRes);
      totalUsers = Number(uRows[0]?.count || 0);
    }
  } catch (error) {
    console.error('Failed to load scoped user count:', error);
  }

  const allMetrics = [
    {
      id: 'dashboard.cards.branches',
      fallback: 'branches.view',
      href: canManageBranches ? '/admin/branches' : '/admin/dashboard',
      label: isRtl ? 'الفروع المسموحة' : 'Assigned Branches',
      value: totalBranches,
      icon: Building2,
    },
    {
      id: 'dashboard.cards.employees',
      fallback: 'employees.view',
      href: '/admin/employees',
      label: isRtl ? 'موظفو النطاق' : 'Employees',
      value: totalUsers,
      icon: Users,
    },
    {
      id: 'dashboard.cards.attendance',
      fallback: 'attendance.review',
      href: '/admin/attendance-review',
      label: isRtl ? 'مراجعة الحضور' : 'Attendance review',
      value: null,
      icon: ClipboardCheck,
    },
    {
      id: 'dashboard.cards.requests',
      fallback: 'leaves.approve',
      href: '/admin/leave-requests',
      label: isRtl ? 'طلبات الموظفين' : 'Employee requests',
      value: null,
      icon: CalendarDays,
    },
    {
      id: 'dashboard.cards.payroll',
      fallback: 'attendance.zk_sheet',
      href: '/admin/attendance-review',
      label: isRtl ? 'الرواتب والمسيرات' : 'Payroll',
      value: null,
      icon: Wallet,
    },
    {
      id: 'dashboard.cards.roles',
      fallback: 'roles.view',
      href: '/admin/roles',
      label: isRtl ? 'الأدوار والصلاحيات' : 'Roles & permissions',
      value: null,
      icon: Shield,
    },
  ];

  const visibleMetrics = allMetrics.filter((m) => hasSubPerm(m.id, m.fallback));
  const showPrioritiesBar = hasSubPerm('dashboard.priorities_bar', 'dashboard.view');
  const showBranchesTable = hasSubPerm('dashboard.branches_table', 'dashboard.view');

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {isRtl ? 'نظرة عامة' : 'Overview'}
            </p>
            {!isSuperAdmin && principal?.branchScope !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#57cef8]/15 border border-[#57cef8]/40 px-2.5 py-0.5 text-[11px] font-extrabold text-[#0099cc] dark:text-[#57cef8]">
                <MapPin className="h-3 w-3" />
                <span>
                  {isRtl
                    ? `نطاق مخصص: ${branchesList.map((b) => b.nameAr).join('، ') || 'فرعك فقط'}`
                    : 'Branch-Scoped View'}
                </span>
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-3xl">
            {isRtl ? 'مساحة الإدارة' : 'Executive overview'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-zinc-400">
            {isRtl
              ? 'ملخص سريع للفروع والموظفين ضمن نطاق صلاحياتك المعتمدة.'
              : 'A concise view of your assigned branches and team.'}
          </p>
        </div>
        {canManageBranches && (
          <Link
            href={`/${locale}/admin/branches`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#57cef8] px-4 text-sm font-extrabold text-[#181d23] transition hover:opacity-90"
          >
            {isRtl ? 'إدارة وإضافة الفروع' : 'Manage Branches'}
          </Link>
        )}
      </section>

      {showPrioritiesBar && (
        <section
          aria-label={isRtl ? 'إجراءات تحتاج إلى متابعة' : 'Items needing attention'}
          className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-[#232a32] shadow-xs"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {isRtl ? 'متابعة اليوم' : 'Today’s priorities'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
              {isRtl ? 'راجع الطلبات الواردة وسجلات الحضور ضمن نطاقك.' : 'Review incoming requests and attendance records.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasSubPerm('dashboard.cards.requests', 'leaves.approve') && (
              <Link
                href={`/${locale}/admin/leave-requests`}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-[#181d23]"
              >
                {isRtl ? 'مراجعة الطلبات' : 'Review requests'}
              </Link>
            )}
            {hasSubPerm('dashboard.cards.attendance', 'attendance.review') && (
              <Link
                href={`/${locale}/admin/attendance-review`}
                className="inline-flex h-9 items-center rounded-lg bg-[#57cef8] px-3 text-xs font-extrabold text-[#181d23] transition hover:opacity-90"
              >
                {isRtl ? 'سجلات الحضور' : 'Attendance records'}
              </Link>
            )}
          </div>
        </section>
      )}

      {visibleMetrics.length > 0 && (
        <section
          aria-label={isRtl ? 'روابط الإدارة' : 'Management links'}
          className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200/90 bg-white divide-x divide-y divide-slate-200/90 sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse dark:border-white/[0.08] dark:bg-[#232a32] shadow-xs dark:divide-white/[0.08] lg:grid-cols-3"
        >
          {visibleMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link
                key={metric.id}
                href={`/${locale}${metric.href}`}
                className="group min-w-0 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-[#181d23] sm:p-5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-600 dark:text-zinc-300">{metric.label}</span>
                  <Icon className="h-4 w-4 shrink-0 text-[#57cef8]" aria-hidden="true" />
                </span>
                <span className="mt-3 block font-mono text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-zinc-100">
                  {metric.value ?? (isRtl ? 'عرض' : 'View')}
                </span>
              </Link>
            );
          })}
        </section>
      )}

      {showBranchesTable && (
        <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-white/[0.08] dark:bg-[#232a32] shadow-xs">
          <div className="flex flex-col gap-3 border-b border-slate-200/90 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                {isRtl
                  ? isSuperAdmin || principal?.branchScope === 'ALL'
                    ? 'جميع الفروع المسجلة'
                    : 'الفرع المخصص لك'
                  : 'Branches'}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                {isRtl
                  ? canManageBranches
                    ? 'قائمة الفروع المسجلة ونطاق التغطية'
                    : 'بيانات الفرع المخصص لنطاق عملك (للعرض فقط — لا يمكن التعديل)'
                  : 'Registered locations and attendance coverage'}
              </p>
            </div>
            {canManageBranches && (
              <Link
                href={`/${locale}/admin/branches`}
                className="text-xs font-extrabold text-[#0099cc] hover:underline dark:text-[#57cef8]"
              >
                {isRtl ? 'إدارة وتعديل الفروع' : 'Manage all branches'}
              </Link>
            )}
          </div>
          <DashboardBranchesTable
            branches={branchesList}
            locale={locale}
            canManageBranches={canManageBranches}
          />
        </section>
      )}
    </div>
  );
}
