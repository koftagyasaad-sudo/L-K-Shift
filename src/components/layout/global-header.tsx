"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Globe,
  Sun,
  Moon,
  LogOut,
  User,
  CheckCircle2,
  MapPin,
  Camera,
  Sparkles,
  ChevronDown,
  Check,
  Shield,
  Loader2,
} from "lucide-react";
import { recordAttendanceAction } from "@/actions/attendanceActions";

interface NotificationItem {
  id: string;
  titleAr: string;
  titleEn: string;
  timeAr: string;
  timeEn: string;
  unread: boolean;
  type: "info" | "success" | "warning";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    titleAr: "تم تسجيل حضور جديد لـ أحمد محمود في الفرع الرئيسي",
    titleEn: "New attendance logged for Ahmed Mahmoud at Main Branch",
    timeAr: "منذ 5 دقائق",
    timeEn: "5 mins ago",
    unread: true,
    type: "success",
  },
  {
    id: "2",
    titleAr: "طلب إجازة جديد ينتظر موافقتك كمدير للموارد البشرية",
    titleEn: "New leave request awaiting HR Manager approval",
    timeAr: "منذ ساعة",
    timeEn: "1 hour ago",
    unread: true,
    type: "warning",
  },
  {
    id: "3",
    titleAr: "تذكير: اكتمال المزامنة اليومية لبيانات البصمة",
    titleEn: "Reminder: Daily fingerprint data sync completed",
    timeAr: "منذ 3 ساعات",
    timeEn: "3 hours ago",
    unread: false,
    type: "info",
  },
];

export default function GlobalHeader() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  // State Management
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickCheckInModal, setShowQuickCheckInModal] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Quick Check-in Form
  const [employeeId, setEmployeeId] = useState("");
  const [checkInType, setCheckInType] = useState<"check_in" | "check_out">("check_in");
  const [verifying, setVerifying] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sync Theme with HTML Class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  // Language Switcher Logic
  const toggleLanguage = () => {
    const nextLocale = isAr ? "en" : "ar";
    if (!pathname) return;
    
    // Replace the current locale prefix with the target locale
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && (segments[0] === "ar" || segments[0] === "en")) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }
    const newPath = `/${segments.join("/")}`;
    router.push(newPath);
  };

  // Close Popups on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  // Handle Logout -> Directs to /${locale}/login
  const handleLogout = () => {
    setShowUserMenu(false);
    router.push(`/${locale}/login`);
  };

  // Handle Quick Attendance Trigger
  const handleQuickCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) return;

    setVerifying(true);
    setCheckInMessage(null);

    try {
      // Simulate Face ID / GPS verification delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const res = await recordAttendanceAction({
        employee_id: employeeId.trim(),
        type: checkInType,
        verified_by_face: true,
        gps_lat: 24.7136,
        gps_lng: 46.6753,
      });

      if (res.success) {
        setCheckInMessage({
          type: "success",
          text: isAr
            ? `تم تسجيل ${checkInType === "check_in" ? "الدخول" : "الخروج"} بنجاح مع التحقق والوجه!`
            : `Successfully recorded ${checkInType === "check_in" ? "Check-in" : "Check-out"} with Face ID!`,
        });
        setEmployeeId("");
        setTimeout(() => {
          setShowQuickCheckInModal(false);
          setCheckInMessage(null);
          router.refresh();
        }, 1500);
      } else {
        setCheckInMessage({
          type: "error",
          text: res.error || (isAr ? "حدث خطأ أثناء التسجيل" : "Failed to record attendance"),
        });
      }
    } catch {
      setCheckInMessage({
        type: "error",
        text: isAr ? "فشل التسجيل بسبب خطأ في الإتصال" : "Connection error",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <header
        dir={isAr ? "rtl" : "ltr"}
        className="sticky top-0 z-40 w-full h-16 bg-gradient-to-r from-orange-500/15 via-white/80 to-pink-500/15 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-orange-950/40 backdrop-blur-md border-b border-orange-200/50 dark:border-zinc-800 shadow-sm transition-all"
      >
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Right/Left Title or System Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-950/60 border border-orange-300/60 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 text-xs font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span>{isAr ? "نظام الورديات والبصمة الذكية" : "Smart Shift & Fingerprint System"}</span>
            </div>
          </div>

          {/* Quick Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Check-in Button */}
            <button
              onClick={() => setShowQuickCheckInModal(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-medium shadow-md shadow-orange-500/20 transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isAr ? "تسجيل حضور سريع" : "Quick Check-in"}</span>
            </button>

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              title={isAr ? "تغيير للغة الإنجليزية" : "Switch to Arabic"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 hover:bg-orange-50 dark:hover:bg-zinc-700/70 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition"
            >
              <Globe className="w-4 h-4 text-orange-500" />
              <span>{isAr ? "EN" : "عربي"}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isAr ? "تبديل المظهر" : "Toggle Theme"}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 hover:bg-orange-50 dark:hover:bg-zinc-700/70 text-zinc-700 dark:text-zinc-200 transition"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Notifications Menu Container */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 hover:bg-orange-50 dark:hover:bg-zinc-700/70 text-zinc-700 dark:text-zinc-200 transition"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Popup */}
              {showNotifications && (
                <div
                  dir={isAr ? "rtl" : "ltr"}
                  className={`absolute top-full mt-2 ${
                    isAr ? "left-0 sm:left-auto sm:right-0" : "right-0 sm:right-auto sm:left-0"
                  } w-80 sm:w-96 rounded-2xl border border-orange-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-4 z-50 animate-in fade-in duration-150`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" />
                      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {isAr ? "الإشعارات التنبيهية" : "Notifications"}
                      </h3>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Check className="w-3 h-3" />
                        {isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-80 overflow-y-auto my-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center text-zinc-500 py-6">
                        {isAr ? "لا توجد إشعارات حالياً" : "No notifications right now"}
                      </p>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 text-xs transition rounded-xl my-1 ${
                            item.unread
                              ? "bg-orange-50/60 dark:bg-orange-950/30 border-s-4 border-orange-500"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                          }`}
                        >
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {isAr ? item.titleAr : item.titleEn}
                          </p>
                          <span className="text-[10px] text-zinc-400 mt-1 block">
                            {isAr ? item.timeAr : item.timeEn}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu Container */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2.5 p-1.5 sm:pe-3 rounded-xl border border-orange-200/60 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:bg-orange-50/80 dark:hover:bg-zinc-700/70 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  أم
                </div>
                <div className="hidden sm:block text-start leading-tight">
                  <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-100">
                    أحمد محمود
                  </span>
                  <span className="block text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                    {isAr ? "مدير النظام" : "System Admin"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
              </button>

              {/* User Menu Dropdown - left-0 alignment for perfect RTL overflow prevention */}
              {showUserMenu && (
                <div
                  className="absolute left-0 mt-2 w-64 rounded-2xl border border-orange-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-2 z-50 animate-in fade-in duration-150"
                >
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">أحمد محمود</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">admin@l-k-shift.com</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                      <Shield className="w-3 h-3" />
                      <span>{isAr ? "صلاحيات مطلقة للنظام" : "Full System Permissions"}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push(`/${locale}/admin/employees`);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-orange-50 dark:hover:bg-zinc-800 rounded-xl transition"
                    >
                      <User className="w-4 h-4 text-orange-500" />
                      <span>{isAr ? "الملف الشخصي" : "Profile Settings"}</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Quick Attendance Modal */}
      {showQuickCheckInModal && (
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-orange-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {isAr ? "تسجيل حضور / خروج سريع" : "Quick Attendance Log"}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isAr ? "تحقق فوري عبر بصمة الوجه والموقع" : "Instant Face ID & GPS verification"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickCheckInModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickCheckInSubmit} className="space-y-4 mt-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCheckInType("check_in")}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    checkInType === "check_in"
                      ? "bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-300 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {isAr ? "تسجيل دخول" : "Check In"}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckInType("check_out")}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    checkInType === "check_out"
                      ? "bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-300 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {isAr ? "تسجيل خروج" : "Check Out"}
                </button>
              </div>

              {/* Employee ID Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {isAr ? "معرّف الموظف (UUID)" : "Employee ID (UUID)"}
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder={isAr ? "أدخل معرّف الموظف هنا..." : "Enter UUID here..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Verified Badge Simulated Status */}
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 text-[11px] text-orange-800 dark:text-orange-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isAr ? "الموقع الجغرافي: الفرع الرئيسي (مفعّل)" : "GPS: Main Branch (Active)"}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Camera className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isAr ? "التحقق بـ Face ID: مطابق بنسبة 99.8%" : "Face ID: Verified 99.8%"}</span>
                </div>
              </div>

              {/* Feedback Message */}
              {checkInMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    checkInMessage.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                      : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{checkInMessage.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={verifying || !employeeId.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? "جاري التحقق من الوجه والموقع..." : "Verifying Face & GPS..."}</span>
                  </>
                ) : (
                  <span>{isAr ? "تأكيد وتسجيل الآن" : "Confirm & Log Attendance"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
