'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GlobalHeader from '@/components/global-header';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  // حالة طي السايدبار (تجعله شريط مصغر بالأيقونات بدلاً من إخفائه)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-row"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <ServiceWorkerRegister />

      {/* 1. السايدبار (يعرض الأيقونات فقط عند الطي) */}
      <Sidebar locale={locale} collapsed={sidebarCollapsed} />

      {/* 2. منطقة العمل والمحتوى */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <GlobalHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
