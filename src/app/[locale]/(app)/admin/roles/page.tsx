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
  Check,
  Building2,
  Layers,
  MapPin,
} from 'lucide-react';

interface CustomRole {
  id: number;
  name: string;
  nameAr: string;
  permissions: string[];
  branchScope: 'ALL' | 'OWN_BRANCH' | 'CUSTOM';
  allowedBranchIds: number[];
  isSystem: boolean;
}

interface BranchItem {
  id: number;
  nameAr: string;
}

const SYSTEM_PERMISSIONS = [
  { id: 'dashboard.view', label: 'لوحة التحكم والتقارير العامة', group: 'عام' },
  { id: 'dashboard.analytics', label: 'التحليلات المالية والتشغيلية المتقدمة', group: 'عام' },
  { id: 'attendance.view', label: 'تسجيل الحضور والانصراف الميداني (GPS)', group: 'الحضور' },
  { id: 'attendance.review', label: 'مراجعة الحضور والرواتب لكافة الفروع', group: 'الحضور' },
  { id: 'attendance.zk_sheet', label: 'تفريغ وطباعة شيتات ماكينة ZK ومسير الرواتب', group: 'الحضور' },
  { id: 'employees.view', label: 'عرض شؤون الموظفين وبياناتهم', group: 'الموظفين' },
  { id: 'employees.manage', label: 'إضافة وتعديل بيانات الموظفين والمسلسل الوظيفي', group: 'الموظفين' },
  { id: 'hr_files.view', label: 'استعراض وطباعة ملفات واستمارات الـ HR الرسمية', group: 'الموظفين' },
  { id: 'branches.view', label: 'استعراض الفروع ومواقعها الجغرافية', group: 'الفروع' },
  { id: 'branches.manage', label: 'إضافة وتعديل وحذف الفروع ونطاق الـ Geofence', group: 'الفروع' },
  { id: 'roles.view', label: 'استعراض الأدوار وقوائم الصلاحيات', group: 'الصلاحيات' },
  { id: 'roles.manage', label: 'إدارة وتعديل وتخصيص صلاحيات الأدوار', group: 'الصلاحيات' },
  { id: 'recruitment.view', label: 'فرز واستعراض استمارات التوظيف والتقديم', group: 'التوظيف' },
  { id: 'recruitment.manage', label: 'فحص واعتماد أو رفض طلبات التوظيف', group: 'التوظيف' },
  { id: 'leaves.approve', label: 'اعتماد الإجازات والأذونات والسلف', group: 'الطلبات' },
  { id: 'staff_requests.manage', label: 'تقديم واعتماد طلبات احتياج العمالة', group: 'الطلبات' },
];

function parsePermissions(perms: any): string[] {
  if (!perms) return [];
  if (Array.isArray(perms)) return perms;
  if (typeof perms === 'string') {
    try {
      const parsed = JSON.parse(perms);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).filter((k) => (parsed as any)[k]);
      }
    } catch {
      return perms ? [perms] : [];
    }
  }
  if (typeof perms === 'object' && perms !== null) {
    return Object.keys(perms).filter((k) => (perms as any)[k]);
  }
  return [];
}

const autoGenerateRoleCode = (arabicName: string): string => {
  const clean = arabicName.trim().toLowerCase();
  if (!clean) return '';

  const mapping: { [key: string]: string } = {
    'مدير النظام': 'SUPER_ADMIN',
    'مدير عام': 'SUPER_ADMIN',
    'مدير فرع': 'admin',
    'مدير موارد بشرية': 'HR',
    'مدير موارد بشريه': 'HR',
    'موارد بشرية': 'HR',
    'مدير تشغيل': 'opreation',
    'مدير مالي': 'accounting',
    'محاسب': 'accounting',
    'owner': 'owner',
    'المالك': 'owner',
    'كول سنتر': 'call center',
    'خدمة عملاء': 'call center',
    'عضو فريق': 'team',
    'عضو مطبخ': 'kitchen',
    'شيف': 'chef',
    'كاشير': 'cashier',
    'كابتن صالة': 'captain',
    'دليفري': 'delivery',
    'طيار': 'delivery',
    'مشرف وردية': 'supervisor',
    'موظف': 'employee',
    'مدير': 'Admin',
  };

  for (const [key, code] of Object.entries(mapping)) {
    if (clean.includes(key)) {
      return code;
    }
  }

  return (
    clean
      .replace(/[أإآ]/g, 'a')
      .replace(/[ة]/g, 'a')
      .replace(/[ى]/g, 'a')
      .replace(/[ي]/g, 'y')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'custom_role'
  );
};

export default function RolesManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [allBranches, setAllBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [branchScope, setBranchScope] = useState<'ALL' | 'OWN_BRANCH' | 'CUSTOM'>('ALL');
  const [allowedBranchIds, setAllowedBranchIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/roles', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sanitized: CustomRole[] = data.map((r: any) => ({
            id: Number(r.id) || Math.random(),
            name: String(r.name || ''),
            nameAr: String(r.nameAr || r.name_ar || r.name || ''),
            permissions: parsePermissions(r.permissions),
            branchScope: r.branchScope || r.branch_scope || 'ALL',
            allowedBranchIds: Array.isArray(r.allowedBranchIds)
              ? r.allowedBranchIds.map(Number)
              : [],
            isSystem: Boolean(r.isSystem ?? r.is_system),
          }));
          setRoles(sanitized);
        } else {
          setRoles([]);
        }
      }

      const resB = await fetch('/api/branches', { cache: 'no-store' });
      if (resB.ok) {
        const dataB = await resB.json();
        const mappedB: BranchItem[] = (Array.isArray(dataB) ? dataB : []).map((b: any) => ({
          id: b.id,
          nameAr: b.nameAr || b.name_ar || b.name || 'فرع',
        }));
        setAllBranches(mappedB);
      }
    } catch (err) {
      console.error('Failed to load roles/branches:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

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
      setSelectedPermissions(parsePermissions(role.permissions));
      setBranchScope(role.branchScope || 'ALL');
      setAllowedBranchIds(role.allowedBranchIds || []);
    } else {
      setEditingRoleId(null);
      setNameAr('');
      setCode('');
      setIsCodeManuallyEdited(false);
      setSelectedPermissions(['attendance.view']);
      setBranchScope('ALL');
      setAllowedBranchIds([]);
    }
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleBranch = (bId: number) => {
    setAllowedBranchIds((prev) =>
      prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]
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

    if (branchScope === 'CUSTOM' && allowedBranchIds.length === 0) {
      setStatusMsg({ type: 'err', text: 'يرجى تحديد فرع واحد على الأقل عند اختيار فروع محددة' });
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
          name: code.trim(),
          permissions: selectedPermissions,
          branchScope,
          allowedBranchIds: branchScope === 'CUSTOM' ? allowedBranchIds : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حفظ الدور');

      setIsModalOpen(false);
      fetchRolesData();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الدور نهائياً؟')) return;
    try {
      const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRolesData();
      }
    } catch (err) {
      console.error('Delete role error:', err);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      (r.nameAr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية */}
      <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-2xl">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة الأدوار والصلاحيات</h1>
              <p className="text-xs text-slate-500 mt-1">
                تحديد الصلاحيات ونطاق الاطلاع الجغرافي (فرعه فقط أو كل الفروع أو فروع محددة)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>إضافة دور وظيفي جديد</span>
        </button>
      </div>

      {/* البحث السريع */}
      <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم العربي أو المعرف البرمجي (Code)..."
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs pl-8 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>

      {/* جدول الأدوار */}
      {loading ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 bg-slate-100 border border-slate-200 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500">جاري تحميل الأدوار...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-16 text-center text-slate-500">
          <Shield size={36} className="mx-auto text-slate-400 mb-3" />
          <p className="text-xs font-bold">لا توجد أدوار مسجلة مطابقة للبحث</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">اسم الدور</th>
                  <th className="p-4">المعرف البرمجي</th>
                  <th className="p-4 text-center">نطاق الفروع المسموح</th>
                  <th className="p-4 text-center">عدد الصلاحيات الممنوحة</th>
                  <th className="p-4 text-center">نوع الدور</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRoles.map((role) => {
                  const perms = parsePermissions(role.permissions);
                  const hasAll = perms.includes('*');
                  const permCount = hasAll ? 1 : perms.length;

                  return (
                    <tr key={role.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{role.nameAr}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-orange-600 font-bold px-3 py-1 rounded-xl bg-orange-50 border border-orange-200">
                          {role.name}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {role.branchScope === 'OWN_BRANCH' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <MapPin size={12} /> فرعه فقط
                          </span>
                        ) : role.branchScope === 'CUSTOM' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers size={12} /> {role.allowedBranchIds?.length || 0} فروع محددة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Building2 size={12} /> جميع الفروع
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-black text-emerald-600 font-mono text-sm">
                        {permCount} صلاحيات
                      </td>
                      <td className="p-4 text-center">
                        {role.isSystem ? (
                          <span className="inline-block px-3 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            نظامي أساسي
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            مخصص
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(role)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                            title="تعديل الدور والصلاحيات"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!role.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                              title="حذف الدور"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة التعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 custom-scrollbar text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield size={18} className="text-orange-500" />
                <span>{editingRoleId ? 'تعديل الدور والصلاحيات' : 'إضافة دور وظيفي جديد'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {statusMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  statusMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {statusMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم الدور (بالعربية) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={handleNameArChange}
                    placeholder="مثال: مدير فرع، كاشير، كول سنتر..."
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>المعرف البرمجي (Role Code) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-orange-600 font-bold">⚡ توليد تلقائي</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => {
                      setIsCodeManuallyEdited(true);
                      setCode(e.target.value);
                    }}
                    placeholder="admin"
                    className="w-full bg-slate-50 border border-slate-300 text-orange-600 font-mono font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* قسم نطاق الفروع الجغرافي */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <Building2 size={16} className="text-orange-600" />
                  <span>نطاق الاطلاع والتحكم بالفروع:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'ALL',
                      label: 'جميع الفروع',
                      desc: 'اطلاع وتحكم شامل بكافة الفروع',
                    },
                    {
                      id: 'OWN_BRANCH',
                      label: 'فرع الموظف فقط',
                      desc: 'حضور وسجلات فرعه المسجل به حصراً',
                    },
                    {
                      id: 'CUSTOM',
                      label: 'فروع محددة',
                      desc: 'اختيار فرعين أو فروع معينة',
                    },
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setBranchScope(scope.id as any)}
                      className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                        branchScope === scope.id
                          ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold text-xs">{scope.label}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            branchScope === scope.id
                              ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {branchScope === scope.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 leading-tight">{scope.desc}</span>
                    </button>
                  ))}
                </div>

                {branchScope === 'CUSTOM' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      اختر الفروع المسموح لهذا الدور بالاطلاع عليها:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {allBranches.map((b) => {
                        const isSelected = allowedBranchIds.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => toggleBranch(b.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-orange-100 border-orange-400 text-orange-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span>{b.nameAr}</span>
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-slate-50'
                              }`}
                            >
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* الصلاحيات التفصيلية */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    الصلاحيات الممنوحة لهذا الدور ({selectedPermissions.length}):
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllPerms}
                    className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
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
                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-orange-50 border-orange-400 text-slate-900 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="leading-snug">{perm.label}</span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 mr-2 transition ${
                            isChecked
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  <span>حفظ الدور والصلاحيات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
