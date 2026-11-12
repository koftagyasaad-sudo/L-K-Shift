'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  UserCheck,
  Navigation,
} from 'lucide-react';

interface BranchItem {
  id: number;
  name: string;
  nameEn: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  managerId: number | null;
  managerName?: string;
  phone?: string;
  address?: string;
  shift1Start?: string;
  shift1End?: string;
  shift2Start?: string;
  shift2End?: string;
  shift3Start?: string;
  shift3End?: string;
  gracePeriodMinutes?: number;
}

interface UserOption {
  id: string | number;
  name: string;
  role: string;
}

export default function BranchesManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT'>('EDIT');

  const [editingBranch, setEditingBranch] = useState<Partial<BranchItem>>({
    nameAr: '',
    nameEn: '',
    phone: '',
    managerId: null,
    shift1Start: '09:00',
    shift1End: '17:00',
    shift2Start: '13:00',
    shift2End: '21:00',
    shift3Start: '17:00',
    shift3End: '01:00',
    gracePeriodMinutes: 15,
    latitude: 31.1308,
    longitude: 30.6475,
    geofenceRadius: 100,
    address: '',
  });

  const [saving, setSaving] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchBranchesData = async () => {
    try {
      setLoading(true);
      const resB = await fetch('/api/branches', { cache: 'no-store' });
      if (resB.ok) {
        const dataB = await resB.json();
        const list: BranchItem[] = Array.isArray(dataB) ? dataB : [];
        setBranches(list);

        // Default to list view
      }

      const resU = await fetch('/api/employees', { cache: 'no-store' });
      if (resU.ok) {
        const dataU = await resU.json();
        const mappedUsers: UserOption[] = (Array.isArray(dataU) ? dataU : []).map((u: {
          id: string | number;
          fullNameAr?: string;
          name?: string;
          fullName?: string;
          role?: string;
        }) => ({
          id: u.id,
          name: u.fullNameAr || u.name || u.fullName || 'موظف',
          role: u.role || 'موظف',
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchesData();
  }, []);

  const loadBranchForEdit = (b: BranchItem) => {
    setEditingBranch({
      id: b.id,
      nameAr: b.nameAr || '',
      nameEn: b.nameEn || b.name || '',
      phone: b.phone || '',
      managerId: b.managerId,
      shift1Start: b.shift1Start || '09:00',
      shift1End: b.shift1End || '17:00',
      shift2Start: b.shift2Start || '13:00',
      shift2End: b.shift2End || '21:00',
      shift3Start: b.shift3Start || '17:00',
      shift3End: b.shift3End || '01:00',
      gracePeriodMinutes: b.gracePeriodMinutes ?? 15,
      latitude: b.latitude ?? 31.1308,
      longitude: b.longitude ?? 30.6475,
      geofenceRadius: b.geofenceRadius ?? 100,
      address: b.address || '',
    });
    setStatusMsg(null);
    setViewMode('EDIT');
  };

  const handleAddNewBranch = () => {
    setEditingBranch({
      id: undefined,
      nameAr: '',
      nameEn: '',
      phone: '',
      managerId: null,
      shift1Start: '09:00',
      shift1End: '17:00',
      shift2Start: '13:00',
      shift2End: '21:00',
      shift3Start: '17:00',
      shift3End: '01:00',
      gracePeriodMinutes: 15,
      latitude: 31.1308,
      longitude: 30.6475,
      geofenceRadius: 100,
      address: '',
    });
    setStatusMsg(null);
    setViewMode('EDIT');
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('خاصية تحديد الموقع الجغرافي غير مدعومة في جهازك');
      return;
    }
    setLocatingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditingBranch((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setLocatingCurrent(false);
      },
      () => {
        setLocatingCurrent(false);
        alert('تعذر جلب موقعك الحالي. تأكد من تفعيل الـ GPS والسماح بالوصول للموقع.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
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

      setStatusMsg({ type: 'ok', text: 'تم حفظ وتحديث بيانات الفرع والورديات بنجاح!' });
      await fetchBranchesData();
    } catch (err: unknown) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (id: number, nameAr: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف فرع "${nameAr}" نهائياً من السيستم؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/branches?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حذف الفرع');

      setBranches((prev) => prev.filter((b) => b.id !== id));
      if (editingBranch.id === id) {
        handleAddNewBranch();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="space-y-6 pb-20 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. الترويسة العلوية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {editingBranch.id ? 'تعديل بيانات الفرع ونطاق البصمة' : 'إضافة فرع جديد ونطاق البصمة'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            تحديث شامل للإحداثيات، نصف قطر نطاق البصمة بالمتر، والورديات الثلاث
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'EDIT' ? (
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-2xl px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              العودة للفروع
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddNewBranch}
              className="bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white rounded-2xl px-5 py-2.5 text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <Plus size={15} />
              <span>إضافة فرع جديد</span>
            </button>
          )}
        </div>
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

      {/* شريط تبويبات سريع لاختيار الفرع للتعديل */}
      {viewMode === 'EDIT' && branches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 px-2">اختر فرعاً للتعديل:</span>
          {branches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => loadBranchForEdit(b)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                editingBranch.id === b.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {b.nameAr}
            </button>
          ))}
          <button
            type="button"
            onClick={handleAddNewBranch}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              !editingBranch.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <Plus size={14} />
            <span>فرع جديد</span>
          </button>
        </div>
      )}

      {/* 2. شاشة الاستمارة المطابقة للصورة */}
      {viewMode === 'EDIT' ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  اسم الفرع بالعربي *
                </label>
                <input
                  type="text"
                  required
                  value={editingBranch.nameAr || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, nameAr: e.target.value })}
                  placeholder="مثال: الكفتجي - دسوق"
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  اسم الفرع بالإنجليزي
                </label>
                <input
                  type="text"
                  value={editingBranch.nameEn || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, nameEn: e.target.value })}
                  placeholder="Koftagi - Desouk"
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  مدير الفرع المسؤول
                </label>
                <select
                  value={editingBranch.managerId || ''}
                  onChange={(e) =>
                    setEditingBranch({
                      ...editingBranch,
                      managerId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full bg-white border border-slate-300 text-slate-900 font-semibold rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition cursor-pointer"
                >
                  <option value="">-- اختر مدير الفرع --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  رقم هاتف الفرع
                </label>
                <input
                  type="tel"
                  value={editingBranch.phone || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-white border border-slate-300 text-slate-900 font-mono rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition"
                  dir="ltr"
                />
              </div>
            </div>

            {/* الصندوق الأرجواني لمواعيد الورديات الثلاث */}
            <div className="bg-[#faf5ff] border border-purple-200/80 rounded-3xl p-5 sm:p-7 space-y-5">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <span className="text-base">⏰</span>
                <span>مواعيد ورديات الفرع الثلاث (صباحية، بينية، مسائية)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <span className="block text-xs font-black text-amber-700">
                    1. الوردية الصباحية
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">من</span>
                      <input
                        type="time"
                        value={editingBranch.shift1Start || '09:00'}
                        onChange={(e) =>
                          setEditingBranch({ ...editingBranch, shift1Start: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">إلى</span>
                      <input
                        type="time"
                        value={editingBranch.shift1End || '17:00'}
                        onChange={(e) =>
                          setEditingBranch({ ...editingBranch, shift1End: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <span className="block text-xs font-black text-blue-700">
                    2. الوردية البينية (Between)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">من</span>
                      <input
                        type="time"
                        value={editingBranch.shift2Start || '13:00'}
                        onChange={(e) =>
                          setEditingBranch({ ...editingBranch, shift2Start: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">إلى</span>
                      <input
                        type="time"
                        value={editingBranch.shift2End || '21:00'}
                        onChange={(e) =>
                          setEditingBranch({ ...editingBranch, shift2End: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <span className="block text-xs font-black text-purple-700">
                    3. الوردية المسائية
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">من</span>
                      <input
                        type="time"
                        value={editingBranch.shift3Start || '17:00'}
                        onChange={(e) =>
                          setEditingBranch({ ...editingBranch, shift3Start: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">إلى</span>
                      <input
                        type="time"
                        value={editingBranch.shift3End || '01:00'}
                        onChange={(e) =>
                          setEditingBranch({ ...editingBranch, shift3End: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-700 pt-2">
                <span>فترة السماح قبل احتساب تأخير:</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={editingBranch.gracePeriodMinutes ?? 15}
                  onChange={(e) =>
                    setEditingBranch({
                      ...editingBranch,
                      gracePeriodMinutes: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-16 bg-white border border-slate-300 text-slate-900 font-mono font-bold text-center rounded-xl py-1.5 focus:outline-none focus:border-orange-500"
                />
                <span>دقيقة</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  خط العرض (Latitude) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editingBranch.latitude ?? 31.1308}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, latitude: parseFloat(e.target.value) })
                  }
                  className="w-full bg-white border border-slate-300 text-slate-900 font-mono rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  خط الطول (Longitude) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editingBranch.longitude ?? 30.6475}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, longitude: parseFloat(e.target.value) })
                  }
                  className="w-full bg-white border border-slate-300 text-slate-900 font-mono rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                نصف قطر نطاق البصمة الجغرافي (بالمتر) *
              </label>
              <input
                type="number"
                required
                value={editingBranch.geofenceRadius ?? 100}
                onChange={(e) =>
                  setEditingBranch({
                    ...editingBranch,
                    geofenceRadius: parseInt(e.target.value, 10) || 100,
                  })
                }
                className="w-full bg-white border border-slate-300 text-slate-900 font-mono font-bold rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                المدى المسموح للموظف لتسجيل الحضور حول الفرع (مستحسن 50 - 150م لمراعاة ضعف الشبكة داخل المقرات).
              </p>
            </div>

            <div className="flex justify-start pt-1">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locatingCurrent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-5 py-2.5 text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {locatingCurrent ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <MapPin size={15} />
                )}
                <span>📍 تثبيت موقعي الحالي كإحداثيات للفرع</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                العنوان النصي للفرع
              </label>
              <input
                type="text"
                value={editingBranch.address || ''}
                onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                placeholder="مثال: شارع الجيش، بجوار البنك الأهلي، دسوق"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className="px-6 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-8 py-3 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>حفظ بيانات الفرع والورديات</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {branches.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4 hover:border-orange-500/40 transition"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{b.nameAr}</h3>
                    <span className="text-xs text-slate-400 font-mono">{b.nameEn || b.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadBranchForEdit(b)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(b.id, b.nameAr)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 size={13} />
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
                      النطاق: <strong className="font-mono text-orange-600">{b.geofenceRadius} متر</strong>
                      {' '}(إحداثيات: {Number(b.latitude).toFixed(4)}, {Number(b.longitude).toFixed(4)})
                    </span>
                  </div>

                  {b.address && (
                    <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                      <MapPin size={15} className="text-rose-500 shrink-0" />
                      <span>العنوان: {b.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
