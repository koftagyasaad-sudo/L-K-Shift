'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { MobileBottomNav } from '@/components/layout/Sidebar';
import GlobalHeader from '@/components/global-header';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import LiveNotificationListener from '@/components/LiveNotificationListener';
import { syncOfflineAttendance } from '@/offlineSync';
import TopNavigationLoader from '@/components/layout/TopNavigationLoader';
import LaunchSplashScreen from '@/components/LaunchSplashScreen';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const params = useParams();
  const pathname = usePathname() || '';
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<'CHECKING' | 'AUTHORIZED' | 'UNAUTHORIZED'>('CHECKING');

  useEffect(() => {
    let active = true;

    const verifyStrictAuth = async () => {
      const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';
      const storedUserId = (localStorage.getItem('userId') || '').trim();
      const storedPhone = (localStorage.getItem('userPhone') || '').trim();

      // 1. Immediate block if device has no local login record at all
      if (!isAuthFlag || !storedUserId || !storedPhone) {
        if (active) {
          setAuthStatus('UNAUTHORIZED');
          window.location.replace(`/${locale}/login`);
        }
        return;
      }

      // 2. If offline, verify that this user actually exists in the encrypted SHA-256 offline vault
      if (!navigator.onLine) {
        try {
          const vaultRaw = localStorage.getItem('lk_offline_vault');
          const vault = vaultRaw ? JSON.parse(vaultRaw) : {};
          if (vault[storedPhone] && String(vault[storedPhone]?.user?.id) === storedUserId) {
            if (active) setAuthStatus('AUTHORIZED');
            return;
          }
        } catch {}
        if (active) {
          setAuthStatus('UNAUTHORIZED');
          window.location.replace(`/${locale}/login`);
        }
        return;
      }

      // 3. When online, verify active session & account approval status with the server
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) {
          throw new Error('Unauthorized session');
        }
        const data = await res.json();
        const serverUser = data?.user;
        if (!serverUser || !serverUser.id || serverUser.isActive === false) {
          throw new Error('No active server user');
        }
        if (active) {
          setAuthStatus('AUTHORIZED');
          void syncOfflineAttendance();
        }
      } catch {
        // Wipe invalid/expired session and force redirect to login
        const v = localStorage.getItem('lk_offline_vault');
        const b = localStorage.getItem('lk_cached_branches');
        localStorage.clear();
        if (v) localStorage.setItem('lk_offline_vault', v);
        if (b) localStorage.setItem('lk_cached_branches', b);
        if (active) {
          setAuthStatus('UNAUTHORIZED');
          window.location.replace(`/${locale}/login`);
        }
      }
    };

    void verifyStrictAuth();

    const runSyncWithRetry = () => {
      void syncOfflineAttendance();
      setTimeout(() => { void syncOfflineAttendance(); }, 2500);
      setTimeout(() => { void syncOfflineAttendance(); }, 7000);
    };
    const onOnline = () => { runSyncWithRetry(); };
    const periodicSync = setInterval(() => {
      if (navigator.onLine) void syncOfflineAttendance();
    }, 15000);
    window.addEventListener('online', onOnline);
    const saved = localStorage.getItem('lk_compact_view');
    const handleCompactEvent = () => {
      setCompactMode((prev) => {
        const next = !prev;
        localStorage.setItem('lk_compact_view', String(next));
        window.dispatchEvent(new CustomEvent('lk-compact-changed', { detail: next }));
        return next;
      });
    };
    window.addEventListener('lk-toggle-compact', handleCompactEvent);
    if (saved === 'true') {
      setCompactMode(true);
    }

    return () => {
      active = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('lk-toggle-compact', handleCompactEvent);
      clearInterval(periodicSync);
    };
  }, [locale, pathname]);

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    localStorage.setItem('lk_compact_view', String(next));
  };

  // Do NOT mount children (so AttendancePage NEVER requests Camera or GPS) until authStatus === 'AUTHORIZED'
  if (authStatus !== 'AUTHORIZED') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#181d23] text-white" dir={isRtl ? 'rtl' : 'ltr'}>
        <LaunchSplashScreen />
        <Loader2 className="h-7 w-7 animate-spin text-[#57cef8]" />
        <p className="mt-3 text-xs font-bold text-slate-300">جاري التحقق من تسجيل الدخول...</p>
      </div>
    );
  }

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
      
      <main className="app-main w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 pb-16 pt-3 sm:px-5 sm:pt-4 lg:px-7 lg:pb-8">
        {children}
      </main>
      <MobileBottomNav locale={locale} />
    </div>
  );
}
