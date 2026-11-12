'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  Clock3,
  Ellipsis,
  LayoutDashboard,
  Shield,
  Users,
  Wallet,
  UserRound,
  ClipboardCheck,
  BriefcaseBusiness,
  CheckCircle2,
} from 'lucide-react';

interface NavItem {
  titleAr: string;
  titleEn: string;
  href: string;
  icon: typeof Clock3;
  adminOnly?: boolean;
}

const adminItems: NavItem[] = [
  { titleAr: 'النظرة العامة', titleEn: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard, adminOnly: true },
  { titleAr: 'الفروع', titleEn: 'Branches', href: '/admin/branches', icon: Building2, adminOnly: true },
  { titleAr: 'الموظفين', titleEn: 'Employees', href: '/admin/employees', icon: Users, adminOnly: true },
  { titleAr: 'مراجعة الحضور', titleEn: 'Attendance', href: '/admin/attendance-review', icon: ClipboardCheck, adminOnly: true },
  { titleAr: 'الطلبات', titleEn: 'Requests', href: '/requests', icon: CalendarDays },
  { titleAr: 'الرواتب', titleEn: 'Payroll', href: '/admin/attendance-review', icon: Wallet, adminOnly: true },
  { titleAr: 'الأدوار', titleEn: 'Roles', href: '/admin/roles', icon: Shield, adminOnly: true },
];

const employeeItems: NavItem[] = [
  { titleAr: 'الحضور', titleEn: 'Attendance', href: '/attendance', icon: Clock3 },
  { titleAr: 'ملفي الشخصي', titleEn: 'Profile', href: '/profile', icon: UserRound },
  { titleAr: 'الراتب', titleEn: 'Salary', href: '/employee/salary', icon: Wallet },
  { titleAr: 'الطلبات', titleEn: 'Requests', href: '/requests', icon: CalendarDays },
];

const secondaryItems: NavItem[] = [
  { titleAr: 'اعتماد الطلبات', titleEn: 'Approvals', href: '/admin/leave-requests', icon: CheckCircle2, adminOnly: true },
  { titleAr: 'التوظيف', titleEn: 'Recruitment', href: '/admin/recruitment', icon: BriefcaseBusiness, adminOnly: true },
];

function useNavigationRole() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load the authenticated user.');
        return response.json();
      })
      .then((data: {
        user?: { systemRole?: string; permissions?: unknown };
      }) => {
        if (!active) return;
        const permissions = Array.isArray(data.user?.permissions)
          ? data.user.permissions.filter((permission): permission is string => typeof permission === 'string')
          : [];
        setIsAdmin(
          data.user?.systemRole !== 'EMPLOYEE'
          && (data.user?.systemRole === 'SUPER_ADMIN' || permissions.length > 0)
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Failed to load navigation permissions:', error);
        setIsAdmin(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}

function isItemActive(pathname: string, locale: string, href: string) {
  const localizedHref = `/${locale}${href}`;
  return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
}

export function DesktopNav({ locale }: { locale: string }) {
  const pathname = usePathname() || '';
  const isRtl = locale === 'ar';
  const isAdmin = useNavigationRole();
  const [showMore, setShowMore] = useState(false);
  const items = (isAdmin ? adminItems : employeeItems).filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav
      aria-label={isRtl ? 'التنقل الرئيسي' : 'Primary navigation'}
      className="hidden h-full min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(pathname, locale, item.href);
        return (
          <Link
            key={item.href + item.titleEn}
            href={`/${locale}${item.href}`}
            prefetch
            aria-current={active ? 'page' : undefined}
            className={`relative flex h-full shrink-0 items-center gap-2 border-b-2 px-2.5 text-xs font-medium transition-colors xl:px-3 ${
              active
                ? 'border-orange-600 text-slate-950 dark:border-orange-500 dark:text-zinc-100'
                : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{isRtl ? item.titleAr : item.titleEn}</span>
          </Link>
        );
      })}
      {isAdmin && (
        <div className="relative flex h-full shrink-0 items-center">
          <button
            type="button"
            onClick={() => setShowMore((open) => !open)}
            aria-expanded={showMore}
            className={`h-full border-b-2 px-2.5 text-xs font-medium transition-colors xl:px-3 ${
              showMore
                ? 'border-orange-600 text-slate-950 dark:border-orange-500 dark:text-zinc-100'
                : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {isRtl ? 'المزيد' : 'More'}
          </button>
          {showMore && (
            <div className="absolute end-0 top-full z-50 mt-1 min-w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/[0.08] dark:bg-[#141519]">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-[#1c1e24]"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {isRtl ? item.titleAr : item.titleEn}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export function MobileBottomNav({ locale }: { locale: string }) {
  const pathname = usePathname() || '';
  const isRtl = locale === 'ar';
  const isAdmin = useNavigationRole();
  const [showMore, setShowMore] = useState(false);
  const items = isAdmin ? adminItems.slice(0, 4) : employeeItems;
  const moreItems = isAdmin ? secondaryItems : [];

  return (
    <div className="lg:hidden">
      {showMore && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20"
          aria-label={isRtl ? 'إغلاق القائمة' : 'Close menu'}
          onClick={() => setShowMore(false)}
        />
      )}
      {showMore && moreItems.length > 0 && (
        <div
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] end-3 z-40 min-w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/[0.08] dark:bg-[#141519]"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                onClick={() => setShowMore(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-[#1c1e24]"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {isRtl ? item.titleAr : item.titleEn}
              </Link>
            );
          })}
        </div>
      )}
      <nav
        aria-label={isRtl ? 'التنقل الرئيسي' : 'Primary navigation'}
        className={`fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] ${moreItems.length > 0 ? 'grid-cols-5' : 'grid-cols-4'} border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/[0.08] dark:bg-[#141519]/95`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, locale, item.href);
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 border-t-2 text-[10px] font-medium transition-colors ${
                active
                  ? 'border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-500'
                  : 'border-transparent text-slate-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="max-w-full truncate px-1">{isRtl ? item.titleAr : item.titleEn}</span>
            </Link>
          );
        })}
        {moreItems.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowMore((open) => !open)}
            aria-expanded={showMore}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 border-t-2 text-[10px] font-medium ${
              showMore ? 'border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-500' : 'border-transparent text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Ellipsis className="h-[18px] w-[18px]" aria-hidden="true" />
            <span>{isRtl ? 'المزيد' : 'More'}</span>
          </button>
        ) : null}
      </nav>
    </div>
  );
}

export default function Sidebar() {
  return null;
}
