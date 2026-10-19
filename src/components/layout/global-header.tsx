"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, Sun, Moon, User, LogOut, Settings, 
  MapPin, Camera, CheckCircle2, Circle, Check 
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

export default function GlobalHeader() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "n1", title: "طلب إجازة جديد", message: "محمد علي قدم طلب إجازة سنوية مرسلة للـ HR", time: "منذ 5 دقائق", read: false, type: "info" },
    { id: "n2", title: "تسجيل حضور", message: "فاطمة الشهري سجلت الحضور بفرع جدة", time: "منذ 15 دقيقة", read: false, type: "success" },
    { id: "n3", title: "تنبيه تأخير", message: "تأخر 2 موظفين عن الشفت اليوم", time: "منذ ساعة", read: true, type: "warning" }
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-4"
      style={{
        background: "linear-gradient(90deg, rgba(249,115,22,0.95) 0%, rgba(255,255,255,0.85) 50%, rgba(249,115,22,0.95) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(249,115,22,0.25)",
        boxShadow: "0 2px 20px rgba(249,115,22,0.1)"
      }}
    >
      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-orange-200 shadow-sm transition-all"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
              س
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">المستخدم الحالي</p>
              <p className="text-[10px] text-orange-600 font-semibold leading-tight">صلاحيات مطلقة</p>
            </div>
          </button>

          {userOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-orange-100 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-orange-100">
                <p className="text-sm font-bold text-slate-800">سعد الكفتجي</p>
                <p className="text-[11px] text-slate-500">saad@l-k-shift.com</p>
              </div>
              <div className="py-1">
                <button className="w-full px-3 py-2 text-right text-xs text-slate-700 hover:bg-orange-50 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> الملف الشخصي
                </button>
                <button className="w-full px-3 py-2 text-right text-xs text-slate-700 hover:bg-orange-50 flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" /> الإعدادات
                </button>
                <button className="w-full px-3 py-2 text-right text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100">
                  <LogOut className="w-3.5 h-3.5" /> تسجيل الخروج
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleLang}
          className="p-2 bg-white/80 hover:bg-white rounded-xl border border-orange-200 shadow-sm transition-all"
        >
          <span className="text-xs font-bold text-slate-700">{lang === "ar" ? "EN" : "AR"}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 bg-white/80 hover:bg-white rounded-xl border border-orange-200 shadow-sm transition-all"
        >
          {theme === "light" ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 bg-white/80 hover:bg-white rounded-xl border border-orange-200 shadow-sm transition-all"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-orange-100 overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-orange-100">
                <h3 className="text-sm font-bold text-slate-800">الإشعارات ({unreadCount})</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>تعيين الكل كمقروء</span>
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">لا توجد إشعارات</p>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`w-full text-right p-3 border-b border-slate-100 hover:bg-slate-50 transition-all flex items-start gap-2.5
                        ${notif.read ? "opacity-60" : "bg-orange-50/30"}
                      `}
                    >
                      <div className="mt-1 shrink-0">
                        {notif.read ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Circle className="w-3 h-3 fill-orange-500 text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${notif.read ? "font-medium text-slate-600" : "font-bold text-slate-900"}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-orange-500 mt-1">{notif.time}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Left Controls: Attendance + System Badge */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => alert("جاري الاتصال بـ GPS للتحقق من النطاق (3m) والتقاط بصمة الوجه...")}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
        >
          <MapPin className="w-3.5 h-3.5" />
          <Camera className="w-3.5 h-3.5" />
          <span>تسجيل الحضور</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="font-semibold text-emerald-700">النظام متصل</span>
        </div>
      </div>
    </header>
  );
}
