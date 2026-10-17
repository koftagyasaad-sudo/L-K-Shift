"use client";

import React from 'react';
import { 
  Users, 
  Building2, 
  CalendarCheck, 
  Activity, 
  Clock, 
  ArrowUpRight,
  PlusCircle
} from 'lucide-react';

export default function DashboardPage() {
  // بيانات إحصائية افتراضية - يمكنك ربطها بـ API لاحقاً
  const stats = {
    attendanceRecords: 0,
    totalEmployees: 2,
    totalBranches: 4,
    activeShifts: 1
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* رأس الصفحة (Header Section) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة التحكم الرئيسية</h1>
            <p className="text-gray-400">نظرة عامة على الحضور، الفروع، والنشاط الحالي للنظام</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg font-medium text-sm">
              <PlusCircle size={18} />
              إضافة وردية جديدة
            </button>
          </div>
        </div>

        {/* قسم البطاقات الإحصائية المسترجعة (Stats Section) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard 
            title="سجلات الحضور" 
            value={stats.attendanceRecords} 
            icon={<CalendarCheck size={24} />} 
          />
          <StatCard 
            title="إجمالي الموظفين" 
            value={stats.totalEmployees} 
            icon={<Users size={24} />} 
          />
          <StatCard 
            title="إجمالي الفروع" 
            value={stats.totalBranches} 
            icon={<Building2 size={24} />} 
          />
          <StatCard 
            title="الورديات النشطة" 
            value={stats.activeShifts} 
            icon={<Activity size={24} />} 
            trend="+1 عن الأمس"
          />
        </div>

        {/* الأقسام الرئيسية المفقودة (Main Content Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* جدول أحدث حركات الحضور والانصراف */}
          <div className="lg:col-span-2 bg-[#141414] rounded-xl border border-gray-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">أحدث حركات الحضور والانصراف</h2>
              <button className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                عرض السجل الكامل <ArrowUpRight size={16} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="text-gray-400 border-b border-gray-800 text-sm">
                  <tr>
                    <th className="pb-4 font-medium px-2">اسم الموظف</th>
                    <th className="pb-4 font-medium px-2">الفرع</th>
                    <th className="pb-4 font-medium px-2">الحالة</th>
                    <th className="pb-4 font-medium px-2">الوقت والتاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-2 font-medium">أحمد محمود</td>
                    <td className="py-4 px-2 text-gray-300">الفرع الرئيسي</td>
                    <td className="py-4 px-2">
                      <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-medium">
                        تسجيل حضور
                      </span>
                    </td>
                    <td className="py-4 px-2 text-gray-400 text-sm">08:00 ص - اليوم</td>
                  </tr>
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-2 font-medium">سعد طارق</td>
                    <td className="py-4 px-2 text-gray-300">فرع المعادي</td>
                    <td className="py-4 px-2">
                      <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-medium">
                        تسجيل انصراف
                      </span>
                    </td>
                    <td className="py-4 px-2 text-gray-400 text-sm">11:30 م - الأمس</td>
                  </tr>
                  {stats.attendanceRecords === 0 && (
                     <tr>
                       <td colSpan={4} className="text-center py-8 text-gray-500">
                         لا توجد سجلات حضور جديدة اليوم
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* العمود الجانبي (Side Panel) */}
          <div className="space-y-6">
            
            {/* إتاحة الوصول السريع */}
            <div className="bg-[#141414] rounded-xl border border-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-5">إجراءات سريعة</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white py-3 rounded-lg transition-colors border border-gray-700 font-medium text-sm">
                  <Clock size={18} />
                  تسجيل حركة يدوية
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white py-3 rounded-lg transition-colors border border-gray-700 font-medium text-sm">
                  <Users size={18} />
                  إدارة الموظفين
                </button>
              </div>
            </div>

            {/* حالة الفروع الحالية */}
            <div className="bg-[#141414] rounded-xl border border-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-5">حالة تشغيل الفروع</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-gray-200 text-sm">الفرع الرئيسي</span>
                  </div>
                  <span className="text-xs text-gray-400">12 موظف نشط</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-gray-200 text-sm">فرع المعادي</span>
                  </div>
                  <span className="text-xs text-gray-500">مغلق حالياً</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Sub-component
function StatCard({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="bg-[#141414] p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium text-sm md:text-base">{title}</h3>
        <div className="text-gray-400 group-hover:text-white transition-colors p-2 bg-gray-800/40 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
        {trend && (
          <p className="text-emerald-500 text-xs mt-2 font-medium bg-emerald-500/10 inline-block px-2 py-1 rounded">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
