'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, Phone, Lock, CreditCard, MapPin, 
  CheckCircle2, AlertCircle, Save, Loader2, FileText 
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // استمارة الموظف
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // كلمة المرور
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('userId') || '';
    const storedPhone = localStorage.getItem('userPhone') || '';
    const storedName = localStorage.getItem('userName') || '';
    setUserId(storedId);
    setFullName(storedName);
    setPhone(storedPhone);

    async function fetchUserData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees?id=${storedId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const user = Array.isArray(data) ? data.find((u: any) => String(u.id) === storedId) : data;
          if (user) {
            if (user.fullName || user.name) setFullName(user.fullName || user.name);
            if (user.phone) setPhone(user.phone);
            setNationalId(user.nationalId || user.national_id || '');
            setAddress(user.address || '');
            setEmergencyContact(user.emergencyContact || user.emergency_contact || '');
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    if (storedId) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setStatusMsg({ type: 'err', text: 'كلمة المرور وتأكيدها غير متطابقين' });
      return;
    }

    if (nationalId && nationalId.trim().length !== 14) {
      setStatusMsg({ type: 'err', text: 'الرقم القومي يجب أن يتكون من 14 رقماً' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phone: phone.trim(),
          fullName: fullName.trim(),
          nationalId: nationalId.trim(),
          address: address.trim(),
          emergencyContact: emergencyContact.trim(),
          newPassword: newPassword ? newPassword.trim() : null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل تحديث البيانات');

      setStatusMsg({
        type: 'ok',
        text: 'تم حفظ استمارة بياناتك بنجاح، وتحديث كلمة المرور بحسابك!',
      });

      setNewPassword('');
      setConfirmPassword('');
      localStorage.setItem('userName', fullName.trim());
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'حدث خطأ أثناء حفظ البيانات' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-xs font-semibold text-slate-400">جاري تحميل بياناتك الشخصية...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">الملف الشخصي واستمارة (HR)</h1>
            <p className="text-xs text-slate-400 mt-1">
              تحديث بياناتك الشخصية والرقم القومي، وتعيين كلمة المرور الخاصة بحسابك
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User size={16} className="text-orange-500" /> البيانات الشخصية والرقم القومي
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الاسم بالكامل (رباعي) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك رباعي"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم التليفون الأساسي <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الرقم القومي بالبطاقة (14 رقماً) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={14}
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="299xxxxxxxxxxx"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500 pl-10"
                  dir="ltr"
                />
                <CreditCard size={15} className="absolute left-3 top-3 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم هاتف للطوارئ
              </label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                العنوان التفصيلي ومحل الإقامة
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المدينة، اسم الشارع، رقم العقار..."
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 pr-10"
                />
                <MapPin size={15} className="absolute right-3.5 top-3 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock size={16} className="text-orange-500" /> أمان الحساب وتغيير كلمة المرور
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة مرور جديدة"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'جاري الحفظ والتحديث...' : 'حفظ استمارة البيانات وتحديث الحساب'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
