"use client";

import React, { useContext, useState } from "react";
import { ThemeContext } from "../../layout";

export default function RolesPage() {
  const { isDarkMode } = useContext(ThemeContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cardClass = `rounded-2xl p-6 border transition-colors ${
    isDarkMode ? "bg-[#111111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">إدارة الأدوار والصلاحيات</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            التحكم في صلاحيات المستخدمين وتحديد الإدارات والفروع المتاحة لهم
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة صلاحية جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Existing Roles Examples */}
        <div className={cardClass}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg">أدمن النظام (Absolute)</h3>
            <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded font-bold">كل الصلاحيات</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded text-xs font-mono ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>all.system.access</span>
          </div>
        </div>
        <div className={cardClass}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg">مدير فرع</h3>
            <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded font-bold">8 صلاحيات</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded text-xs font-mono ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>attendance.view</span>
            <span className={`px-2 py-1 rounded text-xs font-mono ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>employees.view</span>
          </div>
        </div>
      </div>

      {/* Role Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${
            isDarkMode ? "bg-[#1a1a1a] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
              <h2 className="text-xl font-black">إضافة صلاحية جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className={isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">اسم الصلاحية</label>
                <input 
                  type="text" 
                  placeholder="مثال: مشرف المخزون" 
                  className={`w-full px-4 py-3 rounded-xl border outline-none font-semibold ${
                    isDarkMode ? "bg-[#111111] border-gray-800 focus:border-red-500 text-white" : "bg-gray-50 border-gray-300 focus:border-red-500 text-gray-900"
                  }`}
                />
              </div>

              {/* Branch Assignment Feature As Requested */}
              <div>
                <label className="block text-sm font-bold mb-2 text-orange-500">تخصيص الفروع (اختياري)</label>
                <select className={`w-full px-4 py-3 rounded-xl border outline-none font-semibold ${
                  isDarkMode ? "bg-[#111111] border-gray-800 focus:border-orange-500 text-white" : "bg-gray-50 border-gray-300 focus:border-orange-500 text-gray-900"
                }`}>
                  <option>السماح بكل الفروع (افتراضي)</option>
                  <option>الفرع الرئيسي فقط</option>
                  <option>فرع القاهرة والجيزة فقط</option>
                </select>
                <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>حدد الفروع التي يُسمح لهذا الدور بإدارتها ومتابعتها.</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3">الإدارة والصلاحيات العامة</label>
                <div className="grid grid-cols-2 gap-4">
                  {['إدارة الموظفين', 'إدارة الفروع', 'مراجعة الحضور', 'عرض التقارير'].map(perm => (
                    <label key={perm} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      isDarkMode ? "border-gray-800 bg-[#111] hover:border-gray-600" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}>
                      <input type="checkbox" className="w-5 h-5 accent-red-500 rounded" />
                      <span className="font-semibold text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex gap-3 ${isDarkMode ? "border-gray-800 bg-[#141414]" : "border-gray-100 bg-gray-50"}`}>
              <button className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-colors">
                حفظ الصلاحية
              </button>
              <button onClick={() => setIsModalOpen(false)} className={`px-8 py-3 rounded-xl font-bold border transition-colors ${
                isDarkMode ? "border-gray-700 hover:bg-gray-800 text-gray-300" : "border-gray-300 hover:bg-gray-200 text-gray-700"
              }`}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
