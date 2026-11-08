'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  MessageSquare,
  ShieldAlert,
  CheckCheck,
  Volume2,
} from 'lucide-react';

interface GlobalHeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
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

// محرك صوت دائم واحد فقط لتفادي حد المتصفح (AudioContext Singleton)
let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playPermanentChime() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }
  } catch (e) {
    console.warn('Audio play warning:', e);
  }
}

export default function GlobalHeader({ onToggleSidebar, sidebarCollapsed }: GlobalHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userName, setUserName] = useState('عمر محمد سعيد عبدالحليم');
  const [userRole, setUserRole] = useState('مدير النظام');
  const [userId, setUserId] = useState<string>('');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const prevUnreadCountRef = useRef<number>(0);
  const [hasAudioUnlocked, setHasAudioUnlocked] = useState<boolean>(true);
  const [shiftNotified, setShiftNotified] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');
      const storedId = localStorage.getItem('userId') || '';
      if (storedName) setUserName(storedName);
      if (storedRole) setUserRole(storedRole);
      if (storedId) setUserId(storedId);

      const unlocked = localStorage.getItem('audio_notifications_unlocked');
      if (!unlocked) {
        setHasAudioUnlocked(false);
      }
    } catch {}
  }, []);

  // فك قفل الصوت وطلب إذن الإشعارات من النظام بضغطة واحدة
  const handleUnlockAudioAndPush = async () => {
    try {
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      playPermanentChime();
      localStorage.setItem('audio_notifications_unlocked', 'true');
      setHasAudioUnlocked(true);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('L-K Shift Core', {
            body: 'تم تفعيل التنبيهات الصوتية وإشعارات الهاتف بنجاح!',
            icon: '/Logo.png',
          });
        }
      }
    } catch (e) {
      console.warn('Audio unlock error:', e);
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
        if (currentUnread > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
          playPermanentChime();

          const newest = items.find((n) => !n.isRead);
          if (newest && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newest.title, {
              body: newest.message,
              icon: '/Logo.png',
            });
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

  // منبه الشيفت الصوتي
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
          playPermanentChime();

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('منبه بداية الشيفت - L-K Shift', {
              body: `تنبيه: ستبدأ ورديتك خلال ${intervalMinutes} دقيقة! يرجى الاستعداد لتسجيل البصمة.`,
              icon: '/Logo.png',
            });
          }

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
      case 'ADVANCE':
        return <Clock size={16} className="text-emerald-500" />;
      case 'PERMISSION':
        return <Clock size={16} className="text-amber-500" />;
      case 'COMPLAINT':
        return <ShieldAlert size={16} className="text-rose-600" />;
      default:
        return <Calendar size={16} className="text-orange-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            title="طي / فتح القائمة"
          >
            {isRtl ? (
              sidebarCollapsed ? <ChevronLeft size={17} /> : <ChevronRight size={17} />
            ) : (
              sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />
            )}
          </button>
        )}

        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-3 rounded-2xl p-1.5 hover:bg-slate-50 transition cursor-pointer group"
          title="البيانات الشخصية"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            {firstLetter}
          </div>
          <div className="text-right">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 transition">
              {userName}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 block">
              {userRole}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        {!hasAudioUnlocked && (
          <button
            type="button"
            onClick={handleUnlockAudioAndPush}
            className="flex items-center gap-1.5 bg-orange-50 border border-orange-300 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-orange-100 transition cursor-pointer animate-pulse"
            title="انقر لتفعيل صوت التنبيهات وإشعارات الهاتف"
          >
            <Volume2 size={14} />
            <span className="hidden sm:inline">تفعيل صوت التنبيهات 🔔</span>
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              if (!hasAudioUnlocked) handleUnlockAudioAndPush();
              setShowDropdown(!showDropdown);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
              className="absolute top-full mt-2 left-0 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 flex flex-col text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">قائمة الإشعارات</span>
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

              <div className="flex flex-col max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar mt-1">
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
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed break-words">
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
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition cursor-pointer"
        >
          <LogOut size={13} />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
}
