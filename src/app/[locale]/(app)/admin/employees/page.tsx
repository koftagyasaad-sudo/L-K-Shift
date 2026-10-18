"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  Users, Plus, Search, Download, Edit, Trash2, 
  CheckCircle2, AlertCircle, Loader2, FileText
} from "lucide-react";
import { getEmployeesAction, saveEmployeeAction, deleteEmployeeAction, EmployeeData } from "@/actions/employeeActions";
import { getBranchesAction, BranchData } from "@/actions/branchActions";
import { getRolesAction, RoleData } from "@/actions/roleActions";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeData | null>(null);
  const [formData, setFormData] = useState<EmployeeData>({
    id: "",
    name: "",
    code: "",
    branch_id: "",
    role_id: "",
    base_salary: 5000,
    work_hours: 8,
    monthly_leave_days: 2, // الحقل الجديد للرصيد
    attendance_status: "حاضر"
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [empRes, branchRes, roleRes] = await Promise.all([
      getEmployeesAction(),
      getBranchesAction(),
      getRolesAction()
    ]);
    if (empRes.success) setEmployees(empRes.data);
    if (branchRes.success) setBranches(branchRes.data);
    if (roleRes.success) setRoles(roleRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenModal = (emp?: EmployeeData) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData(emp);
    } else {
      setEditingEmp(null);
      setFormData({
        id: "e-" + Date.now(),
        name: "",
        code: "EMP-" + Math.floor(100 + Math.random() * 900),
        branch_id: branches[0]?.id || "",
        role_id: roles[0]?.id || "",
        base_salary: 6000,
        work_hours: 8,
        monthly_leave_days: 2,
        attendance_status: "حاضر"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      setMessage({ type: "error", text: "يرجى تعبئة اسم ورقم الموظف" });
      return;
    }
    startTransition(async () => {
      const res = await saveEmployeeAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: "تم حفظ سجل الموظف بنجاح" });
        setIsModalOpen(false);
        loadAll();
      } else {
        setMessage({ type: "error", text: res.error || "فشل التحديث" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل تريد حذف الموظف المحدد؟")) return;
    startTransition(async () => {
      const res = await deleteEmployeeAction(id);
      if (res.success) {
        setMessage({ type: "success", text: "تم حذف الموظف من قاعدة البيانات" });
        loadAll();
      } else {
        setMessage({ type: "error", text: res.error || "فشل الحذف" });
      }
    });
  };

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === "all" || e.branch_id === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-xl shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">سجلات الموظفين</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">إدارة رواتب وإجازات وساعات العمل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-xs shadow-md transition-all">
            <Download className="w-4 h-4" />
            <span>تصدير إكسيل</span>
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl text-xs shadow-md transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            <span>إضافة موظف</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/40 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث بالاسم أو الكود..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none" />
        </div>
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none">
          <option value="all">جميع الفروع</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">جاري جلب قائمة الموظفين...</p>
        </div>
      ) : (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/60 dark:border-slate-800/60">
                <tr>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">الفرع</th>
                  <th className="p-3.5">ساعات العمل</th>
                  <th className="p-3.5">رصيد الإجازات</th>
                  <th className="p-3.5">الراتب الأساسي</th>
                  <th className="p-3.5 text-center">التفاصيل والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{emp.code}</div>
                    </td>
                    <td className="p-3.5">{emp.branch_name}</td>
                    <td className="p-3.5">{emp.work_hours} س/يوم</td>
                    <td className="p-3.5 font-medium text-amber-600 dark:text-amber-400">{emp.monthly_leave_days} يوم/شهر</td>
                    <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">{emp.base_salary} ر.س</td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/ar/admin/employees/${emp.id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg flex items-center gap-1 font-medium transition-colors" title="سجل البصمات والأوفر تايم">
                          <FileText className="w-4 h-4" /> تقرير
                        </Link>
                        <button onClick={() => handleOpenModal(emp)} className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {editingEmp ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">اسم الموظف *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">الكود الوظيفي *</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">الفرع التابع</label>
                  <select value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">الدور / الصلاحية</label>
                  <select value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">الراتب الأساسي</label>
                  <input type="number" value={formData.base_salary} onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ساعات العمل</label>
                  <input type="number" value={formData.work_hours} onChange={(e) => setFormData({ ...formData, work_hours: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-amber-600">إجازات مستحقة/شهر</label>
                  <input type="number" step="0.5" value={formData.monthly_leave_days} onChange={(e) => setFormData({ ...formData, monthly_leave_days: Number(e.target.value) })} className="w-full px-3 py-2 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs hover:bg-slate-100">إلغاء</button>
              <button disabled={isPending} onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl text-xs">
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
