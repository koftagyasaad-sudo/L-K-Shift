'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default function EditEmployeePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const employeeId = resolvedParams?.id;
  const isRtl = locale === 'ar';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('موظف');
  const [branchId, setBranchId] = useState('');
  const [basicSalary, setBasicSalary] = useState('0');
  const [annualLeaveDays, setAnnualLeaveDays] = useState('21');
  const [isActive, setIsActive] = useState(true);

  const [branchList, setBranchList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const branchesRes = await fetch('/api/branches', { cache: 'no-store' });
        if (branchesRes.ok) {
          const bData = await branchesRes.json();
          setBranchList(Array.isArray(bData) ? bData : bData?.branches || []);
        }

        const empRes = await fetch(`/api/employees?id=${employeeId}`, { cache: 'no-store' });
        if (!empRes.ok) throw new Error('فشل جلب بيانات الموظف');

        const empData = await empRes.json();
        setName(empData.name || empData.fullName || '');
        setPhone(empData.phone || '');
        setPassword(empData.password || empData.password_hash || '123456');
        setRole(empData.role || 'موظف');
        setBranchId(empData.branchId ? String(empData.branchId) : '');
        setBasicSalary(String(empData.basicSalary || 0));
        setAnnualLeaveDays(String(empData.annualLeaveDays || 21));
        setIsActive(empData.isActive ?? true);
      } catch (err: any) {
        setErrorMessage(err?.message || 'حدث خطأ أثناء تحميل البيانات');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      id: employeeId,
      name: name.trim(),
      phone: phone.trim(),
      password: password.trim(),
      role: role.trim(),
      branchId: branchId ? parseInt(branchId, 10) : null,
      basicSalary: parseFloat(basicSalary) || 0,
      annualLeaveDays: parseInt(annualLeaveDays, 10) || 21,
      isActive: Boolean(isActive),
    };

    try {
      const res = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'فشل تحديث بيانات الموظف');
      }

      setSuccessMessage(isRtl ? 'تم تحديث بيانات الموظف وكلمة المرور بنجاح' : 'Employee & password updated successfully');

      setTimeout(() => {
        router.push(`/${locale}/admin/employees`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'تعديل بيانات الموظف وكلمة المرور' : 'Edit Employee & Password'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'تحديث بيانات الحساب، كلمة المرور، الفرع المسند، والرصيد'
              : 'Update profile details, password, assigned branch, and leave balance'}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/employees`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isRtl ? 'العودة لقائمة الموظفين' : 'Back to Employees'}
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/10 dark:bg-[#121526] dark:shadow-xl sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'رقم التليفون' : 'Phone Number'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* حقل كلمة المرور الظاهر والمعدل مع زر الإظهار والإخفاء */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'كلمة المرور الحالية (قابلة للتعديل)' : 'Password (Editable)'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center px-3 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  {showPassword ? 'إخفاء' : 'عرض'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'الفرع المسند' : 'Assigned Branch'}
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">{isRtl ? '-- اختر الفرع --' : '-- Select Branch --'}</option>
                {branchList.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.nameAr || b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'الدور الوظيفي' : 'Role'}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="موظف">{isRtl ? 'موظف' : 'Staff'}</option>
                <option value="مدير نظام">{isRtl ? 'مدير نظام' : 'Admin'}</option>
                <option value="مدير فرع">{isRtl ? 'مدير فرع' : 'Branch Manager'}</option>
                <option value="مشرف تشغيل">{isRtl ? 'مشرف تشغيل' : 'Supervisor'}</option>
                <option value="كول سنتر">{isRtl ? 'كول سنتر' : 'Call Center'}</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'الراتب الأساسي' : 'Base Salary'}
              </label>
              <input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isRtl ? 'رصيد الإجازات السنوية (أيام)' : 'Annual Leave Days'}
              </label>
              <input
                type="number"
                value={annualLeaveDays}
                onChange={(e) => setAnnualLeaveDays(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                min="0"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isRtl ? 'حساب الموظف نشط ومتاح لتسجيل الحضور' : 'Account active'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-white/5">
            <Link
              href={`/${locale}/admin/employees`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
