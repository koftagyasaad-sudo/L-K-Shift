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
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  const [branches, setBranches] = useState([
    { id: "1", name: "الفرع الرئيسي - القاهرة", manager: "أحمد محمود", employeesCount: 15, status: "نشط", code: "BR-01" },
    { id: "2", name: "فرع المعادي", manager: "سارة حسن", employeesCount: 8, status: "نشط", code: "BR-02" },
    { id: "3", name: "فرع مدينة نصر", manager: "محمد علي", employeesCount: 12, status: "نشط", code: "BR-03" },
    { id: "4", name: "فرع الإسكندرية", manager: "خالد عمر", employeesCount: 6, status: "نشط", code: "BR-04" }
  ]);

  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchManager, setNewBranchManager] = useState("");

  const handleOpenAddModal = () => {
    setEditingBranchId(null);
    setNewBranchName("");
    setNewBranchManager("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: any) => {
    setEditingBranchId(branch.id);
    setNewBranchName(branch.name);
    setNewBranchManager(branch.manager);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من أنك تريد حذف "${name}" نهائياً؟`)) {
      setBranches(branches.filter(b => b.id !== id));
    }
  };

  const handleSaveBranch = () => {
    if (!newBranchName.trim()) return;

    if (editingBranchId) {
      // Update existing branch
      setBranches(branches.map(b => b.id === editingBranchId ? { ...b, name: newBranchName, manager: newBranchManager } : b));
    } else {
      // Add new branch
      const newBranch = {
        id: Date.now().toString(),
        name: newBranchName,
        manager: newBranchManager || "لم يحدد بعد",
        employeesCount: 0,
        status: "نشط",
        code: `BR-0${branches.length + 1}`
      };
      setBranches([...branches, newBranch]);
    }
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
            إضافة، تعديل، وحذف الفروع ومتابعة التفاصيل الخاصة بها
          </p>
        </div>
        <button 
          onClick={handleOpenAddModal}
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
                <th className="pb-4 font-bold text-center">الإجراءات المتاحة</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className={`border-b last:border-0 hover:${isDarkMode ? "bg-gray-800/30" : "bg-gray-50"} transition-colors ${isDarkMode ? "border-gray-800/60" : "border-gray-100"}`}>
                  <td className="py-4 font-mono font-bold text-sm text-orange-500">{b.code}</td>
                  <td className="py-4 font-extrabold text-base">{b.name}</td>
                  <td className="py-4 font-semibold text-sm">{b.manager}</td>
                  <td className="py-4 font-bold text-sm">{b.employeesCount} موظف</td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* View Details Button */}
                      <Link 
                        href={`/${currentLocale}/admin/branches/${b.id}`}
                        title="التفاصيل"
                        className="p-2 rounded-lg text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                      {/* Edit Button */}
                      <button 
                        onClick={() => handleOpenEditModal(b)}
                        title="تعديل"
                        className="p-2 rounded-lg text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDeleteBranch(b.id, b.name)}
                        title="حذف"
                        className="p-2 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
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
              <h2 className="text-xl font-black">{editingBranchId ? "تعديل بيانات الفرع" : "إضافة فرع جديد"}</h2>
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
                onClick={handleSaveBranch}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all"
              >
                {editingBranchId ? "حفظ التعديلات" : "إضافة الفرع"}
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
