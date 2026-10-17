"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Menu
} from "lucide-react";

// استدعاء الهيدر الأصلي الخاص بمشروعك لتشغيل زراير اللغة والمود
import GlobalHeader from "@/components/layout/global-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // حالة فتح وقفل الـ Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // الروابط المطلوبة في الـ Sidebar
  const sidebarLinks = [
    { name: "لوحة التحكم الرئيسية", icon: LayoutDashboard, href: "/ar" },
    { name: "إدارة الفروع", icon: Building2, href: "/ar/admin/branches" },
    { name: "إدارة الموظفين والداتا", icon: Users, href: "/ar/admin/employees" },
    { name: "صلاحيات المديرين", icon: ShieldCheck, href: "/ar/admin/roles" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]" dir="rtl">
      
      {/* ==================== 1. الـ Sidebar (برتقالي وأبيض - قابل للطي) ==================== */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 ease-in-out relative flex flex-col justify-between shadow-2xl`}
        // لون مدمج ما بين البرتقالي والأبيض
        style={{ background: "linear-gradient(to bottom, #ea580c, #ffffff)" }}
      >
        <div>
          {/* رأس الـ Sidebar وزر الطي */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/20">
            {isSidebarOpen && (
              <span className="font-extrabold text-white text-xl tracking-wider drop-shadow-md">
                L-K-Shift
              </span>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors mx-auto"
            >
              {isSidebarOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* أقسام الـ Sidebar الأربعة */}
          <nav className="mt-6 px-3 space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? "bg-white text-orange-600 shadow-lg font-bold" 
                      : "text-white/90 hover:bg-white/20 hover:text-white font-medium"
                  }`}
                  title={!isSidebarOpen ? link.name : ""}
                >
                  <link.icon size={22} className={isActive ? "text-orange-600" : "text-white"} />
                  {isSidebarOpen && <span>{link.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* قسم تسجيل الخروج في الأسفل */}
        <div className="p-4 border-t border-orange-200/30">
          <button 
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-xl transition-all duration-200 text-red-600 font-bold ${
              isSidebarOpen ? "bg-white/90 hover:bg-white shadow-md" : "bg-white/90 hover:bg-white justify-center"
            }`}
            title={!isSidebarOpen ? "تسجيل الخروج" : ""}
            onClick={() => {
              // ضع هنا دالة تسجيل الخروج الخاصة بك (مثلاً signOut من NextAuth)
              alert("تم طلب تسجيل الخروج");
            }}
          >
            <LogOut size={22} />
            {isSidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* ==================== 2. منطقة المحتوى (الهيدر + صفحة التحكم) ==================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* استدعاء الهيدر الأصلي عشان زراير اللغة والمود ترجع تشتغل */}
        <GlobalHeader />

        {/* المحتوى الفعلي (لوحة التحكم التي صممناها في page.tsx) */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      
    </div>
  );
}
