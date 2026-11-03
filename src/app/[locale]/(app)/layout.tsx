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

  // فحص المصادقة المحلي السريع
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true') {
      router.replace(`/${locale}/login`);
    }
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    if (savedName) setUserName(savedName);
    if (savedRole) setUserRole(savedRole);
  }, [locale, router]);

  // شبكة الروابط المعمارية المعتمدة للمنظومة بالكامل
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
      href: `/${locale}/admin/attendance`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#080911] text-slate-100" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* القائمة الجانبية (Sidebar) المتناسقة مع هوية L-K Shift */}
      <aside
        className={`fixed inset-y-0 z-40 flex flex-col border-white/5 bg-gradient-to-b from-[#101322] via-[#0d0f1b] to-[#080911] shadow-2xl transition-all duration-300 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        } ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* اللوجو واسم النظام */}
        <div className="flex h-20 items-center justify-between px-5 border-b border-white/5">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white font-black text-lg shadow-lg shadow-orange-500/20">
                LK
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-wide text-white">L-K Shift</h1>
                <p className="text-[10px] text-slate-400 font-medium">
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

        {/* روابط التنقل الرئيسية */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href.includes('/dashboard') && pathname === `/${locale}/admin`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/25'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* زر طي القائمة في الأسفل */}
        <div className="border-t border-white/5 p-3">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] py-2.5 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition"
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
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#080911]/80 px-6 backdrop-blur-xl">
          {/* بيانات المستخدم المسجل */}
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 font-bold text-white shadow-md">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:block text-right" dir={isRtl ? 'rtl' : 'ltr'}>
              <h2 className="text-sm font-bold text-white leading-tight">{userName}</h2>
              <span className="text-[11px] font-medium text-emerald-400">{userRole}</span>
            </div>
          </div>

          {/* تبديل اللغة والإشعارات */}
          <div className="flex items-center gap-3">
            <Link
              href={isRtl ? `/en${pathname.replace('/ar', '')}` : `/ar${pathname.replace('/en', '')}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition"
            >
              {isRtl ? 'EN' : 'عربي'}
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                router.replace(`/${locale}/login`);
              }}
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
            >
              {isRtl ? 'خروج' : 'Logout'}
            </button>
          </div>
        </header>

        {/* مساحة الرندر الرئيسية للصفحات */}
        <main className="flex-1 p-6 sm:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
