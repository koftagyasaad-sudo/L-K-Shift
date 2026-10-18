"use client";

import React, { useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";

export default function DashboardPage() {
  const pathname = usePathname();
  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";
  const { isDarkMode } = useContext(ThemeContext);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

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
            نظرة عامة على الإحصائيات (أدوات الوردية والتقارير متوفرة داخل صفحة كل فرع)
          </p>
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
        </Link>

        <Link href={`/${currentLocale}/admin/employees`} className={`${cardClass} ${linkHoverClass} block`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <span className="text-3xl font-black">12</span>
          </div>
          <h3 className="font-bold text-lg">إجمالي الموظفين</h3>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions Additions */}
        <div className={`lg:col-span-1 ${cardClass}`}>
          <h3 className="font-bold text-lg mb-4">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setIsLeaveModalOpen(true)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors font-semibold ${
              isDarkMode ? "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}>
              طلب إجازة أو إذن
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <Link href={`/${currentLocale}/admin/employees`} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors font-semibold ${
              isDarkMode ? "border-gray-800 bg-[#1a1a1a] hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
            }`}>
              إضافة موظف جديد
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all ${
            isDarkMode ? "bg-[#141414] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <h2 className="text-xl font-black">تقديم طلب جديد</h2>
              <button onClick={() => setIsLeaveModalOpen(false)} className={`p-2 rounded-xl ${isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-200"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">نوع الطلب</label>
                <select className={`w-full px-4 py-3.5 rounded-xl border outline-none font-semibold ${isDarkMode ? "bg-[#0d0d0d] border-gray-800 focus:border-orange-500" : "bg-gray-50 border-gray-300 focus:border-orange-500"}`}>
                  <option>إجازة اعتيادية</option>
                  <option>إجازة مرضية</option>
                  <option>إذن انصراف مبكر</option>
                  <option>إذن تأخير حضور</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">التاريخ</label>
                <input type="date" className={`w-full px-4 py-3.5 rounded-xl border outline-none font-semibold ${isDarkMode ? "bg-[#0d0d0d] border-gray-800 focus:border-orange-500" : "bg-gray-50 border-gray-300 focus:border-orange-500"}`} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">السبب (للمدير)</label>
                <textarea rows={3} className={`w-full px-4 py-3.5 rounded-xl border outline-none font-semibold ${isDarkMode ? "bg-[#0d0d0d] border-gray-800 focus:border-orange-500" : "bg-gray-50 border-gray-300 focus:border-orange-500"}`}></textarea>
              </div>
            </div>
            <div className={`p-6 border-t flex gap-3 ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <button onClick={() => { alert("تم إرسال الطلب للمدير للمراجعة."); setIsLeaveModalOpen(false); }} className="px-6 py-3 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all">
                إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
