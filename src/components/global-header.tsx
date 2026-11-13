'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { Bell, CalendarDays, CheckCheck, Clock3, LogOut, ShieldAlert, UserRound, Volume2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopNav } from '@/components/layout/Sidebar';

interface NotificationItem {
  id: string | number;
  userId?: string | number;
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
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(index ? 0.55 : 0.45, start);
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
        icon: '/Logo.png?v=25',
        badge: '/Logo.png?v=25',
        tag: 'lk-shift-os-alert',
        requireInteraction: true,
      });
    }).catch(() => new Notification(title, { body: message, icon: '/Logo.png?v=25' }));
  } else {
    new Notification(title, { body: message, icon: '/Logo.png?v=25' });
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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasAudioUnlocked, setHasAudioUnlocked] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef(-1);

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || '';
    const storedRole = localStorage.getItem('userRole') || '';
    const storedAvatar = localStorage.getItem('userAvatar') || '';
    if (storedName) setUserName(storedName);
    if (storedRole) setUserRole(storedRole);
    if (storedAvatar) setAvatarUrl(storedAvatar);
    setHasAudioUnlocked(Boolean(localStorage.getItem('audio_notifications_unlocked')));

    // Live sync of user name & profile photo from backend
    async function syncHeaderProfile() {
      try {
        const res = await fetch('/api/profile/update', { cache: 'no-store', credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.fullName) {
            setUserName(data.fullName);
            localStorage.setItem('userName', data.fullName);
          }
          if (data?.avatarUrl) {
            setAvatarUrl(data.avatarUrl);
            localStorage.setItem('userAvatar', data.avatarUrl);
          }
        }
      } catch {}
    }
    void syncHeaderProfile();
  }, [pathname]);

  const firstName = (userName || '').trim().split(/\s+/)[0] || (isRtl ? 'حسابي' : 'Account');

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
          triggerSystemOSNotification('L-K Shift', 'تم تفعيل التنبيهات الصوتية وإشعارات الهاتف بنجاح!');
        }
      }
    } catch (error) {
      console.warn('Unlock audio error:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store', credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      const items: NotificationItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
        ? data.notifications
        : [];
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
        credentials: 'include',
        body: JSON.stringify({ id: item.id, notificationId: item.id }),
      });
      setNotifications((previous) =>
        previous.map((notification) =>
          String(notification.id) === String(item.id) ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    setShowNotifications(false);
    if (item.link) {
      const cleanLink = item.link.startsWith(`/${locale}/`)
        ? item.link
        : `/${locale}${item.link.startsWith('/') ? item.link : `/${item.link}`}`;
      router.push(cleanLink);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAll: true }),
      });
      if (!response.ok) throw new Error('Failed to mark notifications as read.');
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
      localStorage.clear();
      window.location.href = `/${locale}/login`;
    });
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const getNotificationIcon = (type: string) => {
    if (type === 'ATTENDANCE' || type === 'ATTENDANCE_ALERT' || type === 'PERMISSION') {
      return <Clock3 size={16} className="text-[#57cef8]" />;
    }
    if (type === 'COMPLAINT') return <ShieldAlert size={16} className="text-rose-500" />;
    return <CalendarDays size={16} className="text-[#57cef8]" />;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-xl text-slate-900 dark:border-white/[0.08] dark:bg-[#181d23]/95 dark:text-zinc-100">
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-[1600px] items-center gap-2 px-3 sm:px-5 lg:px-8">
        <Link href={`/${locale}/attendance`} className="flex shrink-0 items-center gap-2" aria-label="L-K Shift">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#57cef8] text-xs font-black tracking-tight text-[#181d23] shadow-xs">
            LK
          </span>
          <span className="hidden text-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:inline">
            L-K Shift
          </span>
        </Link>

        <DesktopNav locale={locale} />

        <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link
            href={localizedPath}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:bg-[#232a32]"
            aria-label={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
            title={isRtl ? 'English' : 'العربية'}
          >
            {nextLocale.toUpperCase()}
          </Link>
          {!hasAudioUnlocked && (
            <button
              type="button"
              onClick={handleUnlockAudioAndPush}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:bg-[#232a32]"
              title={isRtl ? 'تفعيل التنبيهات الصوتية' : 'Enable audio notifications'}
              aria-label={isRtl ? 'تفعيل التنبيهات الصوتية' : 'Enable audio notifications'}
            >
              <Volume2 size={16} />
            </button>
          )}

          {/* زر وجرس الإشعارات التفاعلي */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (!hasAudioUnlocked) void handleUnlockAudioAndPush();
                setShowNotifications((open) => !open);
                void fetchNotifications();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:bg-[#232a32]"
              title={isRtl ? 'الإشعارات' : 'Notifications'}
              aria-label={isRtl ? 'الإشعارات' : 'Notifications'}
              aria-expanded={showNotifications}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-[#181d23]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                className="fixed inset-x-3 top-16 z-50 flex max-h-[75vh] flex-col rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-2xl dark:border-white/[0.12] dark:bg-[#1e242b] dark:text-zinc-200 sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-96"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-1 pb-2.5 dark:border-white/[0.08]">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {isRtl ? `الإشعارات (${unreadCount} غير مقروء)` : `Notifications (${unreadCount})`}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllAsRead()}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#0099cc] hover:underline dark:text-[#57cef8]"
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
                  ) : (
                    notifications.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => void handleNotificationClick(item)}
                        className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-start transition hover:bg-slate-50 dark:hover:bg-[#292f35] ${
                          item.isRead ? 'opacity-65' : 'bg-[#57cef8]/5'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">{getNotificationIcon(item.type)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-500 dark:text-zinc-400">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </span>
                          <span className="mt-0.5 block break-words text-[11px] leading-relaxed text-slate-600 dark:text-zinc-300">
                            {item.message}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* زر الحساب المدمج: صورة الموظف المصغرة + الاسم الأول فقط بنفس مقاس البار (h-9) */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((open) => !open)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2 text-start transition hover:bg-slate-100 dark:border-white/[0.08] dark:bg-[#232a32] dark:hover:bg-[#292f35]"
              aria-expanded={showUserMenu}
              aria-label={isRtl ? 'قائمة المستخدم' : 'User menu'}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={firstName}
                  className="h-6 w-6 shrink-0 rounded-full object-cover border border-[#57cef8]"
                />
              ) : (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#57cef8]/20 text-[#0099cc] dark:text-[#57cef8]">
                  <UserRound size={13} />
                </span>
              )}
              <span className="max-w-[4.5rem] truncate text-[11px] font-extrabold text-slate-800 dark:text-zinc-100">
                {firstName}
              </span>
            </button>

            {showUserMenu && (
              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                className="absolute end-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/[0.12] dark:bg-[#1e242b]"
              >
                <div className="border-b border-slate-100 px-3 py-2 dark:border-white/[0.06]">
                  <div className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                    {userName || firstName}
                  </div>
                  {userRole && (
                    <div className="truncate text-[10px] font-semibold text-[#0099cc] dark:text-[#57cef8]">
                      {userRole}
                    </div>
                  )}
                </div>
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setShowUserMenu(false)}
                  className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-[#292f35]"
                >
                  <UserRound size={14} className="text-[#57cef8]" />
                  <span>{isRtl ? 'ملفي الشخصي' : 'My profile'}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <LogOut size={14} />
                  <span>{isRtl ? 'تسجيل الخروج' : 'Sign out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
