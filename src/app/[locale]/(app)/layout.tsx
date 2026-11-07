'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Moon, Sun, LogOut, ChevronRight, Menu } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userName, setUserName] = useState('عمر محمد سعيد عبدالحليم');
  const [userRole, setUserRole] = useState('مدير النظام');
  const [isDark, setIsDark] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');
      if (storedName) setUserName(storedName);
      if (storedRole) setUserRole(storedRole);
    } catch (e) {}
  }, []);

  const handleLogout = () => {
    try {
      localStorage.clear();
      router.push(`/${locale}/login`);
    } catch {
      window.location.href = `/${locale}/login`;
    }
  };

  const firstLetter = userName ? userName.trim().charAt(0) : 'ع';

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-[#080911] text-slate-900 dark:text-white flex ${
        isRtl ? 'flex-row-reverse' : 'flex-row'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 1. القائمة الجانبية */}
      {!sidebarCollapsed && <Sidebar locale={locale} />}

      {/* 2. منطقة العمل والمحتوى */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* الشريط العلوي المعتمد */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md dark:border-white/5 dark:bg-[#0c0e18]/90">
          {/* الجانب الأيمن: زر طي القائمة + اسم الموظف ودائرته مربوطان بصفحة البروفايل */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 transition cursor-pointer"
              title="طي / فتح القائمة الجانبية"
            >
              <ChevronRight
                size={18}
                className={`transition-transform duration-200 ${
                  isRtl
                    ? sidebarCollapsed
                      ? ''
                      : 'rotate-180'
                    : sidebarCollapsed
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>

            {/* الضغط على الاسم أو الدائرة ينقل المستخدم مباشرة لصفحة البروفايل */}
            <Link
              href={`/${locale}/profile`}
              className="flex items-center gap-3 rounded-2xl p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer group"
              title="اضغط لفتح الملف الشخصي وتغيير الباسورد واستمارة HR"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                {firstLetter}
              </div>
              <div className="text-right">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition">
                  {userName}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                  {userRole}
                </span>
              </div>
            </Link>
          </div>

          {/* الجانب الأيسر: زر الثيم وزر الخروج */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-amber-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 transition cursor-pointer"
              title="تبديل المظهر"
            >
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
            >
              <LogOut size={13} />
              <span>خروج</span>
            </button>
          </div>
        </header>

        {/* 3. محتوى الصفحات */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
