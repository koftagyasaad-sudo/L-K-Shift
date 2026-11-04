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

  // حالة الفروع المستدعاة من المسار الحقيقي
  const [branchList, setBranchList] = useState(initialBranches);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // حقول بيانات الموظف
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState(initialData?.employeeCode || '');
  const [branchId, setBranchId] = useState(initialData?.branchId ? String(initialData.branchId) : '');
  const [role, setRole] = useState(initialData?.role || 'employee');
  const [basicSalary, setBasicSalary] = useState(initialData?.basicSalary ? String(initialData.basicSalary) : '0');
  const [annualLeaveDays, setAnnualLeaveDays] = useState(initialData?.annualLeaveDays ? String(initialData.annualLeaveDays) : '21');

  // حالات الإرسال والتنبيهات
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // جلب الفروع من المسار المسطح المعتمد /api/branches
  useEffect(() => {
    if (branchList.length === 0) {
      setIsLoadingBranches(true);
      fetch('/api/branches', { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('فشل جلب قائمة الفروع');
          return res.json();
        })
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.branches || data?.data || [];
          setBranchList(list);
        })
        .catch((err) => console.error('Error fetching branches in employee form:', err))
        .finally(() => setIsLoadingBranches(false));
    }
  }, [branchList.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // كائن البيانات المطابق لقاعدة بيانات المشروع ومسار /api/employees
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
      canUseAttendanceTerminal: true,
    };

    try {
      const isEdit = Boolean(initialData?.id);
      // استخدام المسار الحقيقي المباشر /api/employees
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
      {/* رسالة الخطأ مع تباين واضح في الثيمين */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-sm font-medium text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <span className="font-bold">{isRtl ? 'خطأ:' : 'Error:'}</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* حقول النموذج - متوافقة بالكامل مع الثيم النهاري والليلي */}
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
            placeholder={initialData?.id ? (isRtl ? 'اتركه فارغاً لعدم التغيير' : 'Leave empty to keep current') : '••••••'}
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

        {/* اختيار الفرع */}
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
              {isLoadingBranches
                ? isRtl
                  ? 'جاري تحميل الفروع...'
                  : 'Loading branches...'
                : isRtl
                ? '-- اختر الفرع --'
                : '-- Select Branch --'}
            </option>
            {branchList.map((b: any) => (
              <option key={b.id} value={String(b.id)}>
                {b.nameAr || b.name}
              </option>
            ))}
          </select>
        </div>

        {/* الدور الوظيفي */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isRtl ? 'الدور / المسمى' : 'Role'}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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

      {/* الملاحظة التوجيهية */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-700 dark:text-amber-400">
        {isRtl
          ? 'الموظف يسجل الدخول برقم التليفون + كلمة المرور. الافتراضي للإضافة الجديدة: 123456'
          : 'Staff login uses Phone + Password. Default password: 123456'}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/5">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/employees`)}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800"
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
