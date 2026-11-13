'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MobileBottomNav } from '@/components/layout/Sidebar';
import GlobalHeader from '@/components/global-header';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import TopNavigationLoader from '@/components/layout/TopNavigationLoader';
import { Eye, EyeOff } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';
  const [compactMode, setCompactMode] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('lk_compact_view');
    if (saved !== null) {
      setCompactMode(saved === 'true');
    }
  }, []);

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    localStorage.setItem('lk_compact_view', String(next));
  };

  return (
    <div
      className={`app-shell ${compactMode ? 'lk-compact-view' : 'lk-expanded-view'} relative flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f2f3f5] text-slate-900 dark:bg-[#181d23] dark:text-zinc-100`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <TopNavigationLoader />
      <ServiceWorkerRegister />
      <GlobalHeader />
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-end px-3 pt-2 sm:px-5 lg:px-8">
        <button
          type="button"
          onClick={toggleCompact}
          className="inline-flex items-center gap-1.5 rounded border border-[#57cef8]/50 bg-white px-2.5 py-1 text-[11px] font-bold text-[#3a4149] shadow-xs transition hover:bg-[#57cef8] hover:text-white dark:bg-[#232a32] dark:text-[#57cef8] dark:hover:bg-[#57cef8] dark:hover:text-[#181d23]"
        >
          {compactMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span>{compactMode ? (isRtl ? 'إظهار كافة التفاصيل والصفوف' : 'Show all details') : (isRtl ? 'ضغط الصفحة في شاشة واحدة' : 'Compact one-page view')}</span>
        </button>
      </div>
      <main className="app-main w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 pb-16 pt-2 sm:px-5 sm:pt-3 lg:px-7 lg:pb-8">
        {children}
      </main>
      <MobileBottomNav locale={locale} />
    </div>
  );
}
