'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MobileBottomNav } from '@/components/layout/Sidebar';
import GlobalHeader from '@/components/global-header';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import LiveNotificationListener from '@/components/LiveNotificationListener';
import { syncOfflineAttendance } from '@/offlineSync';
import TopNavigationLoader from '@/components/layout/TopNavigationLoader';
import LaunchSplashScreen from '@/components/LaunchSplashScreen';
import { Eye, EyeOff } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';
  const [compactMode, setCompactMode] = useState<boolean>(false);

  useEffect(() => {
    void syncOfflineAttendance();
    const onOnline = () => { void syncOfflineAttendance(); };
    window.addEventListener('online', onOnline);
    const saved = localStorage.getItem('lk_compact_view');
    if (saved === 'true') {
      setCompactMode(true);
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
      <LaunchSplashScreen />
      <TopNavigationLoader />
      <ServiceWorkerRegister />
      <LiveNotificationListener />
      <GlobalHeader />
      {/* Subtle icon-only toggle at top-left/right below header (z-10 so it NEVER covers any modal) */}
      <button
        type="button"
        onClick={toggleCompact}
        title={compactMode ? 'إظهار كافة التفاصيل' : 'ضغط الصفحة'}
        aria-label={compactMode ? 'إظهار كافة التفاصيل' : 'ضغط الصفحة'}
        className="fixed top-[3.75rem] end-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#57cef8]/50 bg-white/90 text-[#3a4149] shadow-xs transition hover:bg-[#57cef8] hover:text-white dark:bg-[#232a32]/90 dark:text-[#57cef8]"
      >
        {compactMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <main className="app-main w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 pb-16 pt-3 sm:px-5 sm:pt-4 lg:px-7 lg:pb-8">
        {children}
      </main>
      <MobileBottomNav locale={locale} />
    </div>
  );
}
