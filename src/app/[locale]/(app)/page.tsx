"use client";

import React, { useState } from 'react';

export default function FullDashboardSystem() {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentLang, setCurrentLang] = useState("ar");

  // بيانات النظام الإحصائية
  const stats = {
    totalBranches: 4,
    totalEmployees: 2,
    todayAttendance: 0,
    activeShifts: 1
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ==================== 1. هيدر التحكم (تغيير اللغة والمود) ==================== */}
      <header className={`border-b ${isDarkMode ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200'} sticky top-0 z-50 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
              LK
            </div>
            <span className="font-bold text-lg hidden sm:block">L-K-Shift</span>
          </div>

          {/* أدوات الهيدر: المود والليلي واللغة */}
          <div className="flex items-center gap-3">
            
            {/* زر تغيير المود (ليلي / نهاري) */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700 text-yellow-400 hover:bg-gray-800' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
              title="تغيير المظهر"
            >
              {isDarkMode ? (
                /* أيقونة الشمس للمود النهاري */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                /* أيقونة القمر للمود الليلي */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>

            {/* زر تغيير اللغة */}
            <button 
              onClick={() => setCurrentLang(currentLang === 'ar' ? 'en' : 'ar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/><path d="M2 12h20"/></svg>
              {currentLang === 'ar' ? 'English' : 'العربية'}
            </button>

            {/* صورة الحساب */}
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
              مأ
            </div>
          </div>

        </div>
      </header>

      {/* ==================== 2. محتوى لوحة التحكم الرئيسية ==================== */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* هيدر الصفحة والعمليات السريعة */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <h1 className="text-3xl font-bold mb-1">لوحة التحكم الرئيسية</h1>
            <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>نظرة عامة على الحضور والورديات وحالة الفروع الحالية</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              بدء وردية جديدة
            </button>
            <button className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${isDarkMode ? 'bg-[#1e1e1e] hover:bg-[#282828] text-gray-200 border-gray-700' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              تصدير التقرير
            </button>
          </div>
        </div>

        {/* سكشن الكروت الإحصائية الأربعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="إجمالي الفروع" value={stats.totalBranches} subtitle="4 فروع مسجلة بالنظام" isDark={isDarkMode} icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>} />
          <StatCard title="إجمالي الموظفين" value={stats.totalEmployees} subtitle="2 موظفين على النظام" isDark={isDarkMode} icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
          <StatCard title="سجلات حضور اليوم" value={stats.todayAttendance} subtitle="لا توجد حركات اليوم" isDark={isDarkMode} icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>} />
          <StatCard title="الورديات النشطة" value={stats.activeShifts} subtitle="1 وردية مفتوحة الان" highlight isDark={isDarkMode} icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        </div>

        {/* سكشن الجداول والأوامر السريعة */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* جدول الورديات والموظفين */}
          <div className={`lg:col-span-2 rounded-2xl border p-6 shadow-xl ${isDarkMode ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">سجل الورديات والحضور المباشر</h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>متابعة الورديات المفتوحة وحالة الحضور لكل فرع</p>
              </div>

              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className={`border text-xs rounded-xl px-3 py-2 outline-none ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
              >
                <option value="all">جميع الفروع</option>
                <option value="main">الفرع الرئيسي</option>
                <option value="maadi">فرع المعادي</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className={`border-b text-xs font-semibold ${isDarkMode ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-200'}`}>
                  <tr>
                    <th className="pb-3 px-3">الموظف</th>
                    <th className="pb-3 px-3">الفرع</th>
                    <th className="pb-3 px-3">بداية الوردية</th>
                    <th className="pb-3 px-3">الحالة</th>
                    <th className="pb-3 px-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-gray-800/60' : 'divide-gray-200'}`}>
                  <tr className={isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                    <td className="py-4 px-3 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs">أم</div>
                        <div>
                          <p className="font-semibold">أحمد محمود</p>
                          <p className="text-[11px] text-gray-400">كاشير</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3">الفرع الرئيسي</td>
                    <td className="py-4 px-3 text-xs opacity-70">08:00 صباحاً</td>
                    <td className="py-4 px-3">
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        وردية نشطة
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                        إنهاء الوردية
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* القائمة الجانبية */}
          <div className="space-y-6">
            <div className={`rounded-2xl border p-6 shadow-xl ${isDarkMode ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
              <div className="grid grid-cols-1 gap-3">
                <button className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isDarkMode ? 'bg-[#1e1e1e] hover:bg-[#282828] border-gray-800 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'}`}>
                  <span className="text-sm font-medium">تسجيل حضور يدوياً</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
                <button className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isDarkMode ? 'bg-[#1e1e1e] hover:bg-[#282828] border-gray-800 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'}`}>
                  <span className="text-sm font-medium">إضافة موظف جديد</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </div>

            <div className={`rounded-2xl border p-6 shadow-xl ${isDarkMode ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">حالة تشغيل الفروع</h2>
                <span className="text-[11px] text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded font-medium">4 فروع</span>
              </div>
              <div className="space-y-3">
                <div className={`flex justify-between items-center p-3 rounded-xl border ${isDarkMode ? 'bg-[#1e1e1e] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-xs font-medium">الفرع الرئيسي</span>
                  </div>
                  <span className="text-[11px] opacity-70">1 موظف متواجد</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, highlight = false, isDark = true }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode; highlight?: boolean; isDark?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${highlight ? (isDark ? 'bg-[#161f2d] border-blue-500/40' : 'bg-blue-50 border-blue-200') : (isDark ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200')}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold opacity-70">{title}</span>
        <div className={`p-2 rounded-xl border ${highlight ? 'bg-blue-600/20 text-blue-500 border-blue-500/30' : (isDark ? 'bg-[#1e1e1e] text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-600 border-gray-200')}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold mb-1">{value}</p>
        <p className="text-[11px] opacity-60">{subtitle}</p>
      </div>
    </div>
  );
}
