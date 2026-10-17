"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";

export default function DashboardPage() {
  const pathname = usePathname();
  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";
  const { isDarkMode } = useContext(ThemeContext);

  const cardClass = `rounded-2xl p-6 border transition-colors ${
    isDarkMode ? "bg-[#111111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"
  }`;

  const linkHoverClass = isDarkMode ? "hover:border-gray-600 hover:bg-[#1a1a1a]" : "hover:border-gray-300 hover:bg-gray-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">لوحة التحكم الرئيسية</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            نظرة عامة على الحضور والورديات وحالة الفروع الحالية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className={`px-5 py-2.5 rounded-xl font-bold border transition-colors flex items-center gap-2 ${
            isDarkMode ? "border-gray-700 hover:bg-gray-800 text-white" : "border-gray-300 hover:bg-gray-100 text-gray-900"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            تصدير التقرير
          </button>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            بدء وردية جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href={`/${currentLocale}/admin/branches`} className={`${cardClass} ${linkHoverClass} block`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
            </div>
            <span className="text-3xl font-black">4</span>
          </div>
          <h3 className="font-bold text-lg">إجمالي الفروع</h3>
          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>فروع مسجلة بالنظام</p>
        </Link>

        <Link href={`/${currentLocale}/admin/employees`} className={`${cardClass} ${linkHoverClass} block`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <span className="text-3xl font-black">2</span>
          </div>
          <h3 className="font-bold text-lg">إجمالي الموظفين</h3>
          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>موظفين على النظام</p>
        </Link>

        <div className={cardClass}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <span className="text-3xl font-black">0</span>
          </div>
          <h3 className="font-bold text-lg">سجلات حضور اليوم</h3>
          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>لا توجد سجلات لليوم</p>
        </div>

        <div className={`${cardClass} border-blue-500/30 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-blue-600/5"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-600/20 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span className="text-3xl font-black text-blue-500">1</span>
          </div>
          <h3 className="font-bold text-lg relative z-10">الورديات النشطة</h3>
          <p className={`text-sm mt-1 relative z-10 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>1 وردية مفتوحة الآن</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-1 ${cardClass}`}>
          <h3 className="font-bold text-lg mb-4">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors font-semibold ${
              isDarkMode ? "border-gray-800 bg-[#1a1a1a] hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
            }`}>
              تسجيل حضور يدوياً
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <Link href={`/${currentLocale}/admin/employees`} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors font-semibold ${
              isDarkMode ? "border-gray-800 bg-[#1a1a1a] hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
            }`}>
              إضافة موظف جديد
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        <div className={`lg:col-span-3 ${cardClass}`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-xl mb-1">سجل الورديات والحضور المباشر</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>متابعة الورديات المفتوحة وحالة الحضور لكل فرع</p>
            </div>
            <select className={`px-4 py-2 rounded-xl border outline-none font-semibold ${
              isDarkMode ? "bg-[#1a1a1a] border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
            }`}>
              <option>جميع الفروع</option>
              <option>الفرع الرئيسي</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className={`border-b ${isDarkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                  <th className="pb-3 font-semibold">الموظف</th>
                  <th className="pb-3 font-semibold">الفرع</th>
                  <th className="pb-3 font-semibold">بداية الوردية</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                  <th className="pb-3 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b last:border-0 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs">أم</div>
                      <div>
                        <p className="font-bold text-sm">أحمد محمود</p>
                        <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>كاشير</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-semibold">الفرع الرئيسي</td>
                  <td className="py-4 text-sm font-semibold">08:00 صباحاً</td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      وردية نشطة
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                      إنهاء الوردية
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
