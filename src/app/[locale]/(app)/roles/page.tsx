'use client';

import React, { useState, useEffect, use } from 'react';

interface RoleItem {
  id: string | number;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  permissions?: string[];
  [key: string]: any;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminRolesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // حالة النافذة المنبثقة للإضافة
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleDesc, setNewRoleDesc] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // جلب قائمة الأدوار
  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await fetch('/api/admin/roles', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('فشل استرداد الأدوار من قاعدة البيانات');
      }

      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data?.roles || data?.data || [];

      // تحويل آمن يتوافق مع كلا شكلي قاعدة البيانات (name أو name_ar)
      const formatted: RoleItem[] = list.map((r) => ({
        id: r.id,
        name: r.nameAr || r.name || 'دور غير مسمى',
        nameAr: r.nameAr || r.name || 'دور غير مسمى',
        nameEn: r.nameEn || '',
        description: r.description || '',
        permissions: Array.isArray(r.permissions) ? r.permissions : [],
      }));

      setRoles(formatted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الأدوار';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // إضافة دور جديد
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // إرسال كائن يدعم الاسمين معاً لضمان عدم رفض الخادم للاستعلام
      const payload = {
        name: newRoleName.trim(),
        nameAr: newRoleName.trim(),
        nameEn: newRoleName.trim(),
        description: newRoleDesc.trim(),
        permissions: ['attendance.view', 'attendance.check'],
      };

      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل حفظ الدور في قاعدة البيانات');
      }

      setNewRoleName('');
      setNewRoleDesc('');
      setIsModalOpen(false);
      await fetchRoles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الدور';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* شريط الأخطاء إن وجد */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {errorMessage}
        </div>
      )}

      {/* رأس الصفحة مع زر الإضافة المباشر */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 bg-[#121526]/80 p-6 shadow-lg backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {isRtl ? 'إدارة الأدوار والصلاحيات' : 'Roles & Permissions'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRtl
              ? 'إضافة وتعديل أدوار الموظفين وتخصيص صلاحيات الشاشات والعمليات'
              : 'Configure employee roles and system feature permissions'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none"
        >
          {isRtl ? '+ إضافة دور جديد' : '+ Add New Role'}
        </button>
      </div>

      {/* جدول عرض الأدوار */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#121526]/80 shadow-lg backdrop-blur-md">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            {isRtl ? 'لا توجد أدوار مسجلة حالياً، ابدأ بإضافة دور جديد.' : 'No roles registered yet.'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-white/5 text-right text-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الدور' : 'Role Name'}</th>
                <th className="px-6 py-4 font-semibold">{isRtl ? 'الوصف' : 'Description'}</th>
                <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 font-bold text-white">{role.name}</td>
                  <td className="px-6 py-4 text-slate-400">{role.description || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      {isRtl ? 'نشط' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal نافذة إضافة الدور الجديد */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161a30] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {isRtl ? 'إضافة دور وظيفي جديد' : 'Create New Role'}
            </h2>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isRtl ? 'اسم الدور' : 'Role Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                  placeholder={isRtl ? 'مثال: مشرف وردية' : 'e.g. Shift Supervisor'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isRtl ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none sm:text-sm"
                  placeholder={isRtl ? 'وصف الصلاحيات المسندة لهذا الدور' : 'Role description'}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 transition disabled:opacity-50"
                >
                  {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الدور' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
