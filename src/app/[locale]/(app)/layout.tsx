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
  const [userName, setUserName] = useState<string>('Omar Abd Elhalim');
  const [userRole, setUserRole] = useState<string>('مدير النظام');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // مزامنة حالة المصادقة والثيم مع عنصر HTML الجذري
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true') {
      router.replace(`/${locale}/login`);
    }

    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    if (savedName) setUserName(savedName);
    if (savedRole) setUserRole(savedRole);

    // تفعيل كلاس dark على جذر الصفحة (HTML) فور التحميل
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [locale, router]);

  // دالة تبديل المظهر وتحديث محرك الـ CSS الجذري
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

  const navItems = [
    {
      name: isRtl ? 'لوحة التحكم' : 'Dashboard',
      href: `/${locale}/admin/dashboard`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: isRtl ? 'الحضور والانصراف' : 'Attendance',
      href: `/${locale}/attendance`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: isRtl ? 'الموظفين' : 'Employees',
      href: `/${locale}/admin/employees`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: isRtl ? 'الفروع' : 'Branches',
      href: `/${locale}/admin/branches`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: isRtl ? 'الأدوار' : 'Roles',
      href: `/${locale}/admin/roles`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: isRtl ? 'مراجعة الحضور' : 'Attendance Review',
      href: `/${locale}/admin/attendance-review`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#080911] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* القائمة الجانبية (Sidebar) */}
      <aside
        className={`fixed inset-y-0 z-40 flex flex-col shadow-2xl transition-all duration-300 ${
          isRtl ? 'right-0' : 'left-0'
        } ${isSidebarCollapsed ? 'w-20' : 'w-64'} ${
          isDark
            ? 'border-white/5 bg-gradient-to-b from-[#101322] via-[#0d0f1b] to-[#080911]'
            : 'border-slate-200 bg-white text-slate-800'
        } ${isRtl ? 'border-l' : 'border-r'}`}
      >
        <div
          className={`flex h-20 items-center justify-between px-5 border-b ${
            isDark ? 'border-white/5' : 'border-slate-200'
          }`}
        >
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white font-black text-lg shadow-lg shadow-orange-500/20">
                LK
              </div>
              <div>
                <h1 className={`text-base font-extrabold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  L-K Shift
                </h1>
                <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isRtl ? 'نظام الحضور والورديات' : 'Attendance & Shifts'}
                </p>
              </div>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white font-black text-lg shadow-lg">
              LK
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href.includes('/dashboard') && pathname === `/${locale}/admin`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/25'
                    : isDark
                    ? 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <span
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive
                      ? 'text-white'
                      : isDark
                      ? 'text-slate-400 group-hover:text-white'
                      : 'text-slate-500 group-hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t p-3 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition ${
              isDark
                ? 'border border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{isSidebarCollapsed ? '»' : isRtl ? '« طي القائمة' : 'Collapse »'}</span>
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى ورأس الصفحة العلوي */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${
          isSidebarCollapsed
            ? isRtl ? 'mr-20' : 'ml-20'
            : isRtl ? 'mr-64' : 'ml-64'
        }`}
      >
        {/* الشريط العلوي (Header) */}
        <header
          className={`sticky top-0 z-30 flex h-20 items-center justify-between border-b px-6 backdrop-blur-xl transition-colors duration-300 ${
            isDark
              ? 'border-white/5 bg-[#080911]/80 text-white'
              : 'border-slate-200 bg-white/80 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 font-bold text-white shadow-md">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:block text-right" dir={isRtl ? 'rtl' : 'ltr'}>
              <h2 className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {userName}
              </h2>
              <span className="text-[11px] font-medium text-emerald-500">{userRole}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* زر تبديل الثيم المطور */}
            <button
              onClick={toggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-amber-400 hover:bg-white/[0.08]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDark ? (isRtl ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode') : (isRtl ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* زر تبديل اللغة */}
            <Link
              href={isRtl ? `/en${pathname.replace('/ar', '')}` : `/ar${pathname.replace('/en', '')}`}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isRtl ? 'EN' : 'عربي'}
            </Link>

            {/* زر تسجيل الخروج */}
            <button
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                router.replace(`/${locale}/login`);
              }}
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition"
            >
              {isRtl ? 'خروج' : 'Logout'}
            </button>
          </div>
        </header>

        {/* مساحة الرندر الرئيسية */}
        <main className="flex-1 p-6 sm:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
