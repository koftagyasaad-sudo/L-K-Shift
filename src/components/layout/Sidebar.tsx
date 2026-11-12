'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  ClipboardCheck,
  Calendar,
  Users,
  Building2,
  Shield,
  Briefcase,
  CheckCircle2,
  UserCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  locale?: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

interface NavItem {
  titleAr: string;
  titleEn: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    titleAr: 'لوحة التحكم',
    titleEn: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    titleAr: 'الحضور والانصراف',
    titleEn: 'Attendance',
    href: '/attendance',
    icon: Clock,
    adminOnly: false,
  },
  {
    titleAr: 'البيانات الشخصية',
    titleEn: 'Personal Profile',
    href: '/profile',
    icon: UserCheck,
    adminOnly: false,
  },
  {
    titleAr: 'تقديم إجازة / إذن / سلفة',
    titleEn: 'Requests',
    href: '/requests',
    icon: Calendar,
    adminOnly: false,
  },
  {
    titleAr: 'مراجعة الحضور والرواتب',
    titleEn: 'Attendance & Payroll',
    href: '/admin/attendance-review',
    icon: ClipboardCheck,
    adminOnly: true,
  },
  {
    titleAr: 'الموظفين',
    titleEn: 'Employees',
    href: '/admin/employees',
    icon: Users,
    adminOnly: true,
  },
  {
    titleAr: 'الفروع والورديات',
    titleEn: 'Branches & Shifts',
    href: '/admin/branches',
    icon: Building2,
    adminOnly: true,
  },
  {
    titleAr: 'الأدوار',
    titleEn: 'Roles',
    href: '/admin/roles',
    icon: Shield,
    adminOnly: true,
  },
  {
    titleAr: 'التوظيف واستمارات التقديم',
    titleEn: 'Recruitment',
    href: '/admin/recruitment',
    icon: Briefcase,
    adminOnly: true,
  },
  {
    titleAr: 'اعتماد الإجازات والطلبات',
    titleEn: 'Leave Approvals',
    href: '/admin/leave-requests',
    icon: CheckCircle2,
    adminOnly: true,
  },
];

export default function Sidebar({
  locale: propLocale,
  collapsed = false,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const params = useParams();

  const locale = propLocale || (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [, setUserName] = useState('');
  const [userRole, setUserRole] = useState('موظف');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load the authenticated user.');
        return response.json();
      })
      .then((data: {
        user?: {
          name?: string;
          role?: string;
          systemRole?: string;
          permissions?: unknown;
        };
      }) => {
        if (!active) return;
        const user = data.user;
        const role = user?.role || 'موظف';
        const permissions = Array.isArray(user?.permissions)
          ? user.permissions.filter((permission): permission is string => typeof permission === 'string')
          : [];
        setUserName(user?.name || '');
        setUserRole(role);
        setIsAdmin(
          user?.systemRole !== 'EMPLOYEE'
          && (user?.systemRole === 'SUPER_ADMIN' || permissions.length > 0)
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Failed to load sidebar permissions:', error);
        setIsAdmin(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    try {
      localStorage.clear();
      router.push(`/${locale}/login`);
      router.refresh();
    } catch (error) {
      console.error('Failed to clear local session data:', error);
      router.push(`/${locale}/login`);
    }
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!item.adminOnly) return true;
    return isAdmin;
  });
  const closeMobileSidebar = () => onMobileOpenChange?.(false);

  return (
    <>
      {mobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        } z-50 w-72 flex-col justify-between border-violet-950/10 bg-white text-[#0a0814] transition-all duration-300 ease-in-out dark:border-[#c4b2ff]/15 dark:bg-[#0a0814] dark:text-[#f6f0ff] lg:static lg:z-auto lg:flex ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } ${
          mobileOpen
            ? 'flex translate-x-0'
            : isRtl
            ? 'hidden translate-x-full lg:translate-x-0'
            : 'hidden -translate-x-full lg:translate-x-0'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* الترويسة والشعار */}
        <div className="flex flex-col border-b border-violet-950/10 p-4 dark:border-[#c4b2ff]/15">
          <Link
            href={`/${locale}/profile`}
            prefetch
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} group cursor-pointer`}
            title="البيانات الشخصية"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#46f4ff] via-[#9d6bff] to-[#ff2bd6] p-1.5 shadow-md shadow-[#9d6bff]/20 transition-transform group-hover:scale-105">
              <img
                src="/Logo.png"
                alt="L-K Shift Logo"
                className="h-full w-full object-contain filter drop-shadow-sm brightness-110"
              />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="truncate text-base font-black tracking-wide text-[#0a0814] transition group-hover:text-[#9d6bff] dark:text-[#f6f0ff]">
                  L-K Shift
                </h2>
                <span className="inline-block rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-[#6e42bd] dark:text-[#c9c0e8]">
                  {userRole || 'موظف'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* روابط التنقل */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const fullHref = `/${locale}${item.href}`;
            const isActive =
              pathname === fullHref ||
              (item.href !== '/admin/dashboard' &&
                item.href !== '/attendance' &&
                pathname.startsWith(fullHref));

            return (
              <Link
                key={item.href}
                href={fullHref}
                prefetch
                onClick={closeMobileSidebar}
                title={collapsed ? (isRtl ? item.titleAr : item.titleEn) : undefined}
                className={`flex items-center ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
                } rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'sonomir-iridescent text-[#050309] shadow-lg shadow-[#9d6bff]/20 font-black'
                    : 'text-[#433b5c] hover:bg-violet-50 hover:text-[#0a0814] dark:text-[#c9c0e8] dark:hover:bg-[#1a1530] dark:hover:text-[#f6f0ff]'
                }`}
              >
                <Icon
                  size={19}
                  className={isActive ? 'text-[#050309]' : 'text-[#756c91] group-hover:text-[#0a0814] dark:text-[#c9c0e8] dark:group-hover:text-[#f6f0ff]'}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{isRtl ? item.titleAr : item.titleEn}</span>
                    {isActive && <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* زر تسجيل الخروج */}
        <div className="border-t border-violet-950/10 p-3 dark:border-[#c4b2ff]/15">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? (isRtl ? 'تسجيل الخروج' : 'Sign Out') : undefined}
            className={`flex w-full items-center ${
              collapsed ? 'justify-center p-3' : 'justify-center gap-2.5 px-4 py-3'
            } rounded-2xl border border-rose-500/20 bg-rose-500/10 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer`}
          >
            <LogOut size={16} />
            {!collapsed && <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
