'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GlobalHeader from '@/components/global-header';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import SplashScreen from '@/components/SplashScreen';
import TopNavigationLoader from '@/components/layout/TopNavigationLoader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-row relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <TopNavigationLoader />
      {/* 1. شاشة البداية الاحترافية والأنيميشن الدائري */}
      <SplashScreen />

      {/* 2. تسجيل مشغل الخدمة للعمل أوفلاين 100% والإشعارات الخارجية */}
      <ServiceWorkerRegister />

      {/* 3. السايدبار المتكيف (يعرض الأيقونات فقط عند الطي) */}
      <Sidebar
        locale={locale}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      {/* 4. منطقة العمل والمحتوى */}
      <div className="flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden transition-all duration-300">
        <GlobalHeader
          sidebarCollapsed={sidebarCollapsed}
          mobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={() => setMobileSidebarOpen((open) => !open)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
