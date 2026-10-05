// src/components/admin/employee-form.tsx
"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BranchOption = { id: number; nameAr: string; nameEn: string };
type RoleOption = { id: number; nameAr: string; name: string };

type EmployeeFormValues = {
  id?: number;
  fullNameAr: string;
  fullNameEn: string;
  phone: string;
  nationalId: string;
  address: string;
  governorate: string;
  employeeNumber: string;
  jobRole: string;
  primaryBranchId: string;
  managementRole: "NONE" | "BRANCH_MANAGER" | "AREA_MANAGER";
  managedBranchIds: number[];
  customRoleIds: number[];
  isActive: boolean;
};

export function EmployeeForm({
  locale,
  branches,
  initialValues,
  mode,
}: {
  locale: "ar" | "en";
  branches: BranchOption[];
  initialValues?: Partial<EmployeeFormValues>;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [values, setValues] = useState<EmployeeFormValues>({
    fullNameAr: initialValues?.fullNameAr ?? "",
    fullNameEn: initialValues?.fullNameEn ?? "",
    phone: initialValues?.phone ?? "",
    nationalId: initialValues?.nationalId ?? "",
    address: initialValues?.address ?? "",
    governorate: initialValues?.governorate ?? "",
    employeeNumber: initialValues?.employeeNumber ?? "",
    jobRole: initialValues?.jobRole ?? "",
    primaryBranchId: initialValues?.primaryBranchId ?? "",
    managementRole: initialValues?.managementRole ?? "NONE",
    managedBranchIds: initialValues?.managedBranchIds ?? [],
    customRoleIds: initialValues?.customRoleIds ?? [],
    isActive: initialValues?.isActive ?? true,
  });
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAvailableRoles(Array.isArray(data) ? data : []))
      .catch(() => setAvailableRoles([]));
  }, []);

  function updateField<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleManagedBranch(branchId: number) {
    setValues((prev) => {
      const exists = prev.managedBranchIds.includes(branchId);
      return {
        ...prev,
        managedBranchIds: exists
          ? prev.managedBranchIds.filter((id) => id !== branchId)
          : [...prev.managedBranchIds, branchId],
      };
    });
  }

  function toggleCustomRole(roleId: number) {
    setValues((prev) => {
      const exists = prev.customRoleIds.includes(roleId);
      return {
        ...prev,
        customRoleIds: exists
          ? prev.customRoleIds.filter((id) => id !== roleId)
          : [...prev.customRoleIds, roleId],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!values.fullNameAr || !values.phone || !values.jobRole) {
      toast.error(isAr ? "الرجاء إكمال الحقول المطلوبة" : "Please fill in required fields");
      return;
    }

    if (mode === "create" && !password) {
      toast.error(isAr ? "كلمة المرور مطلوبة" : "Password is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...values,
        ...(password ? { password } : {}),
      };

      const url = mode === "create" ? "/api/employees" : `/api/employees/${initialValues?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? (isAr ? "حدث خطأ" : "Something went wrong"));
        return;
      }

      toast.success(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
      router.push("/admin/employees");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent";
  const labelClass = "mb-1.5 block text-xs font-semibold text-foreground-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{isAr ? "الاسم بالعربية *" : "Name (Arabic) *"}</label>
          <input
            className={inputClass}
            value={values.fullNameAr}
            onChange={(e) => updateField("fullNameAr", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>{isAr ? "الاسم بالإنجليزية" : "Name (English)"}</label>
          <input
            className={inputClass}
            value={values.fullNameEn}
            onChange={(e) => updateField("fullNameEn", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>{isAr ? "رقم الهاتف *" : "Phone *"}</label>
          <input
            dir="ltr"
            className={inputClass}
            value={values.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>{isAr ? "رقم البطاقة" : "National ID"}</label>
          <input
            dir="ltr"
            className={inputClass}
            value={values.nationalId}
            onChange={(e) => updateField("nationalId", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>{isAr ? "الرقم الوظيفي" : "Employee Number"}</label>
          <input
            dir="ltr"
            className={inputClass}
            value={values.employeeNumber}
            onChange={(e) => updateField("employeeNumber", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>{isAr ? "المسمى الوظيفي *" : "Job Role *"}</label>
          <input
            className={inputClass}
            value={values.jobRole}
            onChange={(e) => updateField("jobRole", e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>{isAr ? "المحافظة" : "Governorate"}</label>
          <input
            className={inputClass}
            value={values.governorate}
            onChange={(e) => updateField("governorate", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>{isAr ? "الفرع" : "Branch"}</label>
          <select
            className={inputClass}
            value={values.primaryBranchId}
            onChange={(e) => updateField("primaryBranchId", e.target.value)}
          >
            <option value="">{isAr ? "بدون فرع" : "No branch"}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {isAr ? branch.nameAr : branch.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>{isAr ? "العنوان" : "Address"}</label>
          <input
            className={inputClass}
            value={values.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>
            {mode === "create"
              ? isAr ? "كلمة المرور *" : "Password *"
              : isAr ? "كلمة مرور جديدة (اختياري)" : "New password (optional)"}
          </label>
          <input
            dir="ltr"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === "edit" && (
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              {isAr ? "حساب نشط" : "Active account"}
            </label>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background-secondary/50 p-4">
        <label className={labelClass}>{isAr ? "الصلاحية الإدارية" : "Management Role"}</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["NONE", "BRANCH_MANAGER", "AREA_MANAGER"] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => updateField("managementRole", role)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                values.managementRole === role
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-foreground-muted hover:bg-background-secondary"
              }`}
            >
              {role === "NONE" && (isAr ? "مستخدم عادي" : "Normal User")}
              {role === "BRANCH_MANAGER" && (isAr ? "مدير فرع" : "Branch Manager")}
              {role === "AREA_MANAGER" && (isAr ? "مدير منطقة" : "Area Manager")}
            </button>
          ))}
        </div>

        {values.managementRole !== "NONE" && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-foreground-muted">
              {isAr ? "الفروع الخاضعة للإدارة" : "Managed branches"}
            </p>
            <div className="flex flex-wrap gap-2">
              {branches.map((branch) => {
                const checked = values.managedBranchIds.includes(branch.id);
                return (
                  <button
                    type="button"
                    key={branch.id}
                    onClick={() => toggleManagedBranch(branch.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      checked
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border text-foreground-muted hover:bg-background-secondary"
                    }`}
                  >
                    {isAr ? branch.nameAr : branch.nameEn}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background-secondary/50 p-4">
        <label className={labelClass}>{isAr ? "صلاحيات الوصول المخصصة" : "Custom Access Permissions"}</label>
        {availableRoles.length === 0 ? (
          <p className="mt-2 text-xs text-foreground-muted">
            {isAr
              ? "لا توجد صلاحيات مخصصة بعد، أنشئها من صفحة الأدوار والصلاحيات"
              : "No custom roles yet. Create them from the Roles & Permissions page."}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {availableRoles.map((role) => {
              const checked = values.customRoleIds.includes(role.id);
              return (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => toggleCustomRole(role.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    checked
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-foreground-muted hover:bg-background-secondary"
                  }`}
                >
                  {isAr ? role.nameAr : role.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover disabled:opacity-50"
        >
          {loading
            ? isAr ? "جارٍ الحفظ..." : "Saving..."
            : isAr ? "حفظ" : "Save"}
        </button>
      </div>
    </form>
  );
}
