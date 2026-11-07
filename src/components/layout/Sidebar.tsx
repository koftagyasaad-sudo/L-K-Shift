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
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  locale?: string;
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
  },
  {
    titleAr: 'مراجعة الحضور والرواتب',
    titleEn: 'Attendance & Payroll',
    href: '/admin/attendance-review',
    icon: ClipboardCheck,
    adminOnly: true,
  },
  {
    titleAr: 'تقديم إجازة / إذن / سلفة',
    titleEn: 'Requests',
    href: '/requests',
    icon: Calendar,
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
  {
    titleAr: 'الملف الشخصي وبياناتي',
    titleEn: 'My Profile',
    href: '/profile',
    icon: User,
    adminOnly: false,
  },
];

export default function Sidebar({ locale: propLocale }: SidebarProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const params = useParams();

  const locale = propLocale || (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('مدير النظام');
  const [isAdmin, setIsAdmin] = useState(true);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName') || '';
      const storedRole = localStorage.getItem('userRole') || 'مدير النظام';
      const permsRaw = localStorage.getItem('userPermissions') || '[]';
      const perms: string[] = JSON.parse(permsRaw);

      setUserName(storedName);
      setUserRole(storedRole);

      const hasAdminPrivilege =
        perms.includes('*') ||
        storedRole === 'SUPER_ADMIN' ||
        storedRole === 'مدير النظام' ||
        storedRole === 'مدير فرع' ||
        perms.includes('dashboard.view');

      setIsAdmin(hasAdminPrivilege);
    } catch {
      setIsAdmin(true);
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.clear();
      router.push(`/${locale}/login`);
      router.refresh();
    } catch {
      window.location.href = `/${locale}/login`;
    }
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!item.adminOnly) return true;
    return isAdmin;
  });

  return (
    <>
      {/* فلتر برمجي لعزل وتفريغ الخلفية الداكنة على الواجهات الفاتحة دون التأثير على الأندرويد */}
      <svg className="sr-only" aria-hidden="true">
        <filter id="remove-dark-bg" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0.299 0.587 0.114 0 0"
          />
        </filter>
      </svg>

      {/* زر القائمة للشاشات الصغيرة */}
      <button
        type="button"
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="fixed top-4 right-4 z-50 rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-300 md:hidden shadow-lg cursor-pointer"
        aria-label="Toggle Menu"
      >
        {isOpenMobile ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* خلفية معتمة للموبايل */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        className={`fixed inset-y-0 ${
          isRtl ? 'right-0' : 'left-0'
        } z-40 flex w-72 flex-col justify-between border-slate-200 bg-white dark:border-white/5 dark:bg-[#0c0e18] ${
          isRtl ? 'border-l' : 'border-r'
        } transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile
            ? 'translate-x-0'
            : isRtl
            ? 'translate-x-full'
            : '-translate-x-full'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* الترويسة مع شعار L-K Shift بهوية متناسقة وأنيقة */}
        <div className="flex flex-col border-b border-slate-100 p-6 dark:border-white/5">
          <Link
            href={`/${locale}/profile`}
            className="flex items-center gap-3.5 group cursor-pointer"
            title="فتح الملف الشخصي"
          >
            {/* حاوية الشعار المتناسقة */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 p-1.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <img
                src="/Logo.png"
                alt="L-K Shift Logo"
                className="h-full w-full object-contain filter drop-shadow-sm brightness-110"
              />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-slate-900 dark:text-white group-hover:text-orange-600 transition">
                L-K Shift
              </h2>
              <span className="inline-block rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                {userRole || 'مدير النظام'}
              </span>
            </div>
          </Link>
        </div>

        {/* قائمة الروابط وبداخلها رابط الملف الشخصي */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 custom-scrollbar">
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
                onClick={() => setIsOpenMobile(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/20 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                />
                <span className="flex-1">{isRtl ? item.titleAr : item.titleEn}</span>
                {isActive && <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />}
              </Link>
            );
          })}
        </div>

        {/* زر تسجيل الخروج */}
        <div className="border-t border-slate-100 p-4 dark:border-white/5">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
