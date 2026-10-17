"use client";

import React, { useContext, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";

// قاعدة بيانات وهمية متقدمة للبصمات والموظفين
const MOCK_EMPLOYEES_DATA = [
  { 
    id: "EMP-001", name: "أحمد محمود", role: "كاشير", branch: "الفرع الرئيسي", avatar: "أم", 
    attendance: { date: "2023-11-01", checkIn: "08:05 ص", checkOut: "17:15 م", totalHours: "9 ساعات و 10 دقيقة", status: "مكتمل", overTime: true }
  },
  { 
    id: "EMP-002", name: "سارة حسن", role: "مشرفة صالة", branch: "فرع المعادي", avatar: "سح", 
    attendance: { date: "2023-11-01", checkIn: "09:10 ص", checkOut: "17:00 م", totalHours: "7 ساعات و 50 دقيقة", status: "تأخير", overTime: false }
  },
  { 
    id: "EMP-003", name: "محمد علي", role: "طباخ رئيسي", branch: "فرع المعادي", avatar: "مع", 
    attendance: { date: "2023-11-01", checkIn: "08:00 ص", checkOut: "18:00 م", totalHours: "10 ساعات", status: "مكتمل", overTime: true }
  },
  { 
    id: "EMP-004", name: "عمر خالد", role: "عامل نظافة", branch: "فرع مدينة نصر", avatar: "عخ", 
    attendance: { date: "2023-11-01", checkIn: "-", checkOut: "-", totalHours: "-", status: "غائب", overTime: false }
  },
];

export default function EmployeesDataPage() {
  const { isDarkMode } = useContext(ThemeContext);

  // حالات الفلاتر (Filters State)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("الكل");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const cardClass = `rounded-3xl p-6 border transition-all ${
    isDarkMode ? "bg-[#111111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"
  }`;

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none font-semibold transition-all ${
    isDarkMode ? "bg-[#1a1a1a] border-gray-700 focus:border-orange-500 text-white" : "bg-gray-50 border-gray-300 focus:border-orange-500 text-gray-900"
  }`;

  // دالة لتصدير الإكسيل (محاكاة)
  const handleExportExcel = () => {
    alert("جارٍ تحضير وتصدير شيت الإكسيل بناءً على الفلاتر المختارة...");
  };

  // تطبيق الفلاتر على البيانات
  const filteredData = MOCK_EMPLOYEES_DATA.filter((emp) => {
    const matchesSearch = emp.name.includes(searchTerm) || emp.id.includes(searchTerm);
    const matchesBranch = selectedBranch === "الكل" || emp.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">سجل الموظفين والبصمات</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            إدارة متقدمة لعرض تفاصيل الموظفين، تتبع البصمات وحساب ساعات الحضور والانصراف.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
            تصدير شيت إكسيل
          </button>
          <button className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            إضافة موظف
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <h3 className="text-lg font-extrabold">لوحة الفلاتر المخصصة</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Employee Name/ID Search */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>البحث بالاسم أو الكود</label>
            <input 
              type="text" 
              placeholder="مثال: أحمد محمود, EMP-001..." 
              className={inputClass}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Branch Filter */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>تحديد الفرع</label>
            <select 
              className={inputClass}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="الكل">جميع الفروع</option>
              <option value="الفرع الرئيسي">الفرع الرئيسي</option>
              <option value="فرع المعادي">فرع المعادي</option>
              <option value="فرع مدينة نصر">فرع مدينة نصر</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>من تاريخ (البصمات)</label>
            <input 
              type="date" 
              className={inputClass}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>إلى تاريخ (البصمات)</label>
            <input 
              type="date" 
              className={inputClass}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className={`border-b ${isDarkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                <th className="pb-4 font-bold">الموظف / البيانات الأساسية</th>
                <th className="pb-4 font-bold">الفرع والوظيفة</th>
                <th className="pb-4 font-bold">بصمة الدخول</th>
                <th className="pb-4 font-bold">بصمة الخروج</th>
                <th className="pb-4 font-bold text-center">الإجمالي المُحتسب</th>
                <th className="pb-4 font-bold text-center">حالة اليوم</th>
                <th className="pb-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((emp) => (
                  <tr key={emp.id} className={`border-b last:border-0 hover:${isDarkMode ? "bg-gray-800/30" : "bg-gray-50"} transition-colors ${isDarkMode ? "border-gray-800/60" : "border-gray-100"}`}>
                    
                    {/* Employee Info */}
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-sm border border-orange-500/20">
                          {emp.avatar}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm">{emp.name}</p>
                          <p className={`text-xs font-mono font-bold ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{emp.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role & Branch */}
                    <td className="py-5">
                      <p className="font-bold text-sm">{emp.branch}</p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{emp.role}</p>
                    </td>

                    {/* Check In */}
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${emp.attendance.checkIn !== "-" ? "bg-emerald-500" : "bg-gray-400"}`}></div>
                        <span className="font-bold font-mono text-sm">{emp.attendance.checkIn}</span>
                      </div>
                    </td>

                    {/* Check Out */}
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${emp.attendance.checkOut !== "-" ? "bg-red-500" : "bg-gray-400"}`}></div>
                        <span className="font-bold font-mono text-sm">{emp.attendance.checkOut}</span>
                      </div>
                    </td>

                    {/* Total Hours */}
                    <td className="py-5 text-center">
                      <span className="font-extrabold text-sm text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 inline-block">
                        {emp.attendance.totalHours}
                      </span>
                      {emp.attendance.overTime && (
                        <p className="text-[10px] font-bold text-orange-500 mt-1">+ وقت إضافي مسجل</p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-5 text-center">
                      {emp.attendance.status === "مكتمل" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">حاضر / مكتمل</span>
                      )}
                      {emp.attendance.status === "تأخير" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">تأخير مسجل</span>
                      )}
                      {emp.attendance.status === "غائب" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">غائب</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-5 text-center">
                      <button className={`p-2.5 rounded-xl transition-all ${
                        isDarkMode ? "hover:bg-gray-800 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                      }`} title="تعديل بصمة الموظف">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" className={`mb-4 ${isDarkMode ? "text-gray-800" : "text-gray-300"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      <p className={`font-bold text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>لا توجد بيانات مطابقة للبحث أو الفلاتر المحددة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
