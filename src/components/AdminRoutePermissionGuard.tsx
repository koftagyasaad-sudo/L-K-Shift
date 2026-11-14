'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { ShieldAlert, ArrowRight } from 'lucide-react';

const ROUTE_PERMISSION_RULES: Array<{
  prefix: string;
  anyOf: string[];
  menuNameAr: string;
}> = [
  {
    prefix: '/admin/employees',
    anyOf: ['employees.view', 'employees.manage', 'hr_files.view'],
    menuNameAr: 'شؤون الموظفين وملفات الـ HR',
  },
  {
    prefix: '/admin/attendance-review',
    anyOf: ['attendance.review', 'attendance.override', 'attendance.zk_sheet', 'payroll.view'],
    menuNameAr: 'مراجعة الحضور ومسير الرواتب',
  },
  {
    prefix: '/admin/branches',
    anyOf: ['branches.view', 'branches.manage'],
    menuNameAr: 'إدارة الفروع والنطاق الجغرافي',
  },
  {
    prefix: '/admin/leave-requests',
    anyOf: ['leaves.view', 'leaves.approve', 'staff_requests.manage'],
    menuNameAr: 'اعتماد الطلبات والإجازات',
  },
  {
    prefix: '/admin/roles',
    anyOf: ['roles.view', 'roles.manage'],
    menuNameAr: 'إدارة الأدوار والصلاحيات',
  },
  {
    prefix: '/admin/recruitment',
    anyOf: ['recruitment.view', 'recruitment.manage'],
    menuNameAr: 'إدارة التوظيف واستمارات المتقدمين',
  },
  {
    prefix: '/admin/dashboard',
    anyOf: [
      'dashboard.view',
      'dashboard.priorities_bar',
      'dashboard.branches_table',
      'dashboard.cards.branches',
      'dashboard.cards.employees',
      'dashboard.cards.attendance',
      'dashboard.cards.requests',
      'dashboard.cards.payroll',
      'dashboard.cards.roles',
    ],
    menuNameAr: 'لوحة التحكم والنظرة العامة (الداشبورد)',
  },
];

export default function AdminRoutePermissionGuard({
  children,
  serverPermissions,
  isSuperAdmin,
}: {
  children: React.ReactNode;
  serverPermissions: string[];
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname() || '';
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'ar';
  const [deniedMenu, setDeniedMenu] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin || serverPermissions.includes('*')) {
      setDeniedMenu(null);
      return;
    }

    // Strip locale prefix (/ar or /en)
    const cleanPath = pathname.startsWith("/ar/") || pathname.startsWith("/en/") ? pathname.slice(3) : pathname === "/ar" || pathname === "/en" ? "/" : pathname;
    const matchedRule = ROUTE_PERMISSION_RULES.find((rule) =>
      cleanPath.startsWith(rule.prefix)
    );

    if (!matchedRule) {
      setDeniedMenu(null);
      return;
    }

    const hasAccess = matchedRule.anyOf.some((perm) =>
      serverPermissions.includes(perm)
    );

    if (!hasAccess) {
      setDeniedMenu(matchedRule.menuNameAr);
    } else {
      setDeniedMenu(null);
    }
  }, [pathname, serverPermissions, isSuperAdmin]);

  if (deniedMenu) {
    return (
      <div
        className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center"
        dir="rtl"
      >
        <div className="w-full rounded-2xl border-2 border-rose-500/40 bg-white dark:bg-[#232a32] p-6 sm:p-8 shadow-xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            ⛔ غير مصرح لك بالدخول إلى هذه القائمة
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            عفواً، دورك الوظيفي الحالي لا يمتلك صلاحية فتح قائمة{' '}
            <strong className="text-rose-500">({deniedMenu})</strong>. يرجى مراجعة مدير النظام إذا كنت بحاجة لهذه الصلاحية.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => router.replace(`/${locale}/attendance`)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#57cef8] px-5 py-2.5 text-xs font-extrabold text-[#181d23] shadow-sm cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
              <span>العودة إلى صفحتي المتاحة</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
