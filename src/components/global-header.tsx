'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { LogOut, Moon, Sun, ChevronRight, ChevronLeft } from 'lucide-react';

interface GlobalHeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function GlobalHeader({ onToggleSidebar, sidebarCollapsed }: GlobalHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userName, setUserName] = useState('عمر محمد سعيد عبدالحليم');
  const [userRole, setUserRole] = useState('مدير النظام');
  const [isDark, setIsDark] = useState(true);

  // تفعيل الثيم وقراءة القيمة المحفوظة مسبقاً
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');
      if (storedName) setUserName(storedName);
      if (storedRole) setUserRole(storedRole);

      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }
    } catch {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // دالة تبديل الثيم مع تطبيق التغيير فوراً وحفظه
  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch {}
    }
  };

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md dark:border-white/5 dark:bg-[#0c0e18]/90">
      {/* الجانب الأيمن: زر طي القائمة + اسم الموظف ودائرته مربوطان بصفحة البروفايل */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
            title="طي / فتح القائمة الجانبية"
          >
            {isRtl ? (
              sidebarCollapsed ? <ChevronLeft size={17} /> : <ChevronRight size={17} />
            ) : (
              sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />
            )}
          </button>
        )}

        {/* الضغط على الاسم أو الدائرة يفتح صفحة البروفايل فوراً */}
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-3 rounded-2xl p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer group"
          title="اضغط هنا لفتح الملف الشخصي وتغيير الباسورد واستمارة HR"
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

      {/* الجانب الأيسر: زر الثيم الهادئ البسيط وزر الخروج */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          title={isDark ? 'تفعيل المظهر النهاري' : 'تفعيل المظهر الليلي'}
          aria-label="تبديل المظهر"
        >
          {isDark ? (
            <Sun size={16} strokeWidth={1.75} />
          ) : (
            <Moon size={16} strokeWidth={1.75} />
          )}
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
  );
}
