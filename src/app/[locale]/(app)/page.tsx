"use client";

import React, { useState } from 'react';

export default function DashboardPage() {
  const [branchFilter, setBranchFilter] = useState("all");

  const stats = {
    totalBranches: 4,
    totalEmployees: 2,
    todayAttendance: 0,
    activeShifts: 1
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ==================== 1. هيدر الواجهة الرئيسية ==================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-white">لوحة التحكم الرئيسية</h1>
            <p className="text-gray-400 text-sm">نظرة عامة على الحضور والورديات وحالة الفروع الحالية</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              بدء وردية جديدة
            </button>
            <button className="flex items-center gap-2 bg-[#1e1e1e] hover:bg-[#282828] text-gray-200 border border-gray-700/60 px-4 py-2.5 rounded-xl font-medium text-sm transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              تصدير التقرير
            </button>
          </div>
        </div>

        {/* ==================== 2. سكشن البطاقات الإحصائية ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="إجمالي الفروع" 
            value={stats.totalBranches} 
            subtitle="4 فروع مسجلة للنظام"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>} 
          />
          <StatCard 
            title="إجمالي الموظفين" 
            value={stats.totalEmployees} 
            subtitle="2 موظفين على النظام"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 1 0 7.75"/></svg>} 
          />
          <StatCard 
            title="سجلات حضور اليوم" 
            value={stats.todayAttendance} 
            subtitle="لا توجد سجلات اليوم"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>} 
          />
          <StatCard 
            title="الورديات النشطة حالياً" 
            value={stats.activeShifts} 
            subtitle="1 وردية مفتوحة الان"
            highlight
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} 
          />
        </div>

        {/* ==================== 3. سكشن الجداول والإجراءات السريعة ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* جدول الورديات المباشرة والحضور */}
          <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-gray-800 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">سجل الورديات والحضور المباشر</h2>
                <p className="text-xs text-gray-400 mt-0.5">متابعة الورديات المفتوحة وحالة الحضور لكل فرع</p>
              </div>

              {/* فلترة الفروع */}
              <select 
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-[#1e1e1e] border border-gray-700 text-gray-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="all">جميع الفروع</option>
                <option value="main">الفرع الرئيسي</option>
                <option value="maadi">فرع المعادي</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="text-gray-400 border-b border-gray-800 text-xs font-semibold">
                  <tr>
                    <th className="pb-3 px-3">اسم الموظف</th>
                    <th className="pb-3 px-3">الفرع</th>
                    <th className="pb-3 px-3">وقت الدخول</th>
                    <th className="pb-3 px-3">الحالة</th>
                    <th className="pb-3 px-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-3 font-medium text-gray-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                          أم
                        </div>
                        <div>
                          <p className="font-semibold text-gray-100">أحمد محمود</p>
                          <p className="text-[11px] text-gray-400">كاشير</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-gray-300">الفرع الرئيسي</td>
                    <td className="py-4 px-3 text-gray-400 text-xs">08:00 صباحاً</td>
                    <td className="py-4 px-3">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        وردية نشطة
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                        إنهاء الوردية
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-3 font-medium text-gray-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                          ست
                        </div>
                        <div>
                          <p className="font-semibold text-gray-100">سعد طارق</p>
                          <p className="text-[11px] text-gray-400">مدير فرع</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-gray-300">فرع المعادي</td>
                    <td className="py-4 px-3 text-gray-400 text-xs">04:00 مساءً</td>
                    <td className="py-4 px-3">
                      <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        تم الانصراف
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <button className="text-xs bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg cursor-not-allowed">
                        مغلق
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* العمود الجانبي: الإجراءات السريعة وحالة الفروع */}
          <div className="space-y-6">
            
            {/* الإجراءات السريعة */}
            <div className="bg-[#141414] rounded-2xl border border-gray-800 p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
              <div className="grid grid-cols-1 gap-3">
                <button className="flex items-center justify-between bg-[#1e1e1e] hover:bg-[#282828] text-gray-200 p-3.5 rounded-xl border border-gray-800 transition-all">
                  <span className="text-sm font-medium">تسجيل حضور يدوياً</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
                <button className="flex items-center justify-between bg-[#1e1e1e] hover:bg-[#282828] text-gray-200 p-3.5 rounded-xl border border-gray-800 transition-all">
                  <span className="text-sm font-medium">إضافة موظف جديد</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </div>

            {/* حالة الفروع */}
            <div className="bg-[#141414] rounded-2xl border border-gray-800 p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">حالة تشغيل الفروع</h2>
                <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-medium">4 فروع</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-[#1e1e1e] rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-gray-200 text-xs font-medium">الفرع الرئيسي</span>
                  </div>
                  <span className="text-[11px] text-gray-400">1 موظف متواجد</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#1e1e1e] rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-600"></span>
                    <span className="text-gray-200 text-xs font-medium">فرع المعادي</span>
                  </div>
                  <span className="text-[11px] text-gray-400">مغلق</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, highlight = false }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${highlight ? 'bg-[#161f2d] border-blue-500/40 shadow-lg shadow-blue-900/10' : 'bg-[#141414] border-gray-800 hover:border-gray-700'}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-400 text-xs font-semibold">{title}</span>
        <div className={`p-2 rounded-xl border ${highlight ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-[#1e1e1e] text-gray-400 border-gray-800'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
        <p className="text-[11px] text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
