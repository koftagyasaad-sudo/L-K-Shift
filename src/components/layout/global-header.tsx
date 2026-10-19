"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, UserCircle, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";

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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserName(JSON.parse(storedUser).name);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    router.push(`/${locale}/login`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-4 h-16 max-w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/Logo.png" alt="Logo" className="h-7 w-auto" />
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              L-K Shift
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle currentLocale={locale} />
          <ThemeToggle />

          {/* الإشعارات المظبوطة */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            {showNotifications && (
              <div className="absolute top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 rtl:left-0 ltr:right-0 p-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  {isRtl ? "الإشعارات التنبيهية" : "Notifications"}
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl border-r-4 border-orange-500">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {isRtl ? "طلب إجازة جديد يتنظر موافقتك" : "New leave request pending"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* قائمة المستخدم المظبوطة */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:block text-start leading-tight">
                <p className="text-xs font-bold text-gray-900 dark:text-white">{userName}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{isRtl ? "مدير النظام" : "System Admin"}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 rtl:left-0 ltr:right-0 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
