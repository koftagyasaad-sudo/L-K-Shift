"use client";

import React, { useContext } from "react";
import { ThemeContext } from "../../layout";

export default function BranchesPage() {
  const { isDarkMode } = useContext(ThemeContext);

  const cardClass = `rounded-2xl p-6 border transition-colors ${
    isDarkMode ? "bg-[#111111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">إدارة الفروع</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            إضافة وتعديل وإدارة الفروع التابعة للنظام
          </p>
        </div>
        <button className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة فرع جديد
        </button>
      </div>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className={`border-b ${isDarkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                <th className="pb-3 font-semibold">اسم الفرع</th>
                <th className="pb-3 font-semibold">المدير المسؤول</th>
                <th className="pb-3 font-semibold">عدد الموظفين</th>
                <th className="pb-3 font-semibold">الحالة</th>
                <th className="pb-3 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {/* Example Data */}
              {[1, 2, 3, 4].map((branch) => (
                <tr key={branch} className={`border-b last:border-0 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
                  <td className="py-4 font-bold">الفرع {branch}</td>
                  <td className="py-4 font-semibold text-sm">لم يحدد بعد</td>
                  <td className="py-4 font-semibold text-sm">12 موظف</td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      مفعل
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <button className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      isDarkMode ? "border-gray-700 hover:bg-gray-800 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                    }`}>
                      إدارة الفرع
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
