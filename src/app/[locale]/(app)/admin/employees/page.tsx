"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getEmployeesAction,
  toggleEmployeeStatusAction,
  deleteEmployeeAction,
} from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Users,
  Building2,
  Phone,
  Shield,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Feedback Banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, branchRes, roleRes] = await Promise.all([
        getEmployeesAction(),
        getBranchesAction(),
        getRolesAction(),
      ]);

      // التعامل المرن المباشر مع القائم المرجعة لمنع خطأ Property success does not exist
      const empList = Array.isArray(empRes)
        ? empRes
        : (empRes as any)?.data || (empRes as any)?.employees || [];
      const branchList = Array.isArray(branchRes)
        ? branchRes
        : (branchRes as any)?.data || [];
      const roleList = Array.isArray(roleRes)
        ? roleRes
        : (roleRes as any)?.data || [];

      setEmployees(empList);
      setBranches(branchList);
      setRoles(roleList);
    } catch (err) {
      console.error("Error loading employees page data:", err);
      showToast("حدث خطأ أثناء تحميل بيانات الموظفين", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus?: boolean) => {
    try {
      const res = await toggleEmployeeStatusAction(id, currentStatus);
      if (res && (res.success || !res.error)) {
        showToast("تم تحديث حالة الموظف بنجاح", "success");
        setEmployees((prev) =>
          prev.map((e) =>
            String(e.id) === String(id)
              ? { ...e, isActive: !(e.isActive ?? e.active) }
              : e
          )
        );
      } else {
        showToast(res?.error || "فشل تغيير حالة الموظف", "error");
      }
    } catch (err) {
      showToast("حدث خطأ غير متوقع", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت تأكد من حذف هذا الموظف؟")) return;
    try {
      const res = await deleteEmployeeAction(id);
      if (res && (res.success || !res.error)) {
        showToast("تم حذف الموظف بنجاح", "success");
        setEmployees((prev) => prev.filter((e) => String(e.id) !== String(id)));
      } else {
        showToast(res?.error || "فشل حذف الموظف", "error");
      }
    } catch (err) {
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!employees.length) return;
    const headers = ["الاسم", "رقم الهاتف", "الفرع", "الدور", "الحالة"];
    const rows = employees.map((e) => [
      e.fullNameAr || e.name || "",
      e.phone || "",
      branches.find((b) => String(b.id) === String(e.branchId))?.nameAr || "غير محدد",
      roles.find((r) => String(r.id) === String(e.role || e.roleId))?.name || e.role || "موظف",
      e.isActive ?? e.active ? "نشط" : "غير نشط",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map((field) => `"${field}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `employees_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered employees
  const filteredEmployees = employees.filter((e) => {
    const nameStr = (e.fullNameAr || e.name || e.fullNameEn || "").toLowerCase();
    const phoneStr = (e.phone || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = !query || nameStr.includes(query) || phoneStr.includes(query);
    const matchesBranch = !selectedBranch || String(e.branchId) === String(selectedBranch);
    const matchesRole = !selectedRole || String(e.role || e.roleId) === String(selectedRole);

    return matchesSearch && matchesBranch && matchesRole;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium text-sm">{feedback.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-500" />
            إدارة الموظفين
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            أضف موظفاً برقم تليفونه وباسورد افتراضي (123456) مع تحديد الفرع والدور
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-medium transition-colors border border-slate-700"
          >
            <Download size={18} />
            تصدير CSV
          </button>
          <Link
            href="/admin/employees/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            إضافة موظف
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم التليفون..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        <div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="">جميع الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameAr || b.nameEn || b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="">جميع الأدوار</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameAr || r.name || r.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">جاري تحميل الموظفين...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500">لا يوجد موظفين مطابقين للبحث</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4 font-semibold">الموظف</th>
                  <th className="p-4 font-semibold">رقم التليفون (اسم الدخول)</th>
                  <th className="p-4 font-semibold">الفرع</th>
                  <th className="p-4 font-semibold">الدور المسند</th>
                  <th className="p-4 font-semibold">الحالة</th>
                  <th className="p-4 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredEmployees.map((emp) => {
                  const branchObj = branches.find((b) => String(b.id) === String(emp.branchId));
                  const roleObj = roles.find((r) => String(r.id) === String(emp.role || emp.roleId));

                  const isEmpActive = emp.isActive ?? emp.active ?? true;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">
                          {emp.fullNameAr || emp.name || emp.fullNameEn || "بدون اسم"}
                        </div>
                        {emp.code && <div className="text-xs text-slate-500">كود: {emp.code}</div>}
                      </td>

                      <td className="p-4 text-slate-300 font-mono dir-ltr text-right">
                        <span className="flex items-center gap-1">
                          <Phone size={14} className="text-slate-500" />
                          {emp.phone || "---"}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-blue-400" />
                          {branchObj?.nameAr || branchObj?.nameEn || "غير محدد"}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Shield size={14} className="text-purple-400" />
                          {roleObj?.nameAr || roleObj?.name || emp.role || "موظف"}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(emp.id, isEmpActive)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                            isEmpActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isEmpActive ? (
                            <>
                              <UserCheck size={12} /> نشط
                            </>
                          ) : (
                            <>
                              <UserX size={12} /> غير نشط
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <Link
                            href={`/admin/employees/${emp.id}/edit`}
                            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
