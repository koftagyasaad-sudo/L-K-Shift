"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveEmployeeAction,
  type SaveEmployeeInput,
} from "@/actions/employeeActions";

export interface BranchOption {
  id?: string | number | null;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  code?: string | null;
  isActive?: boolean | null;
  [key: string]: unknown;
}

export interface RoleOption {
  id?: string | number | null;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  isActive?: boolean | null;
  [key: string]: unknown;
}

export interface EmployeeFormInitialData {
  id?: string | number | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  password?: string | null;
  branchId?: string | number | null;
  roleId?: string | number | null;
  role?: string | null;
  jobTitle?: string | null;
  employeeCode?: string | null;
  hourlyRate?: string | number | null;
  monthlySalary?: string | number | null;
  isActive?: boolean | null;
  canUseAttendanceTerminal?: boolean | null;
  notes?: string | null;
  [key: string]: unknown;
}

export interface EmployeeFormProps {
  mode?: "create" | "edit";
  initialData?: EmployeeFormInitialData | null;
  branches?: BranchOption[];
  roles?: RoleOption[];
  redirectTo?: string;
  locale?: string;
}

const DEFAULT_PASSWORD = "123456";

function toInputString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toOptionalNumber(
  value: string | number | null | undefined
): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getBranchLabel(branch: BranchOption, locale?: string): string {
  if (branch.name) return branch.name;
  if (locale === "en") {
    return branch.nameEn || branch.nameAr || (branch.id ? `Branch ${branch.id}` : "");
  }
  return branch.nameAr || branch.nameEn || (branch.id ? `فرع ${branch.id}` : "");
}

function getRoleLabel(role: RoleOption, locale?: string): string {
  if (role.name) return role.name;
  if (locale === "en") {
    return role.nameEn || role.nameAr || (role.id ? `Role ${role.id}` : "");
  }
  return role.nameAr || role.nameEn || (role.id ? `دور ${role.id}` : "");
}

export default function EmployeeForm({
  mode = "create",
  initialData = null,
  branches = [],
  roles = [],
  redirectTo = "/admin/employees",
  locale = "ar",
}: EmployeeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeBranches = useMemo(
    () =>
      (branches || []).filter(
        (branch) =>
          branch &&
          branch.id !== undefined &&
          branch.id !== null &&
          (branch.isActive === undefined || branch.isActive === null
            ? true
            : Boolean(branch.isActive))
      ),
    [branches]
  );

  const activeRoles = useMemo(
    () =>
      (roles || []).filter(
        (role) =>
          role &&
          role.id !== undefined &&
          role.id !== null &&
          (role.isActive === undefined || role.isActive === null
            ? true
            : Boolean(role.isActive))
      ),
    [roles]
  );

  const [name, setName] = useState(toInputString(initialData?.name));
  const [phone, setPhone] = useState(toInputString(initialData?.phone));
  const [email, setEmail] = useState(toInputString(initialData?.email));
  const [password, setPassword] = useState(
    mode === "create" ? DEFAULT_PASSWORD : ""
  );
  const [branchId, setBranchId] = useState(
    toInputString(initialData?.branchId)
  );
  const [roleId, setRoleId] = useState(toInputString(initialData?.roleId));
  const [role, setRole] = useState(toInputString(initialData?.role) || "employee");
  const [jobTitle, setJobTitle] = useState(toInputString(initialData?.jobTitle));
  const [employeeCode, setEmployeeCode] = useState(
    toInputString(initialData?.employeeCode)
  );
  const [hourlyRate, setHourlyRate] = useState(
    toInputString(initialData?.hourlyRate)
  );
  const [monthlySalary, setMonthlySalary] = useState(
    toInputString(initialData?.monthlySalary)
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive === undefined || initialData?.isActive === null
      ? true
      : Boolean(initialData.isActive)
  );
  const [canUseAttendanceTerminal, setCanUseAttendanceTerminal] = useState(
    initialData?.canUseAttendanceTerminal === undefined ||
      initialData?.canUseAttendanceTerminal === null
      ? true
      : Boolean(initialData.canUseAttendanceTerminal)
  );
  const [notes, setNotes] = useState(toInputString(initialData?.notes));
  const [error, setError] = useState<string | null>(null);

  const isAr = locale !== "en";
  const pageTitle =
    mode === "edit"
      ? isAr
        ? "تعديل بيانات موظف"
        : "Edit Employee"
      : isAr
        ? "إضافة موظف جديد"
        : "Add New Employee";

  function validate(): string | null {
    if (!name.trim()) {
      return isAr ? "اسم الموظف مطلوب" : "Employee name is required";
    }
    if (!phone.trim()) {
      return isAr ? "رقم الهاتف مطلوب (اسم الدخول)" : "Phone number is required (Login ID)";
    }
    if (mode === "create" && !password.trim()) {
      return isAr ? "كلمة المرور مطلوبة" : "Password is required";
    }
    if (!branchId.trim()) {
      return isAr ? "يجب اختيار الفرع المعين للموظف" : "Assigned branch is required";
    }
    if (hourlyRate.trim() && Number.isNaN(Number(hourlyRate))) {
      return isAr ? "الراتب بالساعة غير صالح" : "Invalid hourly rate";
    }
    if (monthlySalary.trim() && Number.isNaN(Number(monthlySalary))) {
      return isAr ? "الراتب الشهري غير صالح" : "Invalid monthly salary";
    }
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const payload: SaveEmployeeInput = {
      id: initialData?.id !== undefined && initialData?.id !== null ? String(initialData.id) : undefined,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      password:
        password.trim() ||
        (mode === "create" ? DEFAULT_PASSWORD : undefined),
      branchId: branchId.trim(),
      branch_id: branchId.trim(),
      roleId: roleId.trim() || undefined,
      role_id: roleId.trim() || undefined,
      role: role.trim() || "employee",
      jobTitle: jobTitle.trim() || undefined,
      job_title: jobTitle.trim() || undefined,
      employeeCode: employeeCode.trim() || undefined,
      employee_code: employeeCode.trim() || undefined,
      hourlyRate: toOptionalNumber(hourlyRate),
      hourly_rate: toOptionalNumber(hourlyRate),
      monthlySalary: toOptionalNumber(monthlySalary),
      monthly_salary: toOptionalNumber(monthlySalary),
      isActive,
      is_active: isActive,
      canUseAttendanceTerminal,
      can_use_attendance_terminal: canUseAttendanceTerminal,
      notes: notes.trim() || undefined,
    };

    startTransition(async () => {
      try {
        const result = await saveEmployeeAction(payload);

        if (!result?.success) {
          const message =
            result?.error ||
            result?.message ||
            (isAr ? "تعذر حفظ بيانات الموظف" : "Failed to save employee");
          setError(message);
          toast.error(message);
          return;
        }

        toast.success(
          mode === "edit"
            ? isAr
              ? "تم تحديث بيانات الموظف بنجاح"
              : "Employee updated successfully"
            : isAr
              ? "تم إنشاء الموظف بنجاح"
              : "Employee created successfully"
        );
        router.push(redirectTo);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : isAr
              ? "حدث خطأ غير متوقع أثناء الحفظ"
              : "An unexpected error occurred";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isAr
              ? "رقم الهاتف هو اسم الدخول. كلمة المرور الافتراضية للحسابات الجديدة: "
              : "Phone number is login ID. Default password for new users: "}
            <span className="font-semibold">{DEFAULT_PASSWORD}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(redirectTo)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          disabled={isPending}
        >
          {isAr ? "رجوع للقائمة" : "Back to List"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "اسم الموظف" : "Employee Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? "مثال: أحمد محمد" : "e.g. John Doe"}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "رقم الهاتف (اسم الدخول)" : "Phone Number (Login ID)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "البريد الإلكتروني" : "Email Address"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="optional@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "كلمة المرور" : "Password"}{" "}
              {mode === "create" ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-slate-400">
                  {isAr ? "(اتركها فارغة لعدم التغيير)" : "(Leave empty to keep current)"}
                </span>
              )}
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "edit"
                  ? isAr
                    ? "اتركها فارغة للإبقاء على الحالية"
                    : "Leave blank to keep current"
                  : DEFAULT_PASSWORD
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
              required={mode === "create"}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "الفرع المعين" : "Assigned Branch"} <span className="text-red-500">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
              required
            >
              <option value="">{isAr ? "اختر الفرع" : "Select Branch"}</option>
              {activeBranches.map((branch) => (
                <option key={String(branch.id)} value={String(branch.id)}>
                  {getBranchLabel(branch, locale)}
                  {branch.code ? ` (${branch.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "المسمى الوظيفي" : "Job Title"}
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={isAr ? "مثال: كاشير / مشرف / محضر" : "e.g. Cashier / Supervisor"}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "كود الموظف" : "Employee Code"}
            </label>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="EMP-001"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "الدور الأساسي" : "Primary System Role"}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
            >
              <option value="employee">{isAr ? "موظف" : "Employee"}</option>
              <option value="supervisor">{isAr ? "مشرف" : "Supervisor"}</option>
              <option value="manager">{isAr ? "مدير" : "Manager"}</option>
              <option value="admin">{isAr ? "أدمن" : "Admin"}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "صلاحية مخصصة (اختياري)" : "Custom Role (Optional)"}
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
            >
              <option value="">{isAr ? "بدون صلاحية مخصصة" : "No Custom Role"}</option>
              {activeRoles.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {getRoleLabel(item, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "الأجر بالساعة" : "Hourly Rate"}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {isAr ? "الراتب الشهري" : "Monthly Salary"}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {isAr ? "ملاحظات" : "Notes"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={isAr ? "ملاحظات إضافية عن الموظف..." : "Additional notes..."}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              disabled={isPending}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                {isAr ? "حساب نشط" : "Active Account"}
              </span>
              <span className="block text-xs text-slate-500">
                {isAr
                  ? "إيقاف الحساب يمنع الموظف من تسجيل الدخول"
                  : "Disabling disables login access for this employee"}
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={canUseAttendanceTerminal}
              onChange={(e) => setCanUseAttendanceTerminal(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              disabled={isPending}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                {isAr ? "السماح ببصمة الحضور" : "Enable Attendance Terminal"}
              </span>
              <span className="block text-xs text-slate-500">
                {isAr
                  ? "تفعيل تسجيل الحضور عبر السيلفي والـ GPS"
                  : "Allow terminal check-in with live selfie and GPS"}
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(redirectTo)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {mode === "edit"
              ? isPending
                ? isAr
                  ? "جاري التحديث..."
                  : "Updating..."
                : isAr
                  ? "حفظ التعديلات"
                  : "Save Changes"
              : isPending
                ? isAr
                  ? "جاري الإنشاء..."
                  : "Creating..."
                : isAr
                  ? "إنشاء الموظف"
                  : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

export { EmployeeForm };
