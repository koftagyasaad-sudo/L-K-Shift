'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowUpLeft,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Bell,
  Clock,
  Calendar,
  ShieldAlert,
  CheckCheck,
  Volume2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface GlobalHeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  mobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
}

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
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// دالة رنين صفارة قوية ومرتفعة الصوت (High-Pitch Loud Double Alert)
function playLoudNotificationAlert() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // نبضة الصوت الأولى (1046 Hz - C6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square'; // موجة مربعة مسموعة بوضوح وقوة في الهاتف
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.8, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // نبضة الصوت الثانية الأعلى والأقوى (1567 Hz - G6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1567.98, now + 0.22);
    gain2.gain.setValueAtTime(0.9, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.5);

    // اهتزاز ثلاثي قوي للهاتف
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 150, 300]);
    }
  } catch (e) {
    console.warn('Audio alert error:', e);
  }
}

// إطلاق إشعار خارجي في درج الإشعارات وشاشة القفل عبر الـ Service Worker
function triggerSystemOSNotification(title: string, message: string) {
  if (typeof window === 'undefined') return;

  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: message,
          icon: '/Logo.png',
          badge: '/Logo.png',
          tag: 'lk-shift-os-alert',
          requireInteraction: true,
        });
      }).catch(() => {
        new Notification(title, { body: message, icon: '/Logo.png' });
      });
    } else {
      new Notification(title, { body: message, icon: '/Logo.png' });
    }
  }
}

export default function GlobalHeader({
  onToggleSidebar,
  sidebarCollapsed,
  mobileSidebarOpen = false,
  onToggleMobileSidebar,
}: GlobalHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userName, setUserName] = useState('عمر محمد سعيد عبدالحليم');
  const [userRole, setUserRole] = useState('مدير النظام');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const prevUnreadCountRef = useRef<number>(-1);
  const [hasAudioUnlocked, setHasAudioUnlocked] = useState<boolean>(true);
  const [shiftNotified, setShiftNotified] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');
      if (storedName) setUserName(storedName);
      if (storedRole) setUserRole(storedRole);

      const unlocked = localStorage.getItem('audio_notifications_unlocked');
      if (!unlocked) {
        setHasAudioUnlocked(false);
      }
    } catch {}
  }, []);

  const handleUnlockAudioAndPush = async () => {
    try {
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      playLoudNotificationAlert();
      localStorage.setItem('audio_notifications_unlocked', 'true');
      setHasAudioUnlocked(true);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          triggerSystemOSNotification('L-K Shift Core', 'تم تفعيل التنبيهات الصوتية القوية وقائمة إشعارات الهاتف بنجاح!');
        }
      }
    } catch (e) {
      console.warn('Unlock audio error:', e);
    }
  };

  const fetchNotifications = async () => {
    const currentUid = localStorage.getItem('userId');
    if (!currentUid) return;

    try {
      const res = await fetch(`/api/notifications?userId=${currentUid}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const items: NotificationItem[] = Array.isArray(data) ? data : [];
        setNotifications(items);

        const currentUnread = items.filter((n) => !n.isRead).length;

        if (prevUnreadCountRef.current !== -1 && currentUnread > prevUnreadCountRef.current) {
          playLoudNotificationAlert();

          const newest = items.find((n) => !n.isRead);
          if (newest) {
            triggerSystemOSNotification(newest.title, newest.message);
          }
        }
        prevUnreadCountRef.current = currentUnread;
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // فحص منبه اقتراب الوردية
  useEffect(() => {
    const checkShiftAlarm = () => {
      const branchShift = localStorage.getItem('userBranchShift') || '10:00';
      const match = branchShift.match(/(\d{1,2}):(\d{2})/);
      if (!match) return;

      const shiftHour = parseInt(match[1], 10);
      const shiftMinute = parseInt(match[2], 10);

      const now = new Date();
      const shiftDate = new Date();
      shiftDate.setHours(shiftHour, shiftMinute, 0, 0);

      const diffMinutes = Math.round((shiftDate.getTime() - now.getTime()) / 60000);

      [60, 30, 15].forEach((intervalMinutes) => {
        if (diffMinutes === intervalMinutes && !shiftNotified[`${intervalMinutes}`]) {
          playLoudNotificationAlert();
          triggerSystemOSNotification(
            'منبه موعد الوردية - L-K Shift',
            `تنبيه هام: ستبدأ وردية العمل خلال ${intervalMinutes} دقيقة! يرجى الاستعداد لتسجيل البصمة داخل الفرع.`
          );
          setShiftNotified((prev) => ({ ...prev, [`${intervalMinutes}`]: true }));
        }
      });
    };

    const alarmInterval = setInterval(checkShiftAlarm, 25000);
    return () => clearInterval(alarmInterval);
  }, [shiftNotified]);

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: item.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    } catch {}

    setShowDropdown(false);
    if (item.link) {
      router.push(`/${locale}${item.link.startsWith('/') ? item.link : `/${item.link}`}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    const currentUid = localStorage.getItem('userId');
    if (!currentUid) return;

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: currentUid }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push(`/${locale}/login`);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const firstLetter = userName ? userName.trim().charAt(0) : 'ع';

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ATTENDANCE':
        return <Clock size={16} className="text-emerald-600" />;
      case 'PERMISSION':
        return <Clock size={16} className="text-amber-500" />;
      case 'COMPLAINT':
        return <ShieldAlert size={16} className="text-rose-600" />;
      default:
        return <Calendar size={16} className="text-orange-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full min-w-0 max-w-full items-center justify-between gap-2 overflow-x-hidden border-b border-violet-950/10 bg-white/90 px-2 text-[#0a0814] backdrop-blur-md dark:border-[#c4b2ff]/15 dark:bg-[#0a0814]/85 dark:text-[#f6f0ff] sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-violet-950/10 bg-violet-50 text-[#433b5c] transition hover:bg-violet-100 hover:text-[#0a0814] dark:border-[#c4b2ff]/15 dark:bg-[#110e1f] dark:text-[#c9c0e8] dark:hover:bg-[#1a1530] dark:hover:text-[#f6f0ff] lg:flex"
            title="طي / فتح القائمة"
          >
            {isRtl ? (
              sidebarCollapsed ? <ChevronLeft size={17} /> : <ChevronRight size={17} />
            ) : (
              sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />
            )}
          </button>
        )}
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-950/10 bg-violet-50 text-[#433b5c] transition hover:bg-violet-100 hover:text-[#0a0814] dark:border-[#c4b2ff]/15 dark:bg-[#110e1f] dark:text-[#c9c0e8] dark:hover:bg-[#1a1530] dark:hover:text-[#f6f0ff] lg:hidden"
            aria-label={mobileSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={mobileSidebarOpen}
          >
            {mobileSidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        )}

        <Link
          href={`/${locale}/profile`}
          className="group flex min-w-0 items-center gap-2 rounded-2xl p-1.5 transition hover:bg-violet-50 dark:hover:bg-[#110e1f] sm:gap-3"
          title="البيانات الشخصية"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#46f4ff] via-[#9d6bff] to-[#ff2bd6] text-[#050309] text-sm font-bold shadow-md shadow-[#9d6bff]/20 transition-transform group-hover:scale-105 sm:h-10 sm:w-10">
            {firstLetter}
          </div>
          <div className="hidden min-w-0 max-w-[28vw] text-right sm:block sm:max-w-none">
            <h3 className="truncate text-xs font-bold text-[#0a0814] transition group-hover:text-[#9d6bff] dark:text-[#f6f0ff] sm:text-sm">
              {userName}
            </h3>
            <span className="block truncate text-[11px] font-semibold text-[#433b5c] dark:text-[#c9c0e8]">
              {userRole}
            </span>
          </div>
        </Link>
      </div>

      <div className="hidden shrink-0 items-center gap-2 text-[11px] font-mono tracking-wide text-[#433b5c] dark:text-[#c9c0e8] md:flex">
        <span className="sonomir-live-dot relative inline-flex h-2.5 w-2.5 rounded-full">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#cdff4d] opacity-50" />
        </span>
        <span>{isRtl ? 'النظام نشط · L-K Shift Live' : 'System Live · L-K Shift'}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href={`/${locale}/attendance`}
          prefetch
          aria-label={isRtl ? 'تسجيل الحضور' : 'Open attendance'}
          title={isRtl ? 'تسجيل الحضور' : 'Open attendance'}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#46f4ff] via-[#9d6bff] to-[#ff2bd6] px-2 text-[11px] font-black text-[#050309] shadow-md shadow-[#9d6bff]/20 transition hover:-translate-y-0.5 sm:px-3"
        >
          {isRtl ? <ArrowUpLeft size={15} /> : <ArrowUpRight size={15} />}
          <span className="hidden sm:inline">{isRtl ? 'الحضور' : 'Attendance'}</span>
        </Link>
        <ThemeToggle />
        {!hasAudioUnlocked && (
          <button
            type="button"
            onClick={handleUnlockAudioAndPush}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#9d6bff]/30 bg-violet-50 text-[#433b5c] shadow-sm transition hover:bg-violet-100 dark:bg-[#110e1f] dark:text-[#c9c0e8]"
            title="انقر لتفعيل صوت التنبيهات وإشعارات الهاتف"
          >
            <Volume2 size={14} />
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              if (!hasAudioUnlocked) handleUnlockAudioAndPush();
              setShowDropdown(!showDropdown);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-violet-950/10 bg-violet-50 text-[#433b5c] transition hover:bg-violet-100 dark:border-[#c4b2ff]/15 dark:bg-[#110e1f] dark:text-[#c9c0e8] dark:hover:bg-[#1a1530]"
            title="الإشعارات"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="absolute top-full left-0 z-50 mt-2 flex w-80 max-w-[calc(100vw-1rem)] flex-col rounded-2xl border border-violet-950/10 bg-white p-3 text-[#433b5c] shadow-2xl dark:border-[#c4b2ff]/15 dark:bg-[#0a0814] dark:text-[#c9c0e8] sm:w-96"
            >
              <div className="flex items-center justify-between border-b border-violet-950/10 px-2 pb-2.5 dark:border-[#c4b2ff]/15">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0a0814] dark:text-[#f6f0ff]">قائمة الإشعارات</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                      {unreadCount} غير مقروء
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
                  >
                    <CheckCheck size={13} />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}
              </div>

              <div className="mt-1 flex max-h-80 flex-col divide-y divide-violet-950/10 overflow-y-auto custom-scrollbar dark:divide-[#c4b2ff]/15">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`flex flex-row items-start gap-3 p-3 transition cursor-pointer rounded-xl text-right w-full ${
                        item.isRead
                          ? 'opacity-70 hover:bg-slate-50'
                          : 'bg-orange-50/60 hover:bg-orange-50 border-r-2 border-orange-500'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-xs font-bold text-[#0a0814] dark:text-[#f6f0ff]">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-[11px] leading-relaxed text-[#433b5c] dark:text-[#c9c0e8]">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 transition hover:bg-rose-500/20 sm:w-auto sm:gap-1.5 sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-bold"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">{isRtl ? 'خروج' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  );
}
