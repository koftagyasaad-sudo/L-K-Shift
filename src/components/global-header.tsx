'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { Bell, CalendarDays, CheckCheck, Clock3, LogOut, ShieldAlert, UserRound, Volume2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopNav } from '@/components/layout/Sidebar';

interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext
      || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx?.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
  return sharedAudioCtx;
}

function playLoudNotificationAlert() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1046.5, 1567.98].forEach((frequency, index) => {
      const start = now + index * 0.22;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(index ? 0.9 : 0.8, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + (index ? 0.28 : 0.2));
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + (index ? 0.28 : 0.2));
    });
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([300, 150, 300]);
  } catch (error) {
    console.warn('Audio alert error:', error);
  }
}

function triggerSystemOSNotification(title: string, message: string) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body: message,
        icon: '/Logo.png',
        badge: '/Logo.png',
        tag: 'lk-shift-os-alert',
        requireInteraction: true,
      });
    }).catch(() => new Notification(title, { body: message, icon: '/Logo.png' }));
  } else {
    new Notification(title, { body: message, icon: '/Logo.png' });
  }
}

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';
  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const localizedPath = `/${nextLocale}${pathname.startsWith(`/${locale}/`) ? pathname.slice(locale.length + 1) : ''}`;

  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasAudioUnlocked, setHasAudioUnlocked] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef(-1);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole');
    if (storedName) setUserName(storedName);
    if (storedRole) setUserRole(storedRole);
    setHasAudioUnlocked(Boolean(localStorage.getItem('audio_notifications_unlocked')));
  }, []);

  const handleUnlockAudioAndPush = async () => {
    try {
      const ctx = getSharedAudioContext();
      if (ctx?.state === 'suspended') await ctx.resume();
      playLoudNotificationAlert();
      localStorage.setItem('audio_notifications_unlocked', 'true');
      setHasAudioUnlocked(true);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          triggerSystemOSNotification('L-K Shift Core', 'تم تفعيل التنبيهات الصوتية وإشعارات الهاتف بنجاح!');
        }
      }
    } catch (error) {
      console.warn('Unlock audio error:', error);
    }
  };

  const fetchNotifications = async () => {
    const currentUid = localStorage.getItem('userId');
    if (!currentUid) return;
    try {
      const response = await fetch(`/api/notifications?userId=${currentUid}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const items: NotificationItem[] = Array.isArray(data) ? data : [];
      setNotifications(items);
      const unreadCount = items.filter((item) => !item.isRead).length;
      if (prevUnreadCountRef.current !== -1 && unreadCount > prevUnreadCountRef.current) {
        playLoudNotificationAlert();
        const newest = items.find((item) => !item.isRead);
        if (newest) triggerSystemOSNotification(newest.title, newest.message);
      }
      prevUnreadCountRef.current = unreadCount;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: item.id }),
      });
      setNotifications((previous) => previous.map((notification) =>
        notification.id === item.id ? { ...notification, isRead: true } : notification
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    setShowNotifications(false);
    if (item.link) router.push(`/${locale}${item.link.startsWith('/') ? item.link : `/${item.link}`}`);
  };

  const handleMarkAllAsRead = async () => {
    const currentUid = localStorage.getItem('userId');
    if (!currentUid) return;
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: currentUid }),
      });
      if (!response.ok) throw new Error('Failed to mark notifications as read.');
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push(`/${locale}/login`);
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const getNotificationIcon = (type: string) => {
    if (type === 'ATTENDANCE' || type === 'PERMISSION') return <Clock3 size={16} className="text-slate-500" />;
    if (type === 'COMPLAINT') return <ShieldAlert size={16} className="text-slate-500" />;
    return <CalendarDays size={16} className="text-slate-500" />;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/80 backdrop-blur-xl text-slate-900 backdrop-blur dark:border-white/[0.08] dark:bg-[#11131A]/80 backdrop-blur-xl dark:text-zinc-100">
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-[1600px] items-center gap-3 px-3 sm:px-5 lg:px-8">
        <Link href={`/${locale}/admin/dashboard`} className="flex shrink-0 items-center gap-2" aria-label="L-K Shift">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 via-orange-600 to-rose-600 text-xs font-extrabold tracking-tight text-white shadow-md shadow-orange-500/25">
            LK
          </span>
          <span className="hidden bg-gradient-to-l from-slate-900 to-orange-700 bg-clip-text text-sm font-extrabold tracking-tight text-transparent dark:from-white dark:to-orange-400 sm:inline">L-K Shift</span>
        </Link>

        <DesktopNav locale={locale} />

        <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link
            href={localizedPath}
            className="inline-flex h-9 min-w-10 items-center justify-center rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:bg-[#1c1e24]"
            aria-label={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
            title={isRtl ? 'English' : 'العربية'}
          >
            {nextLocale.toUpperCase()}
          </Link>
          {!hasAudioUnlocked && (
            <button
              type="button"
              onClick={handleUnlockAudioAndPush}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:bg-[#1c1e24] sm:flex"
              title={isRtl ? 'تفعيل التنبيهات الصوتية' : 'Enable audio notifications'}
              aria-label={isRtl ? 'تفعيل التنبيهات الصوتية' : 'Enable audio notifications'}
            >
              <Volume2 size={16} />
            </button>
          )}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (!hasAudioUnlocked) void handleUnlockAudioAndPush();
                setShowNotifications((open) => !open);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-[#1c1e24]"
              title={isRtl ? 'الإشعارات' : 'Notifications'}
              aria-label={isRtl ? 'الإشعارات' : 'Notifications'}
              aria-expanded={showNotifications}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-orange-600 ring-2 ring-white dark:bg-orange-500 dark:ring-[#141519]" />
              )}
            </button>
            {showNotifications && (
              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                className="absolute end-0 top-full z-50 mt-2 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-lg dark:border-white/[0.08] dark:bg-[#141519] dark:text-zinc-300 sm:w-96"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-1 pb-2.5 dark:border-white/[0.08]">
                  <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {isRtl ? 'الإشعارات' : 'Notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllAsRead()}
                      className="flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-500"
                    >
                      <CheckCheck size={13} />
                      {isRtl ? 'تحديد الكل كمقروء' : 'Mark all read'}
                    </button>
                  )}
                </div>
                <div className="mt-1 flex max-h-80 flex-col divide-y divide-slate-100 overflow-y-auto dark:divide-white/[0.06]">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                      {isRtl ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
                    </div>
                  ) : notifications.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => void handleNotificationClick(item)}
                      className={`flex w-full items-start gap-3 rounded-lg p-3 text-start transition hover:bg-slate-50 dark:hover:bg-[#1c1e24] ${item.isRead ? 'opacity-70' : ''}`}
                    >
                      <span className="mt-0.5 shrink-0">{getNotificationIcon(item.type)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-slate-900 dark:text-zinc-100">{item.title}</span>
                          <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-500 dark:text-zinc-400">
                            {new Date(item.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                        <span className="mt-1 block break-words text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">{item.message}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((open) => !open)}
              className="flex h-9 items-center gap-2 rounded-lg px-2 text-start transition hover:bg-slate-100 dark:hover:bg-[#1c1e24]"
              aria-expanded={showUserMenu}
              aria-label={isRtl ? 'قائمة المستخدم' : 'User menu'}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-[#1c1e24] dark:text-zinc-200">
                <UserRound size={15} />
              </span>
              <span className="hidden max-w-32 truncate text-xs font-medium text-slate-700 dark:text-zinc-300 xl:block">{userName || userRole || (isRtl ? 'الحساب' : 'Account')}</span>
            </button>
            {showUserMenu && (
              <div className="absolute end-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/[0.08] dark:bg-[#141519]">
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setShowUserMenu(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-[#1c1e24]"
                >
                  {isRtl ? 'ملفي الشخصي' : 'My profile'}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-[#1c1e24]"
                >
                  <LogOut size={15} />
                  {isRtl ? 'تسجيل الخروج' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
