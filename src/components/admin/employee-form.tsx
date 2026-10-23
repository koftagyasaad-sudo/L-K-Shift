"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEmployeeAction, updateEmployeeAction } from "@/actions/employeeActions";

interface EmployeeFormProps {
  employee?: any;
  branches?: any[];
  roles?: any[];
  locale?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmployeeForm({
  employee,
  branches = [],
  roles = [],
  locale = "ar",
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const router = useRouter();
  const isAr = locale === "ar";
  const isEditing = !!employee?.id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: employee?.id || "",
    name: employee?.name || "",
    phone: employee?.phone || "",
    password: employee?.password || "123456",
    email: employee?.email || "",
    role: employee?.role || "EMPLOYEE",
    jobTitle: employee?.jobTitle || "",
    employeeCode: employee?.employeeCode || "",
    branchId: employee?.branchId || (branches[0]?.id ?? ""),
    roleId: employee?.roleId || "",
    monthlySalary: employee?.monthlySalary ? String(employee.monthlySalary) : "",
    hourlyRate: employee?.hourlyRate ? String(employee.hourlyRate) : "",
    isActive: employee?.isActive !== undefined ? Boolean(employee.isActive) : true,
    canUseAttendanceTerminal: employee?.canUseAttendanceTerminal !== undefined ? Boolean(employee.canUseAttendanceTerminal) : true,
    notes: employee?.notes || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result: any;
      if (isEditing) {
        result = await updateEmployeeAction(employee.id, formData);
      } else {
        result = await createEmployeeAction(formData);
      }

      if (result && result.success) {
        toast.success(
          isAr
            ? isEditing
              ? "تم تحديث بيانات الموظف بنجاح"
              : "تم إنشاء الموظف بنجاح"
            : isEditing
            ? "Employee updated successfully"
            : "Employee created successfully"
        );
        router.refresh();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorRes = result as any;
        const message =
          errorRes?.error ||
          errorRes?.message ||
          (isAr ? "تعذر حفظ بيانات الموظف" : "Failed to save employee");
        setError(message);
        toast.error(message);
      }
    } catch (err: any) {
      const msg = err?.message || (isAr ? "حدث خطأ أثناء الاتصال بالخادم" : "An error occurred");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {isEditing
            ? isAr
              ? "تعديل بيانات الموظف"
              : "Edit Employee"
            : isAr
            ? "إضافة موظف جديد"
            : "Add New Employee"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isAr
            ? "أدخل بيانات الموظف للوصول ونظام الحضور والانصراف"
            : "Enter employee details for access and attendance system"}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "الاسم الكامل *" : "Full Name *"}
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder={isAr ? "مثال: أحمد محمد" : "e.g. John Doe"}
          />
        </div>

        {/* Phone (Login ID) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "رقم الهاتف (اسم المستخدم للدخول) *" : "Phone Number (Login ID) *"}
          </label>
          <input
            type="text"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="01000000000"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "كلمة المرور *" : "Password *"}
          </label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="123456"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "البريد الإلكتروني" : "Email Address"}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="employee@example.com"
          />
        </div>

        {/* System Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "نوع الحساب / الصلاحية *" : "System Role *"}
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="EMPLOYEE">{isAr ? "موظف عادي" : "Employee"}</option>
            <option value="MANAGER">{isAr ? "مدير فرع" : "Branch Manager"}</option>
            <option value="ADMIN">{isAr ? "مدير نظام" : "Admin"}</option>
            <option value="SUPER_ADMIN">{isAr ? "مدير عام" : "Super Admin"}</option>
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "الفرع التابع له *" : "Assigned Branch *"}
          </label>
          <select
            name="branchId"
            value={formData.branchId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">{isAr ? "-- اختر الفرع --" : "-- Select Branch --"}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {isAr ? b.nameAr || b.nameEn || b.name : b.nameEn || b.nameAr || b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "كود الموظف" : "Employee Code"}
          </label>
          <input
            type="text"
            name="employeeCode"
            value={formData.employeeCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="EMP-101"
          />
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "المسمى الوظيفي" : "Job Title"}
          </label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder={isAr ? "محاسب / بائع" : "Accountant / Cashier"}
          />
        </div>

        {/* Monthly Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "الراتب الشهري" : "Monthly Salary"}
          </label>
          <input
            type="number"
            step="0.01"
            name="monthlySalary"
            value={formData.monthlySalary}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="0.00"
          />
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAr ? "أجر الساعة" : "Hourly Rate"}
          </label>
          <input
            type="number"
            step="0.01"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-100">
        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            {isAr ? "حساب نشط" : "Active Account"}
          </span>
        </label>

        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input
            type="checkbox"
            name="canUseAttendanceTerminal"
            checked={formData.canUseAttendanceTerminal}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            {isAr ? "مسموح بتسجيل الحضور الذاتي" : "Can Use Attendance Terminal"}
          </span>
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isAr ? "ملاحظات" : "Notes"}
        </label>
        <textarea
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder={isAr ? "أي ملاحظات إضافية..." : "Any additional notes..."}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {loading
            ? isAr
              ? "جاري الحفظ..."
              : "Saving..."
            : isAr
            ? "حفظ الموظف"
            : "Save Employee"}
        </button>
      </div>
    </form>
  );
}

export default EmployeeForm;
