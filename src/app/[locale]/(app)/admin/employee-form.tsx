'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface EmployeeFormData {
  id?: string | number;
  name?: string;
  phone?: string;
  role?: string;
  branchId?: string | number | null;
  employeeCode?: string;
  basicSalary?: number | string;
  annualLeaveDays?: number | string;
  password?: string;
  isActive?: boolean;
}

interface EmployeeFormProps {
  initialData?: EmployeeFormData | null;
  branches?: Array<{ id: string | number; name?: string; nameAr?: string; name_ar?: string }>;
  roles?: Array<{ id: string | number; name?: string; nameAr?: string; name_ar?: string }>;
  locale?: string;
  onSuccess?: () => void;
}

// قائمة الأدوار التشغيلية الافتراضية لضمان عدم فراغ القائمة تحت أي ظرف
const DEFAULT_ROLES = [
  { id: '1', name: 'EMPLOYEE', nameAr: 'موظف' },
  { id: '2', name: 'BRANCH_MANAGER', nameAr: 'مدير فرع' },
  { id: '3', name: 'SUPERVISOR', nameAr: 'مشرف تشغيل' },
  { id: '4', name: 'CALL_CENTER', nameAr: 'كول سنتر' },
  { id: '5', name: 'SUPER_ADMIN', nameAr: 'مدير نظام' },
];

export default function EmployeeForm({
  initialData,
  branches: initialBranches = [],
  roles: initialRoles = [],
  locale = 'ar',
  onSuccess,
}: EmployeeFormProps) {
  const router = useRouter();
  const isRtl = locale === 'ar';

  // حالات القوائم المنسدلة
  const [branchList, setBranchList] = useState(initialBranches);
  const [roleList, setRoleList] = useState(initialRoles.length > 0 ? initialRoles : DEFAULT_ROLES);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // حقول بيانات الموظف
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState(initialData?.employeeCode || '');
  const [branchId, setBranchId] = useState(initialData?.branchId ? String(initialData.branchId) : '');
  const [role, setRole] = useState(initialData?.role || 'موظف');
  const [basicSalary, setBasicSalary] = useState(initialData?.basicSalary ? String(initialData.basicSalary) : '0');
  const [annualLeaveDays, setAnnualLeaveDays] = useState(initialData?.annualLeaveDays ? String(initialData.annualLeaveDays) : '21');

  // حالات الإرسال والتنبيهات
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // آلية جلب احتياطية للفروع والأدوار إن وصلت فارغة
  useEffect(() => {
    if (branchList.length === 0 || roleList.length === 0) {
      setIsLoadingData(true);
      Promise.all([
        fetch('/api/branches', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
        fetch('/api/roles', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([branchesData, rolesData]) => {
          if (Array.isArray(branchesData) && branchesData.length > 0) {
            setBranchList(branchesData);
          }
          if (Array.isArray(rolesData) && rolesData.length > 0) {
            setRoleList(rolesData);
          }
        })
        .catch((err) => console.error('Fallback fetch error:', err))
        .finally(() => setIsLoadingData(false));
    }
  }, [branchList.length, roleList.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      fullName: name.trim(),
      phone: phone.trim(),
      password: password ? password.trim() : '123456',
      employeeCode: employeeCode.trim() || null,
      branchId: branchId ? parseInt(branchId, 10) : null,
      role: role.trim(),
      basicSalary: parseFloat(basicSalary) || 0,
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

      if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        throw new Error(resData.message || 'فشل حفظ بيانات الموظف');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${locale}/admin/employees`);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رسالة الخطأ المتوافقة مع الثيمين */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* الاسم الكامل */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
            placeholder={isRtl ? 'أدخل الاسم رباعي' : 'Enter full name'}
          />
        </div>

        {/* رقم التليفون */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'رقم التليفون (اسم المستخدم)' : 'Phone Number'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
            placeholder="01xxxxxxxxx"
          />
        </div>

        {/* كلمة المرور */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'كلمة المرور' : 'Password'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="password"
            required={!initialData?.id}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
            placeholder={initialData?.id ? (isRtl ? 'اتركه فارغاً لعدم التغيير' : 'Leave empty to keep') : '••••••'}
          />
        </div>

        {/* كود الموظف */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'كود الموظف (اختياري)' : 'Employee Code'}
          </label>
          <input
            type="text"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
            placeholder="EMP-001"
          />
        </div>

        {/* قائمة الفروع المعبأة من قاعدة البيانات */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'الفرع' : 'Branch'}
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">
              {isLoadingData && branchList.length === 0
                ? isRtl ? 'جاري تحميل الفروع...' : 'Loading branches...'
                : isRtl ? '-- اختر الفرع --' : '-- Select Branch --'}
            </option>
            {branchList.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.nameAr || b.name_ar || b.name || `فرع ${b.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* قائمة الأدوار المعبأة من قاعدة البيانات مع قيم افتراضية مؤكدة */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'الدور / المسمى' : 'Role'}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {roleList.map((r) => {
              const roleLabel = r.nameAr || r.name_ar || r.name || 'موظف';
              return (
                <option key={r.id || roleLabel} value={roleLabel}>
                  {roleLabel}
                </option>
              );
            })}
          </select>
        </div>

        {/* الراتب الأساسي */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'الراتب الأساسي' : 'Base Salary'}
          </label>
          <input
            type="number"
            value={basicSalary}
            onChange={(e) => setBasicSalary(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            min="0"
          />
        </div>

        {/* أيام الإجازة السنوية */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'أيام الإجازة السنوية' : 'Annual Leave Days'}
          </label>
          <input
            type="number"
            value={annualLeaveDays}
            onChange={(e) => setAnnualLeaveDays(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            min="0"
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-700 dark:text-amber-400">
        {isRtl
          ? 'الموظف يسجل الدخول برقم التليفون + كلمة المرور. الافتراضي للإضافة الجديدة: 123456'
          : 'Staff login uses Phone + Password. Default password: 123456'}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/5">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/employees`)}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isRtl ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الموظف' : 'Save Employee')}
        </button>
      </div>
    </form>
  );
}
