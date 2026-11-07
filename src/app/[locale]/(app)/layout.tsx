'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GlobalHeader from '@/components/global-header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#080911] text-slate-900 dark:text-white flex flex-row"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 1. القائمة الجانبية (تظهر طبيعياً على اليمين في واجهة العربي) */}
      {!sidebarCollapsed && <Sidebar locale={locale} />}

      {/* 2. منطقة العمل والشاشات (على اليسار) */}
      <div className="flex-1 flex flex-col min-w-0">
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
