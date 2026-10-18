"use client";

import React, { useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";

// استدعاء دوال السيرفر التي تتصل بـ Neon
import { getBranches, addBranch, deleteBranch } from "@/actions/branchActions";

export default function BranchesListPage() {
  const { isDarkMode } = useContext(ThemeContext);
  const pathname = usePathname();
  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل

  // 1. جلب البيانات من Neon عند فتح الصفحة
  useEffect(() => {
    const fetchNeonData = async () => {
      setIsLoading(true);
      const data = await getBranches(); // الاتصال بـ Neon
      setBranches(data);
      setIsLoading(false);
    };
    fetchNeonData();
  }, []);

  const [formData, setFormData] = useState({ name: "", manager: "", phone: "", ext: "", address: "", map: "" });

  const handleOpenAddModal = () => {
    setFormData({ name: "", manager: "", phone: "", ext: "", address: "", map: "" });
    setIsModalOpen(true);
  };

  // 2. حذف فرع من Neon
  const handleDeleteBranch = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف "${name}" نهائياً من قاعدة البيانات؟`)) {
      // تحديث الواجهة فوراً (Optimistic UI)
      setBranches(branches.filter(b => b.id !== id));
      
      // إرسال أمر الحذف لقاعدة بيانات Neon
      await deleteBranch(id);
    }
  };

  // 3. إضافة فرع لـ Neon
  const handleSaveBranch = async () => {
    if (!formData.name.trim()) return;

    const newBranch = {
      id: Date.now().toString(),
      ...formData,
      employeesCount: 0,
      status: "نشط",
      code: `BR-0${branches.length + 1}`
    };

    // تحديث الواجهة فوراً
    setBranches([...branches, newBranch]);
    setIsModalOpen(false);

    // إرسال البيانات للحفظ في Neon
    await addBranch(newBranch);
  };

  const cardClass = `rounded-2xl p-5 border transition-all ${isDarkMode ? "bg-[#0a0a0a] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"}`;
  const inputClass = `w-full px-4 py-2.5 text-sm rounded-lg border outline-none font-semibold ${isDarkMode ? "bg-[#111] border-gray-800 focus:border-orange-500 text-white" : "bg-gray-50 border-gray-300 focus:border-orange-500 text-gray-900"}`;

  if (isLoading) return <div className="p-10 text-center font-bold text-orange-500">جاري تحميل البيانات من قاعدة البيانات...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1">إدارة الفروع</h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>إضافة، تعديل، وحذف الفروع المدعومة بقاعدة بيانات Neon</p>
        </div>
        <button onClick={handleOpenAddModal} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة فرع
        </button>
      </div>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className={`border-b ${isDarkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                <th className="pb-3 font-bold">الفرع</th>
                <th className="pb-3 font-bold">المدير</th>
                <th className="pb-3 font-bold">الهاتف</th>
                <th className="pb-3 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className={`border-b last:border-0 hover:${isDarkMode ? "bg-gray-800/30" : "bg-gray-50"} transition-colors ${isDarkMode ? "border-gray-800/60" : "border-gray-100"}`}>
                  <td className="py-3">
                    <p className="font-extrabold">{b.name}</p>
                    <p className={`text-[11px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{b.code} | {b.address}</p>
                  </td>
                  <td className="py-3 font-semibold">{b.manager}</td>
                  <td className="py-3 font-semibold text-xs">{b.phone} (Ext: {b.ext})</td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link href={`/${currentLocale}/admin/branches/${b.id}`} className="p-1.5 rounded-md text-blue-500 hover:bg-blue-500/10 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Link>
                      <button onClick={() => handleDeleteBranch(b.id, b.name)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? "bg-[#0a0a0a] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-gray-800 bg-[#111]" : "border-gray-100 bg-gray-50"}`}>
              <h2 className="text-lg font-black">إضافة فرع</h2>
              <button onClick={() => setIsModalOpen(false)} className={`p-1.5 rounded-lg ${isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-200"}`}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold mb-1.5">اسم الفرع</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={inputClass} /></div>
              <div><label className="block text-xs font-bold mb-1.5">المدير المسؤول</label><input type="text" value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})} className={inputClass} /></div>
              <div><label className="block text-xs font-bold mb-1.5">رقم الهاتف</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={inputClass} /></div>
              <div><label className="block text-xs font-bold mb-1.5">الرقم الداخلي</label><input type="text" value={formData.ext} onChange={(e) => setFormData({...formData, ext: e.target.value})} className={inputClass} /></div>
              <div className="md:col-span-2"><label className="block text-xs font-bold mb-1.5">العنوان</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className={inputClass} /></div>
              <div className="md:col-span-2"><label className="block text-xs font-bold mb-1.5 text-blue-500">رابط جوجل ماب</label><input type="url" value={formData.map} onChange={(e) => setFormData({...formData, map: e.target.value})} className={inputClass} /></div>
            </div>

            <div className={`p-4 border-t flex gap-2 ${isDarkMode ? "border-gray-800 bg-[#111]" : "border-gray-100 bg-gray-50"}`}>
              <button onClick={handleSaveBranch} className="px-5 py-2 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-all">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
