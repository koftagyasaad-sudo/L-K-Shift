'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface EmployeeFormData {
  id?: string;
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
  branches?: Array<{ id: string | number; name: string; nameAr?: string }>;
  locale?: string;
  onSuccess?: () => void;
}

export default function EmployeeForm({
  initialData,
  branches: initialBranches = [],
  locale = 'ar',
  onSuccess,
}: EmployeeFormProps) {
  const router = useRouter();
  const isRtl = locale === 'ar';

  // حالة الفروع مع إمكانية التحميل الذاتي إن كانت فارغة
  const [branchList, setBranchList] = useState(initialBranches);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // حقول النموذج
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState(initialData?.employeeCode || '');
  const [branchId, setBranchId] = useState(initialData?.branchId ? String(initialData.branchId) : '');
  const [role, setRole] = useState(initialData?.role || 'employee');
  const [basicSalary, setBasicSalary] = useState(initialData?.basicSalary ? String(initialData.basicSalary) : '0');
  const [annualLeaveDays, setAnnualLeaveDays] = useState(initialData?.annualLeaveDays ? String(initialData.annualLeaveDays) : '21');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // جلب الفروع تلقائياً لضمان عدم ظهور القائمة فارغة نهائياً
  useEffect(() => {
    if (branchList.length === 0) {
      setIsLoadingBranches(true);
      fetch('/api/admin/branches')
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.branches || data?.data || [];
          setBranchList(list);
        })
        .catch((err) => console.error('Failed to auto-fetch branches:', err))
        .finally(() => setIsLoadingBranches(false));
    }
  }, [branchList.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Payload متوافق 100% مع أعمدة قاعدة البيانات بعد الترقية
    const payload = {
      name: name.trim(),
      fullName: name.trim(),
      fullNameAr: name.trim(),
      phone: phone.trim(),
      password: password ? password.trim() : '123456',
      employeeCode: employeeCode.trim() || null,
      branchId: branchId || null,
      role: role.trim(),
      basicSalary: Number(basicSalary) || 0,
      annualLeaveDays: Number(annualLeaveDays) || 21,
      isActive: true,
    };

    try {
      const isEdit = Boolean(initialData?.id);
      const endpoint = isEdit ? `/api/admin/employees/${initialData?.id}` : '/api/admin/employees';

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
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* الاسم الكامل */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
            placeholder={isRtl ? 'أدخل الاسم رباعي' : 'Enter full name'}
          />
        </div>

        {/* رقم التليفون */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'رقم التليفون (اسم المستخدم)' : 'Phone Number'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
            placeholder="01xxxxxxxxx"
          />
        </div>

        {/* كلمة المرور */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'كلمة المرور' : 'Password'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="password"
            required={!initialData?.id}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
            placeholder={initialData?.id ? (isRtl ? 'اتركه فارغاً لعدم التغيير' : 'Leave empty to keep current') : '••••••'}
          />
        </div>

        {/* كود الموظف */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'كود الموظف (اختياري)' : 'Employee Code'}
          </label>
          <input
            type="text"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
            placeholder="EMP-001"
          />
        </div>

        {/* اختيار الفرع (مربوط بقاعدة البيانات) */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'الفرع' : 'Branch'}
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white focus:border-orange-500 focus:outline-none sm:text-sm"
          >
            <option value="">{isLoadingBranches ? (isRtl ? 'جاري تحميل الفروع...' : 'Loading...') : (isRtl ? '-- اختر الفرع --' : '-- Select Branch --')}</option>
            {branchList.map((b: any) => (
              <option key={b.id} value={String(b.id)}>
                {b.nameAr || b.name}
              </option>
            ))}
          </select>
        </div>

        {/* الدور الوظيفي */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'الدور / المسمى' : 'Role'}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white focus:border-orange-500 focus:outline-none sm:text-sm"
          >
            <option value="employee">{isRtl ? 'موظف' : 'Staff'}</option>
            <option value="admin">{isRtl ? 'مدير نظام' : 'Admin'}</option>
            <option value="manager">{isRtl ? 'مدير فرع' : 'Branch Manager'}</option>
            <option value="supervisor">{isRtl ? 'مشرف تشغيل' : 'Supervisor'}</option>
            <option value="callcenter">{isRtl ? 'كول سنتر' : 'Call Center'}</option>
          </select>
        </div>

        {/* الراتب الأساسي */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'الراتب الأساسي' : 'Base Salary'}
          </label>
          <input
            type="number"
            value={basicSalary}
            onChange={(e) => setBasicSalary(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white focus:border-orange-500 focus:outline-none sm:text-sm"
            min="0"
          />
        </div>

        {/* أيام الإجازة السنوية */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isRtl ? 'أيام الإجازة السنوية' : 'Annual Leave Days'}
          </label>
          <input
            type="number"
            value={annualLeaveDays}
            onChange={(e) => setAnnualLeaveDays(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white focus:border-orange-500 focus:outline-none sm:text-sm"
            min="0"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-amber-400">
        {isRtl
          ? 'الموظف يسجل الدخول برقم التليفون + كلمة المرور. الافتراضي للإضافة الجديدة: 123456'
          : 'Staff login uses Phone + Password. Default password for new staff: 123456'}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/employees`)}
          className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition"
        >
          {isRtl ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
        >
          {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الموظف' : 'Save Employee')}
        </button>
      </div>
    </form>
  );
}
