"use client";

import React, { useState } from "react";
import { saveEmployeeAction } from "@/actions/employeeActions";
import { useRouter } from "next/navigation";
import { User, Phone, Lock, Building2, Shield, DollarSign, Calendar, AlertCircle, CheckCircle2, X } from "lucide-react";

export interface EmployeeFormProps {
  initialData?: any;
  branches?: any[];
  roles?: any[];
  mode?: "create" | "edit";
  onClose?: () => void;
  redirectTo?: string;
  [key: string]: any;
}

export function EmployeeForm({
  initialData,
  branches = [],
  roles = [],
  mode = "create",
  onClose,
  redirectTo,
}: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    name: initialData?.fullNameAr || initialData?.name || "",
    phone: initialData?.phone || "",
    password: "",
    code: initialData?.code || "",
    baseSalary: initialData?.baseSalary || 0,
    branchId: initialData?.branchId || initialData?.primaryBranchId || "",
    roleId: initialData?.roleId || initialData?.role || "",
    vacationDays: initialData?.vacationDays || 21,
    isActive: initialData?.isActive ?? initialData?.active ?? true,
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await saveEmployeeAction(formData);
      if (res && (res.success || !res.error)) {
        showToast(mode === "edit" ? "تم تعديل بيانات الموظف بنجاح" : "تم إضافة الموظف بنجاح", "success");
        setTimeout(() => {
          if (onClose) onClose();
          if (redirectTo) router.push(redirectTo);
          else router.push("/admin/employees");
          router.refresh();
        }, 800);
      } else {
        showToast(res?.error || "حدث خطأ أثناء حفظ البيانات", "error");
      }
    } catch (err) {
      showToast("حدث خطأ غير متوقع", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6" dir="rtl">
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

      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="text-blue-500" />
          {mode === "edit" ? "تعديل بيانات موظف" : "إضافة موظف جديد"}
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">الاسم الكامل *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="مثال: أحمد محمد"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Phone size={14} className="text-blue-400" /> رقم التليفون (اسم المستخدم) *
            </label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
              placeholder="01012345678"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Lock size={14} className="text-amber-400" /> كلمة المرور {mode === "edit" ? "(اتركها فارغة للإبقاء على الحالية)" : "*"}
            </label>
            <input
              type="password"
              name="password"
              required={mode === "create"}
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
              placeholder={mode === "create" ? "الافتراضي: 123456" : "••••••"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">كود الموظف (اختياري)</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="اختياري — افتراضي رقم الهاتف"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Building2 size={14} className="text-blue-400" /> الفرع
            </label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- اختر الفرع --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr || b.nameEn || b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Shield size={14} className="text-purple-400" /> الدور / المسمى
            </label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- بدون دور (موظف عادي) --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr || r.name || r.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <DollarSign size={14} className="text-emerald-400" /> الراتب الأساسي
            </label>
            <input
              type="number"
              name="baseSalary"
              value={formData.baseSalary}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Calendar size={14} className="text-amber-400" /> أيام الإجازة السنوية
            </label>
            <input
              type="number"
              name="vacationDays"
              value={formData.vacationDays}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          الموظف يسجل الدخول برقم التليفون + كلمة المرور. الافتراضي للإضافة الجديدة: 123456
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              إلغاء
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? "جاري الحفظ..." : "حفظ الموظف"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeForm;
