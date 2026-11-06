'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function AppLayout({ children, params }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true') {
      router.replace(`/${locale}/login`);
      return;
    }

    const savedName = localStorage.getItem('userName') || 'مستخدم المنظومة';
    const savedRole = localStorage.getItem('userRole') || 'موظف';
    let perms: string[] = [];
    try {
      perms = JSON.parse(localStorage.getItem('userPermissions') || '[]');
    } catch {
      perms = [];
    }

    setUserName(savedName);
    setUserRole(savedRole);
    setUserPermissions(perms);

    const isSuper = perms.includes('*') || savedRole === 'مدير النظام' || savedRole === 'SUPER_ADMIN';

    // حظر المسارات الحساسة عن غير المصرح لهم
    if (!isSuper) {
      if (pathname.includes('/admin/dashboard') && !perms.includes('dashboard.view')) {
        router.replace(`/${locale}/attendance`);
        return;
      }
      if (pathname.includes('/admin/employees') && !perms.includes('employees.view')) {
        router.replace(`/${locale}/attendance`);
        return;
      }
      if (pathname.includes('/admin/branches') && !perms.includes('branches.view')) {
        router.replace(`/${locale}/attendance`);
        return;
      }
      if (pathname.includes('/admin/roles') && !perms.includes('roles.manage')) {
        router.replace(`/${locale}/attendance`);
        return;
      }
      if (pathname.includes('/admin/recruitment') && !perms.includes('recruitment.manage')) {
        router.replace(`/${locale}/attendance`);
        return;
      }
      if (pathname.includes('/admin/leave-requests') && !perms.includes('requests.review')) {
        router.replace(`/${locale}/attendance`);
        return;
      }
    }

    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setIsReady(true);
  }, [locale, pathname, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isDark = theme === 'dark';
  const isSuper = userPermissions.includes('*') || userRole === 'مدير النظام' || userRole === 'SUPER_ADMIN';

  // القوائم المسموحة
  const allowedNavItems = [];

  if (isSuper || userPermissions.includes('dashboard.view')) {
    allowedNavItems.push({
      name: isRtl ? 'لوحة التحكم' : 'Dashboard',
      href: `/${locale}/admin/dashboard`,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    });
  }

  // 1. تسجيل الحضور (متاح دائماً)
  allowedNavItems.push({
    name: isRtl ? 'الحضور والانصراف' : 'Attendance',
    href: `/${locale}/attendance`,
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  });

  // 2. مراجعة الحضور ومسير الرواتب
  allowedNavItems.push({
    name: isSuper ? (isRtl ? 'مراجعة الحضور والرواتب' : 'Attendance & Payroll') : (isRtl ? 'سجل حضورك' : 'My Attendance Logs'),
    href: `/${locale}/admin/attendance-review`,
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  });

  // 3. تقديم الإجازات والأذونات والسلف
  allowedNavItems.push({
    name: isRtl ? 'تقديم إجازة / إذن / سلفة' : 'Requests & Leaves',
    href: `/${locale}/requests`,
    icon: (
      <svg className="h-5 w-5 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  });

  if (isSuper || userPermissions.includes('employees.view')) {
    allowedNavItems.push({
      name: isRtl ? 'الموظفين' : 'Employees',
      href: `/${locale}/admin/employees`,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    });
  }

  if (isSuper || userPermissions.includes('branches.view')) {
    allowedNavItems.push({
      name: isRtl ? 'الفروع والورديات' : 'Branches & Shifts',
      href: `/${locale}/admin/branches`,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    });
  }

  if (isSuper || userPermissions.includes('roles.manage')) {
    allowedNavItems.push({
      name: isRtl ? 'الأدوار' : 'Roles',
      href: `/${locale}/admin/roles`,
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    });
  }

  if (isSuper || userPermissions.includes('recruitment.manage')) {
    allowedNavItems.push({
      name: isRtl ? 'التوظيف واستمارات التقديم' : 'Recruitment & CVs',
      href: `/${locale}/admin/recruitment`,
      icon: (
        <svg className="h-5 w-5 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    });
  }

  if (isSuper || userPermissions.includes('requests.review')) {
    allowedNavItems.push({
      name: isRtl ? 'اعتماد الإجازات والطلبات' : 'Leave Approvals',
      href: `/${locale}/admin/leave-requests`,
      icon: (
        <svg className="h-5 w-5 shrink-0 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#080911] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* القائمة الجانبية (Sidebar) مع اللوجو الحقيقي */}
      <aside
        className={`fixed inset-y-0 z-50 flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${
          isRtl ? 'right-0' : 'left-0'
        } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} ${
          isMobileMenuOpen
            ? 'w-72 translate-x-0'
            : isRtl
            ? 'translate-x-full max-lg:invisible max-lg:pointer-events-none lg:translate-x-0'
            : '-translate-x-full max-lg:invisible max-lg:pointer-events-none lg:translate-x-0'
        } ${
          isDark
            ? 'border-white/5 bg-[#101322]'
            : 'border-slate-200 bg-white text-slate-800'
        } ${isRtl ? 'border-l' : 'border-r'}`}
      >
        {/* هيدر القائمة مع اللوجو الحقيقي */}
        <div
          className={`flex h-20 items-center justify-between px-4 border-b shrink-0 ${
            isDark ? 'border-white/5' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* اللوجو الحقيقي المرفوع Logo.png */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/40 p-1 border border-white/10 shadow-md">
              <img
                src="/Logo.png"
                alt="L-K Shift Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  // في حال تعذر قراءة مسار الصورة
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="overflow-hidden">
                <h1 className={`text-base font-extrabold tracking-wide truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  L-K Shift
                </h1>
                <p className={`text-[10px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {userRole}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto overflow-x-hidden">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/25'
                    : isDark
                    ? 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${isSidebarCollapsed && !isMobileMenuOpen ? 'lg:justify-center lg:px-0' : ''}`}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                {item.icon}
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`hidden lg:block border-t p-3 shrink-0 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
              isDark
                ? 'border border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isSidebarCollapsed ? <span>{isRtl ? '«' : '»'}</span> : <span>{isRtl ? '« طي القائمة' : 'Collapse Sidebar »'}</span>}
          </button>
        </div>
      </aside>

      {/* مساحة المحتوى */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out min-w-0 ${
          isSidebarCollapsed
            ? isRtl ? 'lg:mr-20' : 'lg:ml-20'
            : isRtl ? 'lg:mr-64' : 'lg:ml-64'
        } max-lg:mr-0 max-lg:ml-0 overflow-x-hidden`}
      >
        <header
          className={`sticky top-0 z-30 flex h-20 items-center justify-between border-b px-4 sm:px-6 backdrop-blur-xl transition-colors duration-300 ${
            isDark
              ? 'border-white/5 bg-[#080911]/80 text-white'
              : 'border-slate-200 bg-white/80 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition lg:hidden ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-white hover:bg-white/10'
                  : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className={`hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <svg
                className={`h-5 w-5 transition-transform duration-300 ${
                  isSidebarCollapsed ? (isRtl ? 'rotate-180' : '') : isRtl ? '' : 'rotate-180'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 font-bold text-white shadow-md text-sm sm:text-base">
                {userName ? userName.charAt(0) : 'U'}
              </div>
              <div className="text-right" dir={isRtl ? 'rtl' : 'ltr'}>
                <h2 className={`text-xs sm:text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {userName}
                </h2>
                <span className="text-[10px] sm:text-[11px] font-medium text-emerald-500">{userRole}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-amber-400 hover:bg-white/[0.08]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                router.replace(`/${locale}/login`);
              }}
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
            >
              {isRtl ? 'خروج' : 'Logout'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
