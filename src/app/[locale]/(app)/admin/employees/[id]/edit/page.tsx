"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  UserCheck,
  Save,
  ArrowRight,
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getEmployeesAction, saveEmployeeAction } from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import type { BranchData, RoleData } from "@/types";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";
  const empId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    employee_code: "",
    branch_id: "",
    role_id: "",
    base_salary: 0,
    monthly_leave_days: 2,
    status: "active",
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [empRes, branchRes, roleRes] = await Promise.all([
          getEmployeesAction(),
          getBranchesAction(),
          getRolesAction(),
        ]);

        if (branchRes.success) {
          const branchesList = (branchRes as any).branches || (branchRes as any).data || [];
          setBranches(branchesList);
        }

        if (roleRes.success) {
          const rolesList = (roleRes as any).roles || (roleRes as any).data || [];
          setRoles(rolesList);
        }

        if (empRes.success) {
          const employeesList = (empRes as any).employees || (empRes as any).data || [];
          const currentEmp = employeesList.find((e: any) => e.id === empId);
          if (currentEmp) {
            setFormData({
              id: currentEmp.id,
              name: currentEmp.name || "",
              employee_code: currentEmp.employee_code || "",
              branch_id: currentEmp.branch_id || "",
              role_id: currentEmp.role_id || "",
              base_salary: Number(currentEmp.base_salary) || 0,
              monthly_leave_days: Number(currentEmp.monthly_leave_days) || 2,
              status: currentEmp.status || "active",
            });
          }
        }
      } catch (err) {
        console.error("Error loading edit page data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (empId) {
      loadData();
    }
  }, [empId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await saveEmployeeAction({
        id: formData.id,
        name: formData.name,
        employee_code: formData.employee_code,
        branch_id: formData.branch_id || null,
        role_id: formData.role_id || null,
        base_salary: formData.base_salary,
        monthly_leave_days: formData.monthly_leave_days,
        status: formData.status,
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: isAr ? "تم تحديث بيانات الموظف بنجاح!" : "Employee updated successfully!",
        });
        setTimeout(() => {
          router.push(`/${locale}/admin/employees`);
          router.refresh();
        }, 1200);
      } else {
        setMessage({
          type: "error",
          text: res.error || (isAr ? "حدث خطأ أثناء حفظ البيانات" : "Failed to update employee"),
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: isAr ? "حدث خطأ في الاتصال بالخادم" : "Server connection error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm font-medium">{isAr ? "جاري تحميل بيانات الموظف..." : "Loading employee details..."}</p>
      </div>
    );
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-orange-600 transition"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isAr ? "الرجوع للقائمة" : "Back to List"}</span>
        </button>

        <div className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isAr ? "تعديل بيانات الموظف" : "Edit Employee Details"}
          </h1>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-orange-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Messages */}
          {message && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                message.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isAr ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isAr ? "كود الموظف" : "Employee Code"}
              </label>
              <input
                type="text"
                required
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Branch Select */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                <span>{isAr ? "الفرع" : "Branch"}</span>
              </label>
              <select
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">{isAr ? "-- بدون فرع --" : "-- No Branch --"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                <span>{isAr ? "المسمى الوظيفي" : "Role"}</span>
              </label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">{isAr ? "-- بدون دور --" : "-- No Role --"}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Base Salary */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                <span>{isAr ? "الراتب الأساسي" : "Base Salary"}</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Monthly Leave Days */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>{isAr ? "أيام الإجازة الشهرية المستحقة" : "Monthly Leave Days"}</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthly_leave_days}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_leave_days: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Status Switch */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              {isAr ? "حالة الحساب" : "Account Status"}
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={() => setFormData({ ...formData, status: "active" })}
                  className="text-orange-500 focus:ring-orange-400"
                />
                <span>{isAr ? "نشط" : "Active"}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={() => setFormData({ ...formData, status: "inactive" })}
                  className="text-orange-500 focus:ring-orange-400"
                />
                <span>{isAr ? "غير نشط" : "Inactive"}</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري الحفظ..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isAr ? "حفظ التعديلات" : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
