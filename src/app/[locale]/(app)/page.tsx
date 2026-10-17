"use client";

import React from 'react';

export default function DashboardPage() {
  // البيانات الإحصائية
  const stats = {
    attendanceRecords: 0,
    totalEmployees: 2,
    totalBranches: 4,
    activeShifts: 1
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* رأس الصفحة */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة التحكم الرئيسية</h1>
            <p className="text-gray-400">نظرة عامة على الحضور، الفروع، والنشاط الحالي للنظام</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-all px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
              إضافة وردية جديدة
            </button>
          </div>
        </div>

        {/* 1. قسم البطاقات الإحصائية العلوية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="إجمالي الفروع" 
            value={stats.totalBranches} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>} 
          />
          <StatCard 
            title="إجمالي الموظفين" 
            value={stats.totalEmployees} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} 
          />
          <StatCard 
            title="سجلات الحضور" 
            value={stats.attendanceRecords} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>} 
          />
        </div>

        {/* 2. الأقسام الرئيسية المسترجعة (جدول الحضور + الإجراءات السريعة + الفروع) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* جدول أحدث حركات الحضور والانصراف */}
          <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-gray-800/80 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">أحدث حركات الحضور والانصراف</h2>
              <span className="text-xs text-gray-400 bg-gray-800/60 px-3 py-1 rounded-full border border-gray-700/50">تحديث مباشر</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="text-gray-400 border-b border-gray-800 text-sm">
                  <tr>
                    <th className="pb-4 font-medium px-4">اسم الموظف</th>
                    <th className="pb-4 font-medium px-4">الفرع</th>
                    <th className="pb-4 font-medium px-4">الحالة</th>
                    <th className="pb-4 font-medium px-4">الوقت والتاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-200">أحمد محمود</td>
                    <td className="py-4 px-4 text-gray-400">الفرع الرئيسي</td>
                    <td className="py-4 px-4">
                      <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                        تسجيل حضور
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">08:00 ص - اليوم</td>
                  </tr>
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-200">سعد طارق</td>
                    <td className="py-4 px-4 text-gray-400">فرع المعادي</td>
                    <td className="py-4 px-4">
                      <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-medium border border-red-500/20">
                        تسجيل انصراف
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">11:30 م - الأمس</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* القائمة الجانبية */}
          <div className="space-y-6">
            
            {/* قسم الإجراءات السريعة */}
            <div className="bg-[#141414] rounded-2xl border border-gray-800/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-5">إجراءات سريعة</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#282828] text-gray-200 py-3.5 rounded-xl transition-all border border-gray-700/50 font-medium text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  تسجيل حركة يدوية
                </button>
                <button className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#282828] text-gray-200 py-3.5 rounded-xl transition-all border border-gray-700/50 font-medium text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  إدارة الموظفين
                </button>
              </div>
            </div>

            {/* قسم حالة تشغيل الفروع */}
            <div className="bg-[#141414] rounded-2xl border border-gray-800/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-5">حالة تشغيل الفروع</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 bg-[#1e1e1e] rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-gray-200 text-sm font-medium">الفرع الرئيسي</span>
                  </div>
                  <span className="text-xs text-gray-400">نشط</span>
                </div>
                
                <div className="flex justify-between items-center p-3.5 bg-[#1e1e1e] rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <span className="text-gray-200 text-sm font-medium">فرع المعادي</span>
                  </div>
                  <span className="text-xs text-gray-500">مغلق</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#141414] p-6 rounded-2xl border border-gray-800/80 flex flex-col justify-between hover:border-gray-700 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
        <div className="text-gray-400 p-2.5 bg-[#1e1e1e] rounded-xl border border-gray-800">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-4xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
