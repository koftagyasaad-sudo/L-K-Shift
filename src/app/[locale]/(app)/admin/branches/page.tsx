'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  UserCheck,
  Edit2,
  Trash2,
  Loader2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from 'lucide-react';

interface BranchItem {
  id: number;
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  managerId: number | null;
  managerName?: string;
  phone?: string;
}

interface UserOption {
  id: number;
  name: string;
  fullNameAr?: string;
  role: string;
}

export default function BranchesManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // حالة مودال الإضافة / التعديل
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<BranchItem>>({});
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchBranchesData = async () => {
    try {
      setLoading(true);
      const resB = await fetch('/api/branches', { cache: 'no-store' });
      if (resB.ok) {
        const dataB = await resB.json();
        setBranches(Array.isArray(dataB) ? dataB : []);
      }

      // جلب الموظفين لاختيار مدير الفرع
      const resU = await fetch('/api/employees', { cache: 'no-store' });
      if (resU.ok) {
        const dataU = await resU.json();
        const mappedUsers: UserOption[] = (Array.isArray(dataU) ? dataU : []).map((u: any) => ({
          id: u.id,
          name: u.fullNameAr || u.name || u.fullName || 'موظف',
          role: u.role || 'موظف',
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error('Error loading branches/users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchesData();
  }, []);

  const handleOpenModal = (branch?: BranchItem) => {
    setStatusMsg(null);
    if (branch) {
      setEditingBranch({
        id: branch.id,
        name: branch.name,
        nameAr: branch.nameAr,
        latitude: branch.latitude,
        longitude: branch.longitude,
        geofenceRadius: branch.geofenceRadius || 150,
        managerId: branch.managerId,
        phone: branch.phone || '',
      });
    } else {
      setEditingBranch({
        id: undefined,
        name: '',
        nameAr: '',
        latitude: 31.1308,
        longitude: 30.6475,
        geofenceRadius: 150,
        managerId: null,
        phone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBranch),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حفظ بيانات الفرع');

      setStatusMsg({ type: 'ok', text: 'تم حفظ وتحديث بيانات الفرع بنجاح!' });
      setTimeout(() => {
        setIsModalOpen(false);
        fetchBranchesData();
      }, 700);
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  // دالة حذف الفرع
  const handleDeleteBranch = async (id: number, nameAr: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف فرع "${nameAr}" نهائياً من السيستم؟`)) {
      return;
    }

    setDeletingId(id);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/branches?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حذف الفرع');

      setBranches((prev) => prev.filter((b) => b.id !== id));
      setStatusMsg({ type: 'ok', text: `تم حذف فرع "${nameAr}" بنجاح!` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'حدث خطأ أثناء حذف الفرع' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية */}
      <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-2xl">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة الفروع والورديات</h1>
            <p className="text-xs text-slate-500 mt-1">
              تحديد النطاق الجغرافي للـ GPS لكل فرع، تعيين مديري الفروع، وحذف أو تعديل الفروع
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
        >
          <Plus size={15} />
          <span>إضافة فرع جديد</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* قائمة الفروع */}
      {loading ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 bg-slate-100 border border-slate-200 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500">جاري تحميل الفروع...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {branches.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 hover:border-orange-500/40 transition"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">{b.nameAr}</h3>
                  <span className="text-xs text-slate-400 font-mono">{b.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition cursor-pointer"
                    title="تعديل الفرع"
                  >
                    <Edit2 size={13} />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === b.id}
                    onClick={() => handleDeleteBranch(b.id, b.nameAr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    title="حذف الفرع"
                  >
                    {deletingId === b.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    <span>حذف</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <UserCheck size={15} className="text-orange-500 shrink-0" />
                  <span>مدير الفرع: <strong>{b.managerName || 'غير محدد'}</strong></span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={15} className="text-emerald-500 shrink-0" />
                  <span>الهاتف: <strong className="font-mono">{b.phone || '—'}</strong></span>
                </div>

                <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                  <Navigation size={15} className="text-blue-500 shrink-0" />
                  <span>
                    نطاق الـ Geofence: <strong className="font-mono text-orange-600">{b.geofenceRadius} متر</strong>
                    {' '}(إحداثيات: {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال تعديل وإضافة الفرع */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-orange-500" />
                <span>{editingBranch.id ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفرع (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.nameAr || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, nameAr: e.target.value })}
                    placeholder="مثال: الكفتجي - دسوق"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفرع بالإنجليزية</label>
                  <input
                    type="text"
                    value={editingBranch.name || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    placeholder="Koftagi - Desouk"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs text-left focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اختر مدير الفرع (الاسم الصريح والدور):
                  </label>
                  <select
                    value={editingBranch.managerId || ''}
                    onChange={(e) =>
                      setEditingBranch({
                        ...editingBranch,
                        managerId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">-- بدون مدير حالياً --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خط العرض (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingBranch.latitude ?? 31.1308}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, latitude: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خط الطول (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingBranch.longitude ?? 30.6475}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, longitude: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نطاق البصمة (Geofence بالمتر)</label>
                  <input
                    type="number"
                    value={editingBranch.geofenceRadius ?? 150}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, geofenceRadius: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف الفرع</label>
                  <input
                    type="tel"
                    value={editingBranch.phone || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>حفظ الفرع</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
