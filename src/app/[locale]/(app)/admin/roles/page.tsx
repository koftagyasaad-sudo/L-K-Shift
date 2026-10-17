"use client";

import React, { useContext, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";

const AVAILABLE_BRANCHES = [
  { id: "b1", name: "الفرع الرئيسي - القاهرة" },
  { id: "b2", name: "فرع المعادي" },
  { id: "b3", name: "فرع مدينة نصر" },
  { id: "b4", name: "فرع الإسكندرية" },
  { id: "b5", name: "فرع 6 أكتوبر" }
];

const SYSTEM_PERMISSIONS = [
  { id: "emp_mgmt", label: "إدارة الموظفين والبيانات" },
  { id: "branch_mgmt", label: "إدارة الفروع والورديات" },
  { id: "att_review", label: "مراجعة وتسجيل الحضور والانصراف" },
  { id: "rep_view", label: "عرض وتصدير التقارير المالية" },
  { id: "cash_ctrl", label: "إدارة الخزينة والسيولة" },
  { id: "roles_ctrl", label: "تعديل صلاحيات المديرين والأدمن" }
];

export default function RolesPage() {
  const { isDarkMode } = useContext(ThemeContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [allBranchesSelected, setAllBranchesSelected] = useState(true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const [rolesList, setRolesList] = useState([
    {
      id: "1",
      name: "أدمن النظام المطلق",
      allBranches: true,
      branches: [],
      permissions: SYSTEM_PERMISSIONS.map(p => p.id),
      badge: "صلاحيات مطلقة"
    },
    {
      id: "2",
      name: "مدير فرع المعادي ومدينة نصر",
      allBranches: false,
      branches: ["b2", "b3"],
      permissions: ["emp_mgmt", "branch_mgmt", "att_review"],
      badge: "مخصص لفروع"
    }
  ]);

  const toggleBranchSelection = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter(id => id !== branchId));
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
    }
  };

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleSaveRole = () => {
    if (!roleName.trim()) return;

    const newRole = {
      id: Date.now().toString(),
      name: roleName,
      allBranches: allBranchesSelected,
      branches: allBranchesSelected ? [] : selectedBranches,
      permissions: selectedPermissions,
      badge: allBranchesSelected ? "كل الفروع" : `${selectedBranches.length} فروع مخصصة`
    };

    setRolesList([...rolesList, newRole]);
    setIsModalOpen(false);
    setRoleName("");
    setAllBranchesSelected(true);
    setSelectedBranches([]);
    setSelectedPermissions([]);
  };

  const cardClass = `rounded-2xl p-6 border transition-all ${
    isDarkMode ? "bg-[#111111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">إدارة الأدوار والصلاحيات</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            تحديـد الصلاحيات الدقيقة وتخصيص الفروع لكل مدير أو موظف
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة صلاحية جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rolesList.map((role) => (
          <div key={role.id} className={cardClass}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-extrabold text-xl mb-1">{role.name}</h3>
                <span className="inline-block bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs px-3 py-1 rounded-full font-bold">
                  {role.badge}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className={`text-xs font-bold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>الفروع المتاحة:</p>
              <div className="flex flex-wrap gap-2">
                {role.allBranches ? (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isDarkMode ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                    جميع الفروع المسجلة بالنظام
                  </span>
                ) : (
                  role.branches.map(bId => {
                    const branchObj = AVAILABLE_BRANCHES.find(b => b.id === bId);
                    return (
                      <span key={bId} className={`px-3 py-1 rounded-lg text-xs font-bold ${isDarkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                        {branchObj?.name}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <p className={`text-xs font-bold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>الصلاحيات الممنوحة ({role.permissions.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map(pId => {
                  const permObj = SYSTEM_PERMISSIONS.find(p => p.id === pId);
                  return (
                    <span key={pId} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                      {permObj?.label || pId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border transition-all ${
            isDarkMode ? "bg-[#141414] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <h2 className="text-xl font-black">إضافة صلاحية جديدة وتحديد الفروع</h2>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-xl transition-colors ${isDarkMode ? "text-gray-400 hover:bg-gray-800 hover:text-white" : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold mb-2">اسم الصلاحية / المسمى الوظيفي</label>
                <input 
                  type="text" 
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="مثال: مدير فرع المعادي ومسؤول الحضور" 
                  className={`w-full px-4 py-3.5 rounded-xl border outline-none font-semibold transition-all ${
                    isDarkMode ? "bg-[#0d0d0d] border-gray-800 focus:border-red-500 text-white" : "bg-gray-50 border-gray-300 focus:border-red-500 text-gray-900"
                  }`}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-extrabold text-orange-500">
                  تخصيص الفروع المسموح بها لهذا الدور:
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  allBranchesSelected 
                    ? "border-orange-500/50 bg-orange-500/10" 
                    : isDarkMode ? "border-gray-800 bg-[#0d0d0d]" : "border-gray-200 bg-gray-50"
                }`}>
                  <input 
                    type="checkbox" 
                    checked={allBranchesSelected}
                    onChange={(e) => {
                      setAllBranchesSelected(e.target.checked);
                      if (e.target.checked) setSelectedBranches([]);
                    }}
                    className="w-5 h-5 accent-orange-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-sm block">السماح والوصول لجميع الفروع (افتراضي)</span>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>تمنح المستخدم رؤية وشاملة لكل الفروع الحالية والمستقبلية</span>
                  </div>
                </label>

                {!allBranchesSelected && (
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                      className={`w-full flex justify-between items-center p-4 rounded-xl border font-bold text-sm transition-all ${
                        isDarkMode ? "bg-[#0d0d0d] border-gray-800 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    >
                      <span>
                        {selectedBranches.length === 0 
                          ? "اضغط لاختيار الفروع المخصصة..." 
                          : `تم تحديد (${selectedBranches.length}) فروع`}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>

                    {isBranchDropdownOpen && (
                      <div className={`mt-2 p-3 rounded-2xl border shadow-xl space-y-2 z-10 relative ${
                        isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-200"
                      }`}>
                        {AVAILABLE_BRANCHES.map((branch) => {
                          const isChecked = selectedBranches.includes(branch.id);
                          return (
                            <label key={branch.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              isChecked 
                                ? "border-blue-500/40 bg-blue-500/10" 
                                : isDarkMode ? "border-gray-800 hover:bg-[#222]" : "border-gray-100 hover:bg-gray-50"
                            }`}>
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBranchSelection(branch.id)}
                                className="w-4 h-4 accent-blue-600 rounded"
                              />
                              <span className="font-bold text-sm">{branch.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-3">الإدارة والصلاحيات العامة</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYSTEM_PERMISSIONS.map(perm => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label key={perm.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        isChecked 
                          ? "border-red-500/40 bg-red-500/10" 
                          : isDarkMode ? "border-gray-800 bg-[#0d0d0d] hover:border-gray-700" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="w-4 h-4 accent-red-600 rounded" 
                        />
                        <span className="font-semibold text-xs">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex gap-3 ${isDarkMode ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-gray-50"}`}>
              <button 
                onClick={handleSaveRole}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all"
              >
                حفظ الصلاحية
              </button>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className={`px-8 py-3 rounded-xl font-bold border transition-all ${
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
