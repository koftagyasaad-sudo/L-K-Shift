'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GlobalHeader from '@/components/global-header';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import SplashScreen from '@/components/SplashScreen';
import TopNavigationLoader from '@/components/layout/TopNavigationLoader';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="app-shell relative flex min-h-screen w-full min-w-0 max-w-full flex-row overflow-x-hidden bg-background text-foreground"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <TopNavigationLoader />
      {'\n'}
      {/* 1. شاشة البداية الاحترافية والأنيميشن الدائري */}
      <SplashScreen />

      {'\n'}
      {/* 2. تسجيل مشغل الخدمة للعمل أوفلاين 100% والإشعارات الخارجية */}
      <ServiceWorkerRegister />

      {'\n'}
      {/* 3. السايدبار المتكيف (يعرض الأيقونات فقط عند الطي) */}
      <Sidebar
        locale={locale}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      {'\n'}
      <aside
        aria-label="L-K Shift Core"
        className="hidden w-12 shrink-0 flex-col items-center justify-between border-e border-violet-950/10 bg-white/70 py-6 dark:border-[#c4b2ff]/10 dark:bg-[#050309] lg:flex"
      >
        <span
          className="rotate-180 text-[9px] font-black tracking-[0.22em] text-[#433b5c] dark:text-[#c9c0e8]"
          style={{ writingMode: 'vertical-rl' }}
        >
          L-K SHIFT · CORE
        </span>
        <span className="sonomir-iridescent h-20 w-1 animate-pulse rounded-full shadow-[0_0_16px_rgba(70,244,255,0.3)]" />
      </aside>

      {'\n'}
      {/* 4. منطقة العمل والمحتوى */}
      <div className="flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden transition-all duration-300">
        <GlobalHeader
          sidebarCollapsed={sidebarCollapsed}
          mobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={() => setMobileSidebarOpen((open) => !open)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="app-main w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
