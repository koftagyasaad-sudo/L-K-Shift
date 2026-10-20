"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  X,
  Download,
  Phone,
  Lock,
} from "lucide-react";
import {
  getEmployeesAction,
  saveEmployeeAction,
  deleteEmployeeAction,
} from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import type { EmployeeData, BranchData, RoleData } from "@/types";

export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    password: "",
    employee_code: "",
    branch_id: "",
    role_id: "",
    base_salary: 0,
    monthly_leave_days: 21,
    status: "active",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, branchRes, roleRes] = await Promise.all([
        getEmployeesAction(),
        getBranchesAction(),
        getRolesAction(),
      ]);

      if (empRes.success) {
        setEmployees((empRes as any).employees || (empRes as any).data || []);
      }
      if (branchRes.success) {
        setBranches((branchRes as any).branches || (branchRes as any).data || []);
      }
      if (roleRes.success) {
        setRoles((roleRes as any).roles || (roleRes as any).data || []);
      }
    } catch (err) {
      console.error("Failed to load employees page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleOpenModal = (emp?: EmployeeData) => {
    setMessage(null);
    if (emp) {
      setFormData({
        id: emp.id || "",
        name: emp.name || "",
        phone: (emp as any).phone || emp.employee_code || "",
        password: "",
        employee_code: emp.employee_code || "",
        branch_id: emp.branch_id || "",
        role_id: emp.role_id || "",
        base_salary: Number(emp.base_salary) || 0,
        monthly_leave_days: Number(emp.monthly_leave_days) || 21,
        status: emp.status || "active",
      });
    } else {
      setFormData({
        id: "",
        name: "",
        phone: "",
        password: "123456",
        employee_code: "",
        branch_id: "",
        role_id: "",
        base_salary: 0,
        monthly_leave_days: 21,
        status: "active",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    if (!formData.id && !formData.password.trim()) {
      setMessage({
        type: "error",
        text: isAr ? "كلمة المرور مطلوبة للموظف الجديد" : "Password is required for new employee",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await saveEmployeeAction({
        id: formData.id || undefined,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password.trim() || undefined,
        employee_code: (formData.employee_code || formData.phone).trim(),
        branch_id: formData.branch_id || null,
        role_id: formData.role_id || null,
        base_salary: formData.base_salary,
        monthly_leave_days: formData.monthly_leave_days,
        status: formData.status,
      } as any);

      if (res.success) {
        setMessage({
          type: "success",
          text: isAr ? "تم حفظ بيانات الموظف بنجاح!" : "Employee saved successfully!",
        });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchAll();
        }, 900);
      } else {
        setMessage({
          type: "error",
          text: res.error || (isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save employee"),
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: isAr ? "خطأ في الاتصال بالخادم" : "Server error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا الموظف؟" : "Are you sure you want to delete this employee?")) {
      return;
    }
    try {
      const res = await deleteEmployeeAction(id);
      if (res.success) {
        fetchAll();
      } else {
        alert(res.error || (isAr ? "فشل حذف الموظف" : "Failed to delete employee"));
      }
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  const exportExcel = () => {
    const headers = isAr
      ? ["الاسم", "التليفون", "الكود", "الفرع", "الدور", "الراتب", "أيام الإجازة", "الحالة"]
      : ["Name", "Phone", "Code", "Branch", "Role", "Salary", "Leave Days", "Status"];

    const rows = filteredEmployees.map((e) => [
      e.name,
      (e as any).phone || "",
      e.employee_code,
      e.branch_name || "",
      e.role_name || "",
      String(e.base_salary ?? 0),
      String(e.monthly_leave_days ?? 0),
      e.status || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEmployees = employees.filter((e) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.employee_code?.toLowerCase().includes(q) ||
      (e as any).phone?.toLowerCase?.().includes(q) ||
      e.branch_name?.toLowerCase().includes(q) ||
      e.role_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="rounded-3xl border border-orange-200/80 dark:border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-white dark:to-zinc-900 backdrop-blur-xl p-6 shadow-xl shadow-orange-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {isAr ? "إدارة الموظفين" : "Employees Management"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "أضف موظفاً برقم تليفونه وباسورد وفرعه — رقم التليفون هو حساب الدخول"
              : "Add employee with phone, password & branch — phone is the login ID"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-orange-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-orange-50 dark:hover:bg-zinc-700 transition"
          >
            <Download className="w-4 h-4 text-orange-500" />
            <span>{isAr ? "تصدير Excel" : "Export Excel"}</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "إضافة موظف" : "Add Employee"}</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? "بحث بالاسم، التليفون، الكود، الفرع..." : "Search name, phone, code, branch..."}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-xs font-medium">{isAr ? "جاري تحميل الموظفين..." : "Loading employees..."}</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Users className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="text-sm font-semibold">{isAr ? "لا يوجد موظفون مسجلون" : "No employees registered"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-orange-50/50 dark:bg-zinc-800/40 text-xs text-zinc-600 dark:text-zinc-400">
                  <th className="p-4 text-start font-semibold">{isAr ? "الموظف" : "Employee"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "التليفون" : "Phone"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "الفرع" : "Branch"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "الدور" : "Role"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "الراتب" : "Salary"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "إجازة" : "Leave"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-orange-50/30 dark:hover:bg-zinc-800/30 transition">
                    <td className="p-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{emp.name}</p>
                      <span className="text-[10px] text-zinc-400 block">{emp.employee_code}</span>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300 font-mono" dir="ltr">
                      {(emp as any).phone || "—"}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-orange-500" />
                        {emp.branch_name || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-orange-500" />
                        {emp.role_name || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-200 font-semibold">
                      {Number(emp.base_salary || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-semibold">
                        <Calendar className="w-3 h-3" />
                        {emp.monthly_leave_days ?? 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          emp.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {emp.status === "active" ? (isAr ? "نشط" : "Active") : isAr ? "غير نشط" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/${locale}/admin/employees/${emp.id}`)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 transition"
                          title={isAr ? "تقرير الموظف" : "Employee Report"}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(emp)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 transition"
                          title={isAr ? "تعديل" : "Edit"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => router.push(`/${locale}/admin/employees/${emp.id}/edit`)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition"
                          title={isAr ? "صفحة التعديل" : "Edit Page"}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => emp.id && handleDelete(emp.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800 transition"
                          title={isAr ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-orange-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                <span>
                  {formData.id
                    ? isAr
                      ? "تعديل بيانات الموظف"
                      : "Edit Employee"
                    : isAr
                      ? "إضافة موظف جديد"
                      : "Add Employee"}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? "الاسم الكامل" : "Full Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-orange-500" />
                    {isAr ? "رقم التليفون (دخول)" : "Phone (Login ID)"} *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-orange-500" />
                    {formData.id
                      ? isAr
                        ? "باسورد جديد (اختياري)"
                        : "New password (optional)"
                      : isAr
                        ? "كلمة المرور"
                        : "Password"}{" "}
                    {!formData.id && "*"}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    required={!formData.id}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={formData.id ? (isAr ? "اتركه فارغ للإبقاء" : "Leave empty to keep") : "123456"}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? "كود الموظف" : "Employee Code"}
                  </label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    placeholder={isAr ? "اختياري — افتراضي رقم التليفون" : "Optional — defaults to phone"}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-orange-500" />
                    {isAr ? "الراتب الأساسي" : "Base Salary"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-orange-500" />
                    {isAr ? "الفرع" : "Branch"}
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">{isAr ? "-- اختر الفرع --" : "-- Select branch --"}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-orange-500" />
                    {isAr ? "الدور / المسمى" : "Role"}
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">{isAr ? "-- بدون دور --" : "-- No Role --"}</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-orange-500" />
                    {isAr ? "أيام الإجازة السنوية" : "Annual Leave Days"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.monthly_leave_days}
                    onChange={(e) =>
                      setFormData({ ...formData, monthly_leave_days: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? "الحالة" : "Status"}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="active">{isAr ? "نشط" : "Active"}</option>
                    <option value="inactive">{isAr ? "غير نشط" : "Inactive"}</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-3 text-[11px] text-orange-800 dark:text-orange-200">
                {isAr
                  ? "الموظف يسجّل الدخول برقم التليفون + كلمة المرور. الافتراضي للإضافة الجديدة: 123456"
                  : "Employee logs in with phone + password. Default password for new hires: 123456"}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim() || !formData.phone.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAr ? "حفظ الموظف" : "Save Employee"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
