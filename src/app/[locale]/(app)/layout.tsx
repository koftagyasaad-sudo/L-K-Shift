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
    setUserName(savedName);
    setUserRole(savedRole);

    // استرجاع تفضيل طي القائمة من الذاكرة المحلية
    const savedCollapsed = localStorage.getItem('isSidebarCollapsed') === 'true';
    setIsSidebarCollapsed(savedCollapsed);

    const isAdmin = savedRole === 'مدير النظام' || savedRole === 'SUPER_ADMIN' || savedRole === 'admin';

    // حارس المسارات (Route Guard): حظر أي مسار إداري عن الموظف العادي
    const isRestrictedAdminRoute =
      pathname.includes('/admin/dashboard') ||
      pathname.includes('/admin/employees') ||
      pathname.includes('/admin/branches') ||
      pathname.includes('/admin/roles');

    if (!isAdmin && isRestrictedAdminRoute) {
      router.replace(`/${locale}/attendance`); return; }  const savedTheme = (localStorage.getItem('theme') as 'dark' \vert{} 'light') \vert{}\vert{} 'dark'; setTheme(savedTheme); if (savedTheme === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }  setIsReady(true); }, [locale, pathname, router]);  // إغلاق قائمة الهاتف تلقائياً عند تغيير الصفحة useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);  // تبديل طي/توسيع القائمة الجانبية وحفظ الحالة const toggleSidebarCollapse = () => { setIsSidebarCollapsed((prev) => { const next = !prev; localStorage.setItem('isSidebarCollapsed', String(next)); return next; }); };  const toggleTheme = () => { const nextTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(nextTheme); localStorage.setItem('theme', nextTheme); if (nextTheme === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } };  const isDark = theme === 'dark'; const isAdmin = userRole === 'مدير النظام' \vert{}\vert{} userRole === 'SUPER_ADMIN' \vert{}\vert{} userRole === 'admin';  // قوائم النظام المحددة وفقاً للصلاحيات const navItems = isAdmin ? [ { name: isRtl ? 'لوحة التحكم' : 'Dashboard', href: `/${locale}/admin/dashboard`,
          icon: (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
        {
          name: isRtl ? 'الحضور والانصراف' : 'Attendance',
          href: `/${locale}/attendance`, icon: ( <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> ), }, { name: isRtl ? 'الموظفين' : 'Employees', href: `/${locale}/admin/employees`,
          icon: (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: isRtl ? 'الفروع' : 'Branches',
          href: `/${locale}/admin/branches`, icon: ( <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> </svg> ), }, { name: isRtl ? 'الأدوار' : 'Roles', href: `/${locale}/admin/roles`,
          icon: (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
        {
          name: isRtl ? 'مراجعة الحضور' : 'Attendance Review',
          href: `/${locale}/admin/attendance-review`, icon: ( <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> </svg> ), }, ] : [ { name: isRtl ? 'تسجيل الحضور' : 'Check-In/Out', href: `/${locale}/attendance`,
          icon: (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          name: isRtl ? 'فرعي وفريق العمل' : 'My Branch Staff',
          href: `/${locale}/employee/my-branch`, icon: ( <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> </svg> ), }, { name: isRtl ? 'سجل حضوري وإجازاتي' : 'My Attendance & Leaves', href: `/${locale}/admin/attendance-review`,
          icon: (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
      ];

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
      {/* 1. خلفية تعتيم ناعمة لشاشة الهاتف */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* 2. القائمة الجانبية (Sidebar & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 z-50 flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${
          isRtl ? 'right-0' : 'left-0'
        } ${ // على شاشات الكمبيوتر: التبديل بين 80px (طي) و 256px (توسيع) isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64' } ${
          // على شاشات الهاتف: مخفية تماماً وخارج الحسابات لمنع الـ Zoom-Out
          isMobileMenuOpen
            ? 'w-72 translate-x-0'
            : isRtl
            ? 'translate-x-full max-lg:invisible max-lg:pointer-events-none lg:translate-x-0'
            : '-translate-x-full max-lg:invisible max-lg:pointer-events-none lg:translate-x-0'
        } ${ isDark ? 'border-white/5 bg-[#101322]' : 'border-slate-200 bg-white text-slate-800' } ${isRtl ? 'border-l' : 'border-r'}`}
      >
        {/* رأس القائمة */}
        <div
          className={`flex h-20 items-center justify-between px-5 border-b shrink-0 ${
            isDark ? 'border-white/5' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white font-black text-lg shadow-lg shadow-orange-500/20">
              LK
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="overflow-hidden">
                <h1 className={`text-base font-extrabold tracking-wide truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  L-K Shift
                </h1>
                <p className={`text-[10px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isAdmin ? (isRtl ? 'إدارة المنظومة' : 'Core Admin') : (isRtl ? 'بوابة الموظف' : 'Staff Portal')}
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

        {/* روابط التنقل */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${ isActive ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/25' : isDark ? 'text-slate-400 hover:bg-white/[0.04] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' } ${isSidebarCollapsed && !isMobileMenuOpen ? 'lg:justify-center lg:px-0' : ''}`}
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

        {/* زر طي وتوسيع القائمة للكمبيوتر */}
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
            {isSidebarCollapsed ? (
              <span>{isRtl ? '«' : '»'}</span>
            ) : (
              <span>{isRtl ? '« طي القائمة' : 'Collapse Sidebar »'}</span>
            )}
          </button>
        </div>
      </aside>

      {/* 3. مساحة الصفحة الرئيسية: تتمدد وتنكمش تلقائياً عند طي القائمة */}
      <div
        className={`flex min-h-screen
