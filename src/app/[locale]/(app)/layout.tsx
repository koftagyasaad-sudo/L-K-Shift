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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";
  const isRtl = currentLocale === "ar";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
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
      name: isRtl ? "لوحة التحكم الرئيسية" : "Main Dashboard",
      href: `/${currentLocale}`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
    },
    {
      name: isRtl ? "إدارة الفروع" : "Branches Management",
      href: `/${currentLocale}/admin/branches`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
    },
    {
      name: isRtl ? "بيانات الموظفين" : "Employees Data",
      href: `/${currentLocale}/admin/employees`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      name: isRtl ? "الأدوار والصلاحيات" : "Admin & Roles",
      href: `/${currentLocale}/admin/roles`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
    }
  ];

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#f8fafc] text-gray-900"}`} dir={isRtl ? "rtl" : "ltr"}>
        
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "w-[280px]" : "w-20"
          } transition-all duration-300 ease-in-out relative flex flex-col shadow-2xl z-40`}
          style={{ background: "linear-gradient(180deg, #ea580c 0%, #f97316 40%, #ffffff 100%)" }}
        >
          <div>
            <div className="h-20 flex items-center justify-between px-5 border-b border-white/20">
              {isSidebarOpen && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-black text-lg shadow-lg">
                    LK
                  </div>
                  <span className="font-extrabold text-white text-xl tracking-wide drop-shadow-md">
                    L-K-Shift
                  </span>
                </div>
              )}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all ${!isSidebarOpen && "mx-auto"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {isSidebarOpen ? <path d="m15 18-6-6 6-6"/> : <path d="m9 18 6-6-6-6"/>}
                </svg>
              </button>
            </div>

            <nav className="mt-8 px-4 space-y-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                      isActive
                        ? "bg-white text-orange-600 shadow-xl font-extrabold transform translate-x-1"
                        : "text-white/90 hover:bg-white/20 hover:text-white font-bold"
                    }`}
                    title={!isSidebarOpen ? item.name : ""}
                  >
                    <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                      {item.icon}
                    </span>
                    {isSidebarOpen && (
                      <span className="text-sm truncate">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header */}
          <header className={`h-20 border-b px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300 ${
            isDarkMode ? "bg-[#111111]/90 backdrop-blur-md border-gray-800" : "bg-white/90 backdrop-blur-md border-gray-200 shadow-sm"
          }`}>
            
            {/* System Status Indicator */}
            <div className="flex items-center">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                isDarkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isRtl ? "النظام يعمل - صلاحيات مطلقة للنظام" : "System Active - Full Control"}
              </span>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-4">
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                  isDarkMode 
                    ? "bg-[#1e1e1e] border-gray-700 text-yellow-400 hover:bg-gray-800" 
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                )}
              </button>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all font-bold text-sm ${
                  isDarkMode 
                    ? "bg-[#1e1e1e] border-gray-700 text-gray-200 hover:bg-gray-800" 
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
                title={isRtl ? "Switch to English" : "التبديل للعربية"}
              >
                {currentLocale === "ar" ? "EN" : "ع"}
              </button>

              <div className={`h-8 w-px ${isDarkMode ? "bg-gray-800" : "bg-gray-300"}`}></div>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl border transition-all ${
                    isDarkMode ? "hover:bg-[#1a1a1a] border-transparent hover:border-gray-800" : "hover:bg-gray-50 border-transparent hover:border-gray-200"
                  }`}
                >
                  <div className="text-right hidden md:block">
                    <p className={`text-sm font-extrabold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      المستخدم الحالي
                    </p>
                    <p className="text-xs text-orange-500 font-bold">أدمن - صلاحيات مطلقة</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                    مأ
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className={isDarkMode ? "text-gray-400" : "text-gray-600"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {isUserMenuOpen && (
                  <div className={`absolute top-full mt-3 w-64 rounded-2xl shadow-2xl border overflow-hidden z-50 ${isRtl ? "left-0" : "right-0"} ${
                    isDarkMode ? "bg-[#141414] border-gray-800" : "bg-white border-gray-200"
                  }`}>
                    <div className={`p-4 border-b ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
                      <p className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>حساب الإدارة (Admin)</p>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>admin@lk-shift.com</p>
                      <span className="inline-block mt-2 bg-orange-500/20 text-orange-500 text-[10px] px-2 py-1 rounded-md font-bold">
                        صلاحيات مطلقة للنظام
                      </span>
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => router.push(`/${currentLocale}/login`)}
                        className={`flex items-center gap-3 w-full text-sm font-bold py-2.5 px-3 rounded-xl transition-colors ${
                          isDarkMode ? "text-gray-300 hover:bg-[#202020] hover:text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8l3 3-3 3"/><path d="M22 11h-7"/></svg>
                        تبديل حساب / يوزر آخر
                      </button>
                      <button
                        onClick={() => router.push(`/${currentLocale}/login`)}
                        className={`flex items-center gap-3 w-full text-sm font-bold py-2.5 px-3 rounded-xl transition-colors text-red-500 ${
                          isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-50"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
