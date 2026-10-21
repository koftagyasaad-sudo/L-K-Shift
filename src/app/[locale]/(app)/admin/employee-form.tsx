"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveEmployeeAction } from "@/actions/employeeActions";
import {
  User,
  Phone,
  Lock,
  Building2,
  ShieldCheck,
  Briefcase,
  DollarSign,
  Save,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export interface BranchOption {
  id: string | number;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  address?: string | null;
}

export interface RoleOption {
  id: string | number;
  nameAr?: string;
  nameEn?: string;
  name?: string;
}

interface EmployeeFormProps {
  locale: "ar" | "en";
  branches?: BranchOption[];
  roles?: RoleOption[];
  mode?: "create" | "edit";
  initialData?: any;
}

export function EmployeeForm({
  locale,
  branches = [],
  roles = [],
  mode = "create",
  initialData,
}: EmployeeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(
    initialData?.phone || initialData?.employee_code || ""
  );
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState(
    initialData?.branchId || initialData?.branch_id || ""
  );
  const [roleId, setRoleId] = useState(
    initialData?.roleId || initialData?.role_id || ""
  );
  const [department, setDepartment] = useState(initialData?.department || "");
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || "");
  const [monthlySalary, setMonthlySalary] = useState(
    initialData?.monthlySalary ||
      initialData?.monthly_salary ||
      initialData?.base_salary ||
      ""
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive ?? true
  );

  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error(
        isRtl
          ? "يرجى إدخال اسم الموظف ورقم الهاتف / كود الدخول"
          : "Name and phone (login ID) are required"
      );
      return;
    }

    setSaving(true);
    try {
      const res = await saveEmployeeAction({
        id: initialData?.id,
        name: name.trim(),
        phone: phone.trim(),
        employee_code: phone.trim(),
        password: password.trim() || undefined,
        branchId: branchId || null,
        branch_id: branchId || null,
        roleId: roleId || null,
        role_id: roleId || null,
        department: department.trim() || null,
        jobTitle: jobTitle.trim() || null,
        monthlySalary: monthlySalary ? String(monthlySalary) : null,
        monthly_salary: monthlySalary ? String(monthlySalary) : null,
        base_salary: monthlySalary ? String(monthlySalary) : null,
        isActive,
      });

      if (res.success) {
        toast.success(
          mode === "create"
            ? isRtl
              ? "تم إضافة الموظف بنجاح"
              : "Employee created successfully"
            : isRtl
            ? "تم تحديث بيانات الموظف بنجاح"
            : "Employee updated successfully"
        );
        router.push(`/${locale}/admin/employees`);
        router.refresh();
      } else {
        toast.error(res.error || (isRtl ? "فشل حفظ الموظف" : "Failed to save employee"));
      }
    } catch (err) {
      toast.error(isRtl ? "حدث خطأ غير متوقع" : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {isRtl ? "البيانات الأساسية" : "Basic Information"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {isRtl ? "اسم الموظف *" : "Employee Name *"}
            </label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isRtl ? "محمد أحمد" : "John Doe"}
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {isRtl ? "رقم الهاتف / كود الدخول *" : "Phone / Login ID *"}
            </label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold">
            {mode === "create"
              ? isRtl
                ? "كلمة المرور (افتراضي: 123456)"
                : "Password (Default: 123456)"
              : isRtl
              ? "كلمة المرور الجديدة (اختياري)"
              : "New Password (Optional)"}
          </label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "create"
                  ? "123456"
                  : isRtl
                  ? "اتركها فارغة للحفاظ على كلمة المرور الحالية"
                  : "Leave empty to keep current password"
              }
              className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Assignment & Roles */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {isRtl ? "التكليف والصلاحيات" : "Assignment & Permissions"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {isRtl ? "الفرع المخصص" : "Assigned Branch"}
            </label>
            <div className="relative">
              <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={String(branchId)}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">
                  {isRtl ? "بدون فرع مخصص" : "No Assigned Branch"}
                </option>
                {branches.map((b) => (
                  <option key={String(b.id)} value={String(b.id)}>
                    {isRtl ? b.nameAr || b.name : b.nameEn || b.nameAr || b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {isRtl ? "الدور المخصص (Role)" : "Custom Role"}
            </label>
            <div className="relative">
              <ShieldCheck className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={String(roleId)}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">
                  {isRtl ? "موظف عادي (Employee)" : "Default Employee"}
                </option>
                {roles.map((r) => (
                  <option key={String(r.id)} value={String(r.id)}>
                    {r.name || (isRtl ? r.nameAr : r.nameEn) || r.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {isRtl ? "القسم" : "Department"}
            </label>
            <div className="relative">
              <Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={isRtl ? "المبيعات" : "Sales"}
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {isRtl ? "المسمى الوظيفي" : "Job Title"}
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={isRtl ? "محاسب / مشرف" : "Accountant / Supervisor"}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {isRtl ? "الراتب الشهري" : "Monthly Salary"}
            </label>
            <div className="relative">
              <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="5000"
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <span className="text-sm font-semibold">
            {isRtl ? "حالة الحساب" : "Account Status"}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href={`/${locale}/admin/employees`}
            className="px-4 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted text-center"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRtl ? "جاري الحفظ..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isRtl ? "حفظ الموظف" : "Save Employee"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default EmployeeForm;
