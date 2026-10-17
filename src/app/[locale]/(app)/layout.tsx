"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 1. حالة الفتح والقفل للـ Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 2. حالة المود (ليلي / نهاري)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // تحديد اللغة الحالية من المسار (/ar أو /en)
  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";
  const isRtl = currentLocale === "ar";

  // دالة تبديل اللغة برمجياً
  const toggleLanguage = () => {
    const targetLocale = currentLocale === "ar" ? "en" : "ar";
    const newPathname = pathname.replace(`/${currentLocale}`, `/${targetLocale}`);
    router.push(newPathname || `/${targetLocale}`);
  };

  // أقسام الـ Sidebar الأربعة المطلوبة
  const navItems = [
    {
      name: isRtl ? "لوحة التحكم الرئيسية" : "Main Dashboard",
      href: `/${currentLocale}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      )
    },
    {
      name: isRtl ? "إدارة الفروع" : "Branches Management",
      href: `/${currentLocale}/admin/branches`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
      )
    },
    {
      name: isRtl ? "إنشاء موظف وداتا وملخص الموظفين" : "Employees & Data",
      href: `/${currentLocale}/admin/employees`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      )
    },
    {
      name: isRtl ? "صلاحيات المديرين والأدمن" : "Admin & Role Management",
      href: `/${currentLocale}/admin/roles`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
      )
    }
  ];

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-gray-100 text-gray-900"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* ==================== 1. SIDEBAR (مدمج برتقالي وأبيض - قابل للطي) ==================== */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 ease-in-out relative flex flex-col justify-between shadow-2xl z-40`}
        style={{
          background: "linear-gradient(180deg, #ea580c 0%, #f97316 45%, #ffffff 100%)",
        }}
      >
        <div>
          {/* هيدر الـ Sidebar وزر القفل والفتح */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/20">
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white text-orange-600 flex items-center justify-center font-extrabold shadow-md">
                  LK
                </div>
                <span className="font-extrabold text-white text-lg tracking-wider drop-shadow">
                  L-K-Shift
                </span>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors mx-auto"
              title={isSidebarOpen ? "طي القائمة" : "توسيع القائمة"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isSidebarOpen ? (
                  <path d="m15 18-6-6 6-6"/>
                ) : (
                  <path d="m9 18 6-6-6-6"/>
                )}
              </svg>
            </button>
          </div>

          {/* روابط الأقسام الأربعة */}
          <nav className="mt-6 px-3 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-white text-orange-600 shadow-xl font-extrabold translate-x-1"
                      : "text-white hover:bg-white/20 font-semibold"
                  }`}
                  title={!isSidebarOpen ? item.name : ""}
                >
                  <span className={isActive ? "text-orange-600" : "text-white"}>
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

        {/* قسم التحكم باليوزر والصلاحيات المطلقة أسفل الـ Sidebar */}
        <div className="p-3 border-t border-orange-200/40 bg-white/40 backdrop-blur-sm m-2 rounded-2xl space-y-2">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow">
                أدمن
              </div>
              <div className="overflow-hidden text-right">
                <p className="text-xs font-extrabold text-gray-900 truncate">المستخدم الحالي</p>
                <span className="inline-block bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  صلاحيات مطلقة
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {/* زر تسجيل دخول بـ يوزر آخر */}
            <button
              onClick={() => router.push(`/${currentLocale}/login`)}
              className={`flex items-center gap-2 w-full text-xs font-bold py-2 px-3 rounded-xl transition-colors ${
                isSidebarOpen ? "bg-white/80 hover:bg-white text-gray-800" : "bg-white/80 hover:bg-white justify-center text-gray-800"
              }`}
              title={!isSidebarOpen ? "تبديل حساب" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8l3 3-3 3"/><path d="M22 11h-7"/></svg>
              {isSidebarOpen && <span>تبديل حساب / يوزر آخر</span>}
            </button>

            {/* زر تسجيل الخروج */}
            <button
              onClick={() => router.push(`/${currentLocale}/login`)}
              className={`flex items-center gap-2 w-full text-xs font-bold py-2 px-3 rounded-xl text-red-700 bg-red-100 hover:bg-red-200 transition-colors ${
                isSidebarOpen ? "" : "justify-center"
              }`}
              title={!isSidebarOpen ? "تسجيل الخروج" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {isSidebarOpen && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== 2. MAIN CONTENT AREA (مع الهيدر العلوي الشغال) ==================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* شريط الأوامر العلوي التفاعلي */}
        <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 transition-colors ${
          isDarkMode ? "bg-[#141414] border-gray-800" : "bg-white border-gray-200 shadow-sm"
        }`}>
          {/* جهة اليمين: حالة النظام للصلاحيات المطلقة */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isRtl ? "النظام يعمل - صلاحيات مطلقة للنظام" : "System Active - Full Control"}
            </span>
          </div>

          {/* جهة اليسار: أزرار التفاعل (تغيير المود، اللغة، والبروفايل) */}
          <div className="flex items-center gap-3">
            
            {/* 1. زر تغيير المظهر (ليلي / نهاري) */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-all ${
                isDarkMode 
                  ? "bg-[#1e1e1e] border-gray-700 text-yellow-400 hover:bg-gray-800" 
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
              title={isRtl ? "تغيير المظهر (ليلي / نهاري)" : "Toggle Theme"}
            >
              {isDarkMode ? (
                /* أيقونة الشمس */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                /* أيقونة القمر */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>

            {/* 2. زر تغيير اللغة الشغال */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                isDarkMode 
                  ? "bg-[#1e1e1e] border-gray-700 text-gray-200 hover:bg-gray-800" 
                  : "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/><path d="M2 12h20"/></svg>
              {currentLocale === "ar" ? "English" : "العربية"}
            </button>

            {/* 3. بروفايل اليوزر الحسابي */}
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold text-xs shadow-sm ${
              isDarkMode ? "bg-blue-600/20 border-blue-500/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"
            }`}>
              مأ
            </div>

          </div>
        </header>

        {/* عرض لوحة التحكم الأصلية (الموجودة في page.tsx) */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
