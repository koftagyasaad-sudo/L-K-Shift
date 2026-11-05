'use client';

import React, { useState, useEffect, use } from 'react';

interface RoleItem {
  id: number | string;
  name: string;
  nameAr?: string;
  permissions?: string[] | Record<string, boolean>;
  isSystem?: boolean;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// مصفوفة الصلاحيات الشاملة المقسمة حسب أقسام العمل
const PERMISSION_GROUPS = [
  {
    category: 'لوحة التحكم والتقارير',
    perms: [
      { id: 'dashboard.view', label: 'الاطلاع على لوحة التحكم المركزية' },
      { id: 'dashboard.stats', label: 'الاطلاع على الإحصائيات الشاملة' },
    ],
  },
  {
    category: 'الحضور والبصمة الذكية',
    perms: [
      { id: 'attendance.check_in', label: 'تسجيل البصمة بالـ GPS (حضور وانصراف)' },
      { id: 'attendance.review', label: 'الاطلاع على كشف وسجلات الحضور' },
      { id: 'attendance.export', label: 'سحب وتصدير شيت Excel للحضور' },
    ],
  },
  {
    category: 'الفروع والتشغيل',
    perms: [
      { id: 'branches.view', label: 'عرض الفروع ونطاق الـ Geofence' },
      { id: 'branches.manage', label: 'إضافة وتعديل وحذف الفروع وإحداثياتها' },
      { id: 'branch.view_own', label: 'الاطلاع على فرعي وفريق العمل فقط' },
    ],
  },
  {
    category: 'الموظفين والحسابات',
    perms: [
      { id: 'employees.view', label: 'الاطلاع على قائمة الموظفين' },
      { id: 'employees.manage', label: 'إضافة وتعديل بيانات الموظفين والرواتب' },
      { id: 'employees.delete', label: 'حذف حسابات الموظفين' },
    ],
  },
  {
    category: 'الأدوار وإدارة النظام',
    perms: [
      { id: 'roles.manage', label: 'التحكم بالأدوار والصلاحيات المخصصة' },
      { id: 'requests.review', label: 'اعتماد طلبات الإجازات والأذونات' },
    ],
  },
];

export default function AdminRolesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleNameAr, setRoleNameAr] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/roles', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRolesList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openAddModal = () => {
    setEditingRole(null);
    setRoleNameAr('');
    setRoleCode('');
    setSelectedPermissions(['attendance.check_in', 'branch.view_own']);
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role);
    setRoleNameAr(role.nameAr || role.name);
    setRoleCode(role.name);
    let perms: string[] = [];
    if (Array.isArray(role.permissions)) {
      perms = role.permissions;
    } else if (typeof role.permissions === 'object' && role.permissions !== null) {
      perms = Object.keys(role.permissions);
    }
    setSelectedPermissions(perms);
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllGroup = (groupPerms: { id: string }[]) => {
    const groupIds = groupPerms.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameAr.trim()) return;

    try {
      setIsSubmitting(true);
      const isEdit = Boolean(editingRole?.id);
      const payload = {
        id: editingRole?.id,
        name: roleCode.trim() || roleNameAr.trim(),
        nameAr: roleNameAr.trim(),
        permissions: selectedPermissions,
      };

      const res = await fetch('/api/roles', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('فشل حفظ الدور');

      setIsModalOpen(false);
      await fetchRoles();
    } catch (err) {
      alert(isRtl ? 'حدث خطأ أثناء حفظ الدور' : 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.isSystem) return;
    const confirmMsg = isRtl
      ? `هل أنت متأكد من حذف الدور المخصص "${role.nameAr || role.name}"؟`
      : `Are you sure you want to delete custom role "${role.nameAr || role.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingId(role.id);
      const res = await fetch(`/api/roles?id=${role.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل حذف الدور');

      setRolesList((prev) => prev.filter((r) => String(r.id) !== String(role.id)));
    } catch (err) {
      alert(isRtl ? 'حدث خطأ أثناء حذف الدور' : 'Failed to delete role');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'إدارة الأدوار والصلاحيات المخصصة' : 'Roles & Permissions Matrix'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'التحكم بما يمكن لكل رتبة رؤيته وتعديله داخل أقسام المنظومة'
              : 'Granular access control & module authorization'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none cursor-pointer"
        >
          {isRtl ? '+ إضافة دور مخصص' : '+ Add Custom Role'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : rolesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base font-medium">
              {isRtl ? 'لا توجد أدوار مسجلة حالياً' : 'No roles registered yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الدور' : 'Role Name'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'المعرف' : 'Code'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الصلاحيات الممنوحة' : 'Permissions'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'النوع' : 'Type'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rolesList.map((role) => {
                  let perms: string[] = [];
                  if (Array.isArray(role.permissions)) {
                    perms = role.permissions;
                  } else if (typeof role.permissions === 'object' && role.permissions !== null) {
                    perms = Object.keys(role.permissions);
                  }

                  const isSuper = perms.includes('*') || role.name === 'SUPER_ADMIN';

                  return (
                    <tr key={role.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {role.nameAr || role.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {role.name}
                      </td>
                      <td className="px-6 py-4">
                        {isSuper ? (
                          <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                            ★ صلاحية كاملة على كل شيء (*)
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {perms.length === 0 ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : (
                              perms.slice(0, 4).map((p: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-white/5 dark:text-slate-300"
                                >
                                  {p}
                                </span>
                              ))
                            )}
                            {perms.length > 4 && (
                              <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                                +{perms.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            role.isSystem
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          }`}
                        >
                          {role.isSystem ? (isRtl ? 'نظامي أساسي' : 'System') : (isRtl ? 'مخصص' : 'Custom')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {role.isSystem ? (
                          <span className="text-xs font-medium text-slate-400">{isRtl ? 'محمي' : 'Locked'}</span>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(role)}
                              className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400 cursor-pointer"
                            >
                              {isRtl ? 'تعديل الصلاحيات' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role)}
                              disabled={deletingId === role.id}
                              className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400 cursor-pointer"
                            >
                              {deletingId === role.id ? (isRtl ? 'جاري الحذف...' : 'Deleting...') : (isRtl ? 'حذف' : 'Delete')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة التحكم المفصل بالصلاحيات (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition dark:border-white/10 dark:bg-[#121526]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingRole
                  ? (isRtl ? `تعديل صلاحيات دور: ${editingRole.nameAr || editingRole.name}` : 'Edit Role Permissions')
                  : (isRtl ? 'إضافة دور مخصص وتحديد الصلاحيات' : 'Add Custom Role')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isRtl ? 'اسم الدور بالعربي' : 'Role Name (Arabic)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleNameAr}
                    onChange={(e) => setRoleNameAr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder={isRtl ? 'مثال: مشرف صالة' : 'Floor Supervisor'}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isRtl ? 'المعرف البرمجي (Code)' : 'Role Code'}
                  </label>
                  <input
                    type="text"
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="FLOOR_SUPERVISOR"
                  />
                </div>
              </div>

              {/* مصفوفة الصلاحيات المقسمة */}
              <div>
                <label className="mb-3 block text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isRtl ? 'حدد الصلاحيات الممنوحة لهذا الدور بدقة:' : 'Grant Permissions:'}
                </label>

                <div className="space-y-4">
                  {PERMISSION_GROUPS.map((group, gIdx) => {
                    const isAllGroupSelected = group.perms.every((p) => selectedPermissions.includes(p.id));
                    return (
                      <div key={gIdx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3 dark:border-white/5">
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            {group.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllGroup(group.perms)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            {isAllGroupSelected ? (isRtl ? 'إلغاء تحديد الكل' : 'Deselect') : (isRtl ? 'تحديد كل القسم' : 'Select All')}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {group.perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                              />
                              <span>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2 text-xs font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الصلاحيات' : 'Save Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
