"use client";

import React, { useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";

export default function BranchesListPage() {
  const { isDarkMode } = useContext(ThemeContext);
  const pathname = usePathname();
  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [branches, setBranches] = useState([
    { id: "1", name: "الفرع الرئيسي - القاهرة", manager: "أحمد محمود", employeesCount: 15, status: "نشط", code: "BR-01" },
    { id: "2", name: "فرع المعادي", manager: "سارة حسن", employeesCount: 8, status: "نشط", code: "BR-02" },
    { id: "3", name: "فرع مدينة نصر", manager: "محمد علي", employeesCount: 12, status: "نشط", code: "BR-03" },
    { id: "4", name: "فرع الإسكندرية", manager: "خالد عمر", employeesCount: 6, status: "نشط", code: "BR-04" }
  ]);

  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchManager, setNewBranchManager] = useState("");

  const handleAddBranch = () => {
    if (!newBranchName.trim()) return;
    const newBranch = {
      id: Date.now().toString(),
      name: newBranchName,
      manager: newBranchManager || "لم يحدد بعد",
      employeesCount: 0,
      status: "نشط",
      code: `BR-0${branches.length + 1}`
    };
    setBranches([...branches, newBranch]);
    setNewBranchName("");
    setNewBranchManager("");
    setIsModalOpen(false);
  };

  const cardClass = `rounded-2xl p-6 border transition-all ${
    isDarkMode ? "bg-[#111111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">إدارة الفروع</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            عرض كل الفروع وإدارتها، أو اضغط على أي فرع للدخول إلى صفحته الخاصة لرؤية التفاصيل
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة فرع جديد
        </button>
      </div>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className={`border-b ${isDarkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                <th className="pb-4 font-bold">كود الفرع</th>
                <th className="pb-4 font-bold">اسم الفرع</th>
                <th className="pb-4 font-bold">المدير المسؤول</th>
                <th className="pb-4 font-bold">عدد الموظفين</th>
                <th className="pb-4 font-bold">الحالة</th>
                <th className="pb-4 font-bold text-center">تفاصيل الفرع (ID)</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className={`border-b last:border-0 ${isDarkMode ? "border-gray-800/60" : "border-gray-100"}`}>
                  <td className="py-4 font-mono font-bold text-sm text-orange-500">{b.code}</td>
                  <td className="py-4 font-extrabold text-base">{b.name}</td>
                  <td className="py-4 font-semibold text-sm">{b.manager}</td>
                  <td className="py-4 font-bold text-sm">{b.employeesCount} موظف</td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <Link 
                      href={`/${currentLocale}/admin/branches/${b.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 transition-all"
                    >
                      <span>عرض الفرع #{b.id}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border transition-all ${
            isDarkMode ? "bg-[#141414] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <h2 className="text-xl font-black">إضافة فرع جديد</h2>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-xl ${isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-200"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">اسم الفرع</label>
                <input 
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="مثال: فرع الشيخ زايد"
                  className={`w-full px-4 py-3.5 rounded-xl border outline-none font-semibold ${
                    isDarkMode ? "bg-[#0d0d0d] border-gray-800 focus:border-orange-500 text-white" : "bg-gray-50 border-gray-300 focus:border-orange-500 text-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">المدير المسؤول (اختياري)</label>
                <input 
                  type="text"
                  value={newBranchManager}
                  onChange={(e) => setNewBranchManager(e.target.value)}
                  placeholder="اسم مدير الفرع"
                  className={`w-full px-4 py-3.5 rounded-xl border outline-none font-semibold ${
                    isDarkMode ? "bg-[#0d0d0d] border-gray-800 focus:border-orange-500 text-white" : "bg-gray-50 border-gray-300 focus:border-orange-500 text-gray-900"
                  }`}
                />
              </div>
            </div>

            <div className={`p-6 border-t flex gap-3 ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <button 
                onClick={handleAddBranch}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all"
              >
                حفظ الفرع
              </button>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className={`px-6 py-3 rounded-xl font-bold border transition-all ${
                  isDarkMode ? "border-gray-700 hover:bg-gray-800 text-gray-300" : "border-gray-300 hover:bg-gray-200 text-gray-700"
                }`}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
