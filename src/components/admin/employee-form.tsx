'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface EmployeeFormData {
  id?: string | number;
  name?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  branchId?: string | number | null;
  employeeCode?: string;
  basicSalary?: number | string;
  annualLeaveDays?: number | string;
  workingHoursPerDay?: number | string;
  password?: string;
  isActive?: boolean;
}

interface EmployeeFormProps {
  initialData?: EmployeeFormData | null;
  branches?: Array<{ id: string | number; name?: string; nameAr?: string; name_ar?: string }>;
  roles?: Array<{ id: string | number; name?: string; nameAr?: string; name_ar?: string; permissions?: unknown; description?: string }>;
  locale?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type BranchOption = NonNullable<EmployeeFormProps['branches']>[number];
type RoleOption = NonNullable<EmployeeFormProps['roles']>[number];

export default function EmployeeFormComponent({
  initialData,
  branches: initialBranches = [],
  roles: initialRoles = [],
  locale = 'ar',
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const router = useRouter();
  const isRtl = locale === 'ar';

  const [branchList, setBranchList] = useState<BranchOption[]>(initialBranches);
  const [roleList, setRoleList] = useState<RoleOption[]>(initialRoles);

  const [name, setName] = useState(initialData?.fullName || initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState(initialData?.employeeCode || '');
  const [branchId, setBranchId] = useState(initialData?.branchId ? String(initialData.branchId) : '');
  const [role, setRole] = useState(initialData?.role || 'موظف');
  const [basicSalary, setBasicSalary] = useState(initialData?.basicSalary ? String(initialData.basicSalary) : '5000');
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(initialData?.workingHoursPerDay ? String(initialData.workingHoursPerDay) : '8');
  const [annualLeaveDays, setAnnualLeaveDays] = useState(initialData?.annualLeaveDays ? String(initialData.annualLeaveDays) : '21');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // جلب الفروع وكافة الأدوار المضافة من السيرفر مباشرة فور فتح نافذة التعديل
  useEffect(() => {
    fetch('/api/branches', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBranchList(data);
      })
      .catch((err) => console.error('Failed to fetch branches:', err));

    fetch('/api/roles', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRoleList(data);
        }
      })
      .catch((err) => console.error('Failed to fetch roles:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !employeeCode.trim()) {
      setErrorMessage('الاسم الكامل، رقم الهاتف، والكود الوظيفي حقول إلزامية');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // ربط مصفوفة صلاحيات الدور المختار بالموظف
    const matchedRoleObj = roleList.find(
      (r) => (r.nameAr || r.name_ar || r.name) === role || r.name === role
    );
    const assignedPermissions = matchedRoleObj?.permissions || [];

    const payload = {
      name: name.trim(),
      fullName: name.trim(),
      phone: phone.trim(),
      password: password ? password.trim() : (initialData?.id ? undefined : '123456'),
      employeeCode: employeeCode.trim(),
      branchId: branchId ? parseInt(branchId, 10) : null,
      role: role.trim(),
      permissions: assignedPermissions,
      basicSalary: parseFloat(basicSalary) || 0,
      workingHoursPerDay: parseInt(workingHoursPerDay, 10) || 8,
      annualLeaveDays: parseInt(annualLeaveDays, 10) || 21,
      isActive: true,
    };

    try {
      const isEdit = Boolean(initialData?.id);
      const endpoint = isEdit ? `/api/employees?id=${initialData?.id}` : '/api/employees';

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || 'فشل حفظ بيانات الموظف');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            الاسم الكامل <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            الرقم الوظيفي (كود الموظف الثابت) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            placeholder="مثال: 1001"
            className="w-full rounded-xl border border-orange-500/40 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:border-orange-500/40 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            رقم التليفون (اسم المستخدم) <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white text-left font-mono"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            كلمة المرور {initialData?.id && <span className="text-slate-400 font-normal">(اتركه فارغاً لعدم التغيير)</span>}
          </label>
          <input
            type="password"
            required={!initialData?.id}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder={initialData?.id ? '••••••' : 'كلمة المرور الأولية'}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">الفرع المسند</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">-- اختر الفرع --</option>
            {branchList.map((b) => (
              <option key={b.id} value={String(b.id)}>{b.nameAr || b.name_ar || b.name}</option>
            ))}
          </select>
        </div>

        {/* قائمة الأدوار الوظيفية المسترجعة بالكامل ديناميكياً */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            الدور الوظيفي والصلاحيات <span className="text-rose-500">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">-- اختر الدور الوظيفي --</option>
            {roleList.map((r) => {
              const roleLabel = r.nameAr || r.name_ar || r.name;
              return (
                <option key={r.id || roleLabel} value={roleLabel}>
                  {roleLabel} {r.description ? `(${r.description})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            ساعات العمل اليومية (الشيفت) *
          </label>
          <input
            type="number"
            min="4"
            max="16"
            required
            value={workingHoursPerDay}
            onChange={(e) => setWorkingHoursPerDay(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">الراتب الأساسي (ج.م)</label>
          <input
            type="number"
            value={basicSalary}
            onChange={(e) => setBasicSalary(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">رصيد الإجازات السنوية (أيام)</label>
          <input
            type="number"
            value={annualLeaveDays}
            onChange={(e) => setAnnualLeaveDays(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/5">
        <button
          type="button"
          onClick={() => {
            if (onCancel) onCancel();
            else router.refresh();
          }}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'جاري الحفظ...' : initialData?.id ? 'حفظ تعديلات الموظف' : 'إضافة الموظف'}
        </button>
      </div>
    </form>
  );
}

export { EmployeeFormComponent as EmployeeForm };
