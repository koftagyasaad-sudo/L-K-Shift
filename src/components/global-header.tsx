'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  MessageSquare,
  ShieldAlert,
  ExternalLink,
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

export default function GlobalHeader({ onToggleSidebar, sidebarCollapsed }: GlobalHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userName, setUserName] = useState('عمر محمد سعيد عبدالحليم');
  const [userRole, setUserRole] = useState('مدير النظام');
  const [userId, setUserId] = useState<string>('');
  const [isDark, setIsDark] = useState(true);

  // حالة الإشعارات
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // منبه الشيفت
  const [shiftNotified, setShiftNotified] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');
      const storedId = localStorage.getItem('userId') || '';
      if (storedName) setUserName(storedName);
      if (storedRole) setUserRole(storedRole);
      if (storedId) setUserId(storedId);

      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }
    } catch {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // جلب الإشعارات
  const fetchNotifications = async () => {
    const currentUid = localStorage.getItem('userId');
    if (!currentUid) return;

    try {
      const res = await fetch(`/api/notifications?userId=${currentUid}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // تحديث دوري كل 15 ثانية
    return () => clearInterval(interval);
  }, []);

  // إغلاق النافذة المنسدلة عند النقر في الخارج
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // منبه الوردية (قبل الشيفت بساعة، نصف ساعة، و15 دقيقة)
  useEffect(() => {
    const checkShiftAlarm = () => {
      const branchShift = localStorage.getItem('userBranchShift') || '09:00'; // صيغة HH:mm
      const match = branchShift.match(/(\d{1,2}):(\d{2})/);
      if (!match) return;

      const shiftHour = parseInt(match[1], 10);
      const shiftMinute = parseInt(match[2], 10);

      const now = new Date();
      const shiftDate = new Date();
      shiftDate.setHours(shiftHour, shiftMinute, 0, 0);

      const diffMinutes = Math.round((shiftDate.getTime() - now.getTime()) / 60000);

      // التنبيه قبل الشيفت بـ 60 أو 30 أو 15 دقيقة
      [60, 30, 15].forEach((intervalMinutes) => {
        if (diffMinutes === intervalMinutes && !shiftNotified[`${intervalMinutes}`]) {
          // إشعار صوتي ونظامي
          try {
            const audio = new Audio('/alarm.mp3');
            audio.play().catch(() => {});
          } catch {}

          if (Notification.permission === 'granted') {
            new Notification('منبه بداية الوردية - L-K Shift', {
              body: `تنبيه: ستبدأ ورديتك خلال ${intervalMinutes} دقيقة! يرجى الاستعداد لتسجيل الحضور.`,
              icon: '/Logo.png',
            });
          }

          setShiftNotified((prev) => ({ ...prev, [`${intervalMinutes}`]: true }));
        }
      });
    };

    const alarmInterval = setInterval(checkShiftAlarm, 30000);
    return () => clearInterval(alarmInterval);
  }, [shiftNotified]);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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
        return <Clock size={16} className="text-emerald-500" />;
      case 'REQUEST':
        return <Calendar size={16} className="text-orange-500" />;
      case 'COMPLAINT':
        return <ShieldAlert size={16} className="text-rose-500" />;
      case 'SHIFT_REMINDER':
        return <AlertCircle size={16} className="text-amber-500 animate-bounce" />;
      default:
        return <MessageSquare size={16} className="text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md dark:border-white/5 dark:bg-[#0c0e18]/90">
      {/* الجانب الأيمن: زر طي القائمة + البروفايل */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
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
          className="flex items-center gap-3 rounded-2xl p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer group"
          title="البيانات الشخصية"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            {firstLetter}
          </div>
          <div className="text-right">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition">
              {userName}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
              {userRole}
            </span>
          </div>
        </Link>
      </div>

      {/* الجانب الأيسر: الإشعارات التفاعلية + الثيم + الخروج */}
      <div className="flex items-center gap-2.5">
        {/* زر وقائمة الإشعارات */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 transition cursor-pointer"
            title="الإشعارات"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* القائمة المنسدلة للإشعارات */}
          {showDropdown && (
            <div
              className={`absolute top-12 ${
                isRtl ? 'left-0' : 'right-0'
              } w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#121422] z-50`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">الإشعارات</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-semibold text-orange-500 hover:underline cursor-pointer"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`flex items-start gap-3 p-3 transition cursor-pointer rounded-xl ${
                        item.isRead
                          ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-white/5'
                          : 'bg-orange-500/5 hover:bg-orange-500/10'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-white/5">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
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

        {/* زر تبديل الثيم */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          title={isDark ? 'المظهر النهاري' : 'المظهر الليلي'}
        >
          {isDark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
        </button>

        {/* زر الخروج */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
        >
          <LogOut size={13} />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
}
