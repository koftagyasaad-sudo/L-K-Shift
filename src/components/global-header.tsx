"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, LogOut, CheckCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

type NotificationItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  timeAr: string;
  timeEn: string;
  href: string;
  color: "orange" | "pink" | "blue";
  read: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    titleAr: "طلب إجازة جديد ينتظر موافقتك",
    titleEn: "New leave request pending",
    timeAr: "منذ ساعة",
    timeEn: "1 hour ago",
    href: "/admin/attendance-review",
    color: "orange",
    read: false,
  },
  {
    id: "2",
    titleAr: "تم تسجيل حضور جديد",
    titleEn: "New attendance recorded",
    timeAr: "منذ 5 دقائق",
    timeEn: "5 minutes ago",
    href: "/attendance",
    color: "pink",
    read: false,
  },
];

export function GlobalHeader({
  toggleSidebar,
  locale,
}: {
  toggleSidebar: () => void;
  locale: string;
}) {
  const isRtl = locale === "ar";
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userName, setUserName] = useState("Omar Abd Elhalim");
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name) setUserName(parsed.name);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setShowNotifications(false);
    router.push(`/${locale}${item.href}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    router.push(`/${locale}/login`);
  };

  const colorMap = {
    orange: "bg-orange-50 dark:bg-orange-500/10 border-orange-500",
    pink: "bg-pink-50 dark:bg-pink-500/10 border-pink-500",
    blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-500",
  };

  return (
    <header
      className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 transition-colors"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between px-4 h-14 max-w-full">
        {/* Start side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="p-1.5 -ms-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
            type="button"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <img src="/Logo.png" alt="Logo" className="h-6 w-auto" />
            <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              L-K Shift
            </span>
          </div>
        </div>

        {/* End side — compact icons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <LanguageToggle currentLocale={locale} />
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowUserMenu(false);
              }}
              className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 end-0.5 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden"
                style={{
                  insetInlineEnd: 0,
                  insetInlineStart: "auto",
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {isRtl ? "الإشعارات" : "Notifications"}
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                      type="button"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {isRtl ? "تحديد الكل كمقروء" : "Mark all as read"}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">
                      {isRtl ? "لا توجد إشعارات" : "No notifications"}
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`w-full text-start p-3 rounded-xl border-s-4 transition-all ${
                          colorMap[item.color]
                        } ${
                          item.read
                            ? "opacity-50"
                            : "opacity-100 hover:scale-[1.01]"
                        }`}
                        type="button"
                      >
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {isRtl ? item.titleAr : item.titleEn}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {isRtl ? item.timeAr : item.timeEn}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => {
                setShowUserMenu((v) => !v);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              type="button"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:block text-start leading-tight">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {isRtl ? "مدير النظام" : "System Admin"}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div
                className="absolute top-full mt-2 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 p-1.5"
                style={{
                  insetInlineEnd: 0,
                  insetInlineStart: "auto",
                }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  type="button"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {isRtl ? "تسجيل الخروج" : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
