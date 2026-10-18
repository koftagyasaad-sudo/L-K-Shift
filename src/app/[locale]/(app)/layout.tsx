"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceMethod, setAttendanceMethod] = useState<"gps" | "camera">("gps");
  const [isOffline, setIsOffline] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";
  const isRtl = currentLocale === "ar";

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const targetLocale = currentLocale === "ar" ? "en" : "ar";
    const newPathname = pathname.replace(`/${currentLocale}`, `/${targetLocale}`);
    router.push(newPathname || `/${targetLocale}`);
  };

  const navItems = [
    {
      name: isRtl ? "لوحة التحكم الرئيسية" : "Dashboard",
      href: `/${currentLocale}`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
    },
    {
      name: isRtl ? "إدارة الفروع" : "Branches",
      href: `/${currentLocale}/admin/branches`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
    },
    {
      name: isRtl ? "بيانات الموظفين" : "Employees",
      href: `/${currentLocale}/admin/employees`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      name: isRtl ? "الأدوار والصلاحيات" : "Roles",
      href: `/${currentLocale}/admin/roles`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
    }
  ];

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#050505] text-white" : "bg-[#f8fafc] text-gray-900"}`} dir={isRtl ? "rtl" : "ltr"}>
        
        {/* Sidebar - Smart & Compact */}
        <aside
          className={`${
            isSidebarOpen ? "w-[240px]" : "w-16"
          } transition-all duration-300 ease-in-out relative flex flex-col z-40`}
          style={{ background: "linear-gradient(180deg, #ea580c 0%, #d946ef 100%)" }}
        >
          <div className="flex-1 flex flex-col bg-black/10 backdrop-blur-sm">
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              {isSidebarOpen && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md p-0.5">
                    <div className="w-full h-full bg-orange-100 rounded-md flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="text-orange-600 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                  </div>
                  <span className="font-extrabold text-white text-lg tracking-wide">
                    L-K-Shift
                  </span>
                </div>
              )}
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all ${!isSidebarOpen && "mx-auto"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {isSidebarOpen ? <path d="m15 18-6-6 6-6"/> : <path d="m9 18 6-6-6-6"/>}
                </svg>
              </button>
            </div>

            <nav className="mt-6 px-3 space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive ? "bg-white/95 text-orange-600 shadow-md font-extrabold" : "text-white/80 hover:bg-white/15 hover:text-white font-semibold"
                    }`}
                    title={!isSidebarOpen ? item.name : ""}
                  >
                    <span>{item.icon}</span>
                    {isSidebarOpen && <span className="text-sm truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header - Unified Design & Compact */}
          <header className={`h-16 px-6 flex items-center justify-between sticky top-0 z-30 transition-all duration-300 border-b ${
            isDarkMode ? "bg-[#050505]/80 backdrop-blur-lg border-gray-800/50" : "bg-white/80 backdrop-blur-lg border-gray-200 shadow-sm"
          }`}>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border hidden md:flex ${
                isDarkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {isRtl ? "النظام متصل" : "Online"}
              </span>

              <button onClick={() => setIsAttendanceModalOpen(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="2"/></svg>
                تسجيل الحضور
              </button>
            </div>

            <div className="flex items-center gap-3">
              
              <div className="relative" ref={notifRef}>
                <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`relative w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isDarkMode ? "bg-[#141414] border-gray-700 text-gray-300 hover:bg-gray-800" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-white dark:border-[#050505]">2</span>
                </button>

                {isNotificationsOpen && (
                  <div className={`absolute top-full mt-2 w-72 rounded-xl shadow-xl border overflow-hidden z-50 ${isRtl ? "left-0" : "right-0"} ${isDarkMode ? "bg-[#111] border-gray-800" : "bg-white border-gray-200"}`}>
                    <div className={`p-3 border-b text-sm font-bold ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>الإشعارات</div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1.5">
                      <div className={`p-2.5 rounded-lg cursor-pointer ${isDarkMode ? "bg-[#1a1a1a] hover:bg-gray-800" : "bg-gray-50 hover:bg-gray-100"}`}>
                        <div className="flex justify-between items-start"><p className="text-xs font-bold text-emerald-500">تمت الموافقة على إجازتك</p><span className="text-[9px] text-gray-500">منذ ساعتين</span></div>
                        <p className={`text-[11px] mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>وافق مدير النظام على طلب الإجازة.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isDarkMode ? "bg-[#141414] border-gray-700 text-yellow-400 hover:bg-gray-800" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                {isDarkMode ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
              </button>

              <button onClick={toggleLanguage} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-xs font-bold ${isDarkMode ? "bg-[#141414] border-gray-700 text-gray-300 hover:bg-gray-800" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                {currentLocale === "ar" ? "EN" : "ع"}
              </button>

              <div className={`h-6 w-px ${isDarkMode ? "bg-gray-800" : "bg-gray-300"}`}></div>

              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={`flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-lg border transition-all ${isDarkMode ? "hover:bg-[#111] border-transparent hover:border-gray-800" : "hover:bg-gray-50 border-transparent hover:border-gray-200"}`}>
                  <div className="text-right hidden md:block">
                    <p className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>المستخدم الحالي</p>
                    <p className="text-[10px] text-orange-500 font-bold">صلاحيات مطلقة</p>
                  </div>
                  <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-orange-600 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">مأ</div>
                </button>

                {isUserMenuOpen && (
                  <div className={`absolute top-full mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 ${isRtl ? "left-0" : "right-0"} ${isDarkMode ? "bg-[#111] border-gray-800" : "bg-white border-gray-200"}`}>
                    <div className="p-1.5 space-y-1">
                      <button onClick={() => router.push(`/${currentLocale}/login`)} className={`flex items-center gap-2 w-full text-xs font-bold py-2 px-3 rounded-lg transition-colors text-red-500 ${isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-5 md:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? "bg-[#111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <h2 className="text-lg font-black">تسجيل الحضور</h2>
              <button onClick={() => setIsAttendanceModalOpen(false)} className={`p-1.5 rounded-lg ${isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-200"}`}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className={`flex p-1 rounded-lg ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
                <button onClick={() => setAttendanceMethod("gps")} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${attendanceMethod === "gps" ? "bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400" : "text-gray-500"}`}>موقع GPS</button>
                <button onClick={() => setAttendanceMethod("camera")} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${attendanceMethod === "camera" ? "bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400" : "text-gray-500"}`}>بصمة الوجه</button>
              </div>

              {attendanceMethod === "gps" ? (
                <div className={`p-5 rounded-xl border text-center ${isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-blue-50 border-blue-100"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" className="mx-auto text-blue-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <p className="font-bold text-sm">جاري تحديد النطاق (3 متر)...</p>
                </div>
              ) : (
                <div className={`p-5 rounded-xl border text-center ${isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                  <div className="w-24 h-24 mx-auto rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mb-3 border-4 border-dashed border-orange-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  </div>
                  <p className="font-bold text-sm">وجّه الكاميرا لوجهك</p>
                </div>
              )}
            </div>

            <div className={`p-5 border-t ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md text-sm transition-all">تأكيد الحضور</button>
            </div>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
}
