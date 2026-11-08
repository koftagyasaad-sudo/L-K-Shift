'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield,
  Plus,
  Search,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  KeyRound,
  Users,
} from 'lucide-react';

interface CustomRole {
  id: number;
  name: string;      // المعرف البرمجي بالإنجليزية (Role Code)
  nameAr: string;    // اسم الدور بالعربية
  permissions: string[];
  isSystem: boolean;
  usersCount?: number;
}

// القاموس الذكي لتوليد الكود البرمجي تلقائياً من المسمى العربي
const autoGenerateRoleCode = (arabicName: string): string => {
  const clean = arabicName.trim().toLowerCase();
  if (!clean) return '';

  const mapping: { [key: string]: string } = {
    'مدير النظام': 'SUPER_ADMIN',
    'مدير عام': 'GENERAL_MANAGER',
    'مدير فرع': 'BRANCH_MANAGER',
    'مدير منطقة': 'AREA_MANAGER',
    'مدير منطقه': 'AREA_MANAGER',
    'مشرف وردية': 'SHIFT_SUPERVISOR',
    'مشرف ورديه': 'SHIFT_SUPERVISOR',
    'مشرف': 'SUPERVISOR',
    'كول سنتر': 'CALL_CENTER',
    'خدمة عملاء': 'CUSTOMER_SERVICE',
    'خدمه عملاء': 'CUSTOMER_SERVICE',
    'كاشير': 'CASHIER',
    'عضو مطبخ': 'KITCHEN_STAFF',
    'عضو فريق': 'TEAM_MEMBER',
    'شيف': 'CHEF',
    'مساعد شيف': 'SOUS_CHEF',
    'كابتن صالة': 'CAPTAIN',
    'كابتن صاله': 'CAPTAIN',
    'ويتر': 'WAITER',
    'مقدم طلبات': 'ORDER_TAKER',
    'طيار': 'DELIVERY',
    'دليفري': 'DELIVERY',
    'سائق': 'DRIVER',
    'موارد بشرية': 'HR',
    'موارد بشريه': 'HR',
    'مسؤول موارد بشرية': 'HR_OFFICER',
    'محاسب': 'ACCOUNTANT',
    'أمن': 'SECURITY',
    'امن': 'SECURITY',
    'عامل نظافة': 'STEWARD',
    'عامل نظافه': 'STEWARD',
    'موظف': 'EMPLOYEE',
  };

  for (const [key, code] of Object.entries(mapping)) {
    if (clean.includes(key)) {
      return code;
    }
  }

  // تحويل بديل في حالة كتابة مسمى غير موجود بالقاموس
  return clean
    .replace(/[أإآ]/g, 'a')
    .replace(/[ة]/g, 'a')
    .replace(/[ى]/g, 'a')
    .replace(/[ي]/g, 'y')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase() || 'CUSTOM_ROLE';
};

// قائمة الصلاحيات الشاملة للنظام
const SYSTEM_PERMISSIONS = [
  { id: 'dashboard.view', label: 'لوحة التحكم والتقارير العامة', group: 'عام' },
  { id: 'attendance.view', label: 'تسجيل الحضور والانصراف', group: 'الحضور' },
  { id: 'attendance.review', label: 'مراجعة الحضور والرواتب للكل', group: 'الحضور' },
  { id: 'employees.view', label: 'عرض وإدارة شؤون الموظفين', group: 'الموظفين' },
  { id: 'branches.view', label: 'إدارة الفروع والورديات الجغرافية', group: 'الفروع' },
  { id: 'roles.view', label: 'إدارة وتعديل الأدوار والصلاحيات', group: 'الصلاحيات' },
  { id: 'recruitment.view', label: 'فرز استمارات التوظيف والتقديم', group: 'التوظيف' },
  { id: 'leaves.approve', label: 'اعتماد الإجازات والأذونات والسلف', group: 'الطلبات' },
];

export default function RolesManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // حالة المودال (إضافة / تعديل)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/roles', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // التوليد التلقائي الفوري للكود الإنجليزي عند كتابة المسمى بالعربي
  const handleNameArChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNameAr(val);
    if (!isCodeManuallyEdited) {
      setCode(autoGenerateRoleCode(val));
    }
  };

  const handleOpenModal = (role?: CustomRole) => {
    setStatusMsg(null);
    if (role) {
      setEditingRoleId(role.id);
      setNameAr(role.nameAr || '');
      setCode(role.name || '');
      setIsCodeManuallyEdited(true);
      setSelectedPermissions(role.permissions || []);
    } else {
      setEditingRoleId(null);
      setNameAr('');
      setCode('');
      setIsCodeManuallyEdited(false);
      setSelectedPermissions(['attendance.view']);
    }
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllPerms = () => {
    if (selectedPermissions.length === SYSTEM_PERMISSIONS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(SYSTEM_PERMISSIONS.map((p) => p.id));
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !code.trim()) {
      setStatusMsg({ type: 'err', text: 'يرجى إدخال اسم الدور والمعرف البرمجي' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRoleId,
          nameAr: nameAr.trim(),
          name: code.trim().toUpperCase(),
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حفظ الدور');

      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الدور؟')) return;
    try {
      const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRoles();
      }
    } catch (err) {
      console.error('Delete role error:', err);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة وأزرار الإضافة */}
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">إدارة الأدوار والصلاحيات</h1>
              <p className="text-xs text-slate-400 mt-1">
                تحديد الصلاحيات البرمجية لكل وظيفة مع التوليد التلقائي للمعرف البرمجي
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>إضافة دور وظيفي جديد</span>
        </button>
      </div>

      {/* البحث السريع */}
      <div className="bg-[#0c0e18] border border-white/5 p-4 rounded-2xl shadow-xl flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم العربي أو المعرف البرمجي (Code)..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs pl-8 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
        </div>
      </div>

      {/* جدول الأدوار */}
      {loading ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 bg-[#0c0e18] border border-white/5 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-400">جاري تحميل الأدوار...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="bg-[#0c0e18] border border-white/5 rounded-3xl p-16 text-center text-slate-400">
          <Shield size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-xs font-bold">لا توجد أدوار مسجلة مطابقة للبحث</p>
        </div>
      ) : (
        <div className="bg-[#0c0e18] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="p-4">اسم الدور (بالعربية)</th>
                  <th className="p-4">المعرف البرمجي (Role Code)</th>
                  <th className="p-4 text-center">عدد الصلاحيات الممنوحة</th>
                  <th className="p-4 text-center">نوع الدور</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{role.nameAr}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-orange-400 font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        {role.name}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-400">
                      {role.permissions?.length || 0} صلاحيات
                    </td>
                    <td className="p-4 text-center">
                      {role.isSystem ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          نظامي أساسي
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          مخصص
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(role)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
                          title="تعديل الدور والصلاحيات"
                        >
                          <Edit2 size={13} />
                        </button>
                        {!role.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                            title="حذف الدور"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال إنشاء / تعديل الدور مع التوليد التلقائي */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#0c0e18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-orange-500" />
                <span>{editingRoleId ? 'تعديل الدور والصلاحيات' : 'إضافة دور وظيفي جديد'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {statusMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  statusMsg.type === 'ok'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {statusMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    اسم الدور (بالعربية) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={handleNameArChange}
                    placeholder="مثال: مدير فرع، كاشير، كول سنتر..."
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>المعرف البرمجي (Role Code) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-orange-400 font-normal">توليد تلقائي ⚡</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => {
                      setIsCodeManuallyEdited(true);
                      setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                    }}
                    placeholder="BRANCH_MANAGER"
                    className="w-full bg-slate-900 border border-slate-800 text-orange-400 font-mono font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* اختيار الصلاحيات */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    الصلاحيات الممنوحة لهذا الدور ({selectedPermissions.length}):
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllPerms}
                    className="text-[11px] font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    {selectedPermissions.length === SYSTEM_PERMISSIONS.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                  {SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-orange-500/10 border-orange-500/30 text-white font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{perm.label}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {isChecked && <CheckCircle2 size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ الدور والصلاحيات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
