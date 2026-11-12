'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { MobileBottomNav } from '@/components/layout/Sidebar';
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

  return (
    <div
      className="app-shell relative flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f8f9fa] text-slate-900 dark:bg-[#0c0d10] dark:text-zinc-100"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <TopNavigationLoader />
      {'\n'}
      <SplashScreen />
      {'\n'}
      <ServiceWorkerRegister />
      {'\n'}
      <GlobalHeader />
      {'\n'}
      <main className="app-main w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto px-4 pb-20 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10">
        {children}
      </main>
      {'\n'}
      <MobileBottomNav locale={locale} />
    </div>
  );
}
