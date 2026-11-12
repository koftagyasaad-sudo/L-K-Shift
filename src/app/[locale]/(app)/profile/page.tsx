'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Lock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Camera,
  Trash2,
  GraduationCap,
  DollarSign,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function PersonalProfilePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [militaryStatus, setMilitaryStatus] = useState('');

  const [nationalId, setNationalId] = useState('');
  const [nationalIdExpiry, setNationalIdExpiry] = useState('');
  const [socialInsuranceNo, setSocialInsuranceNo] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');

  const [phone, setPhone] = useState('');
  const [phoneAlt, setPhoneAlt] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [payoutMethod, setPayoutMethod] = useState<'INSTAPAY' | 'WALLET' | 'BANK' | 'CASH'>('INSTAPAY');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [bankName, setBankName] = useState('');

  const [educationLevel, setEducationLevel] = useState('');
  const [educationField, setEducationField] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
        const res = await fetch(`/api/profile/update?id=${storedId}`, { cache: 'no-store' });
        if (res.ok) {
          const user = await res.json();
          if (user) {
            setFullName(user.fullName || user.name || '');
            setFullNameEn(user.fullNameEn || '');
            setPhone(user.phone || '');
            setPhoneAlt(user.phoneAlt || '');
            setNationalId(user.nationalId || '');
            setNationalIdExpiry(user.nationalIdExpiry ? String(user.nationalIdExpiry).slice(0, 10) : '');
            setSocialInsuranceNo(user.socialInsuranceNo || '');
            setDrivingLicense(user.drivingLicense || '');
            setBirthDate(user.birthDate ? String(user.birthDate).slice(0, 10) : '');
            setGender(user.gender || 'MALE');
            setMaritalStatus(user.maritalStatus || '');
            setMilitaryStatus(user.militaryStatus || '');
            setAddress(user.address || '');
            setEmergencyName(user.emergencyName || '');
            setEmergencyRelation(user.emergencyRelation || '');
            setEmergencyPhone(user.emergencyPhone || '');
            setPayoutMethod(user.payoutMethod || 'INSTAPAY');
            setPayoutAccount(user.payoutAccount || '');
            setBankName(user.bankName || '');
            setEducationLevel(user.educationLevel || '');
            setEducationField(user.educationField || '');
            setGraduationYear(user.graduationYear ? String(user.graduationYear) : '');
            setProfilePhoto(user.avatarUrl || '');
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setProfilePhoto(compressedBase64);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    setStatusMsg(null);
    if (!currentPassword || !newPassword) {
      setStatusMsg({ type: 'err', text: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      setStatusMsg({ type: 'err', text: 'كلمة المرور الجديدة يجب أن تكون بين 6 و128 محرفًا' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'err', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'تعذر تغيير كلمة المرور');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMsg({ type: 'ok', text: data.message || 'تم تغيير كلمة المرور بنجاح' });
    } catch (error: unknown) {
      setStatusMsg({
        type: 'err',
        text: error instanceof Error ? error.message : 'تعذر تغيير كلمة المرور',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (nationalId && nationalId.trim().length !== 14) {
      setStatusMsg({ type: 'err', text: 'الرقم القومي يجب أن يتكون من 14 رقماً بدقة' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fullName: fullName.trim(),
          fullNameEn: fullNameEn.trim(),
          phone: phone.trim(),
          phoneAlt: phoneAlt.trim(),
          nationalId: nationalId.trim(),
          nationalIdExpiry,
          socialInsuranceNo: socialInsuranceNo.trim(),
          drivingLicense,
          birthDate,
          gender,
          maritalStatus,
          militaryStatus,
          address: address.trim(),
          emergencyName: emergencyName.trim(),
          emergencyRelation: emergencyRelation.trim(),
          emergencyPhone: emergencyPhone.trim(),
          payoutMethod,
          payoutAccount: payoutAccount.trim(),
          bankName: bankName.trim(),
          educationLevel,
          educationField: educationField.trim(),
          graduationYear,
          profilePhoto,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل تحديث البيانات');

      setStatusMsg({
        type: 'ok',
        text: 'تم حفظ وتحديث جميع بيانات استمارتك وصورتك الشخصية بنجاح!',
      });

      localStorage.setItem('userName', fullName.trim());
      localStorage.setItem('userPhone', phone.trim());
    } catch (err: unknown) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-xs font-semibold text-slate-500">جاري تحميل استمارة ملفك الشخصي...</p>
      </div>
    );
  }

  const initialLetter = fullName ? fullName.trim().charAt(0) : 'م';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة والصورة الشخصية بلون رصاصي فاتح */}
      <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
          <div className="relative group shrink-0">
            <div className="h-28 w-28 rounded-3xl overflow-hidden border-2 border-orange-500/40 bg-white shadow-md flex items-center justify-center">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-slate-800">{initialLetter}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -left-2 bg-gradient-to-r from-orange-500 to-rose-600 text-white p-2.5 rounded-2xl shadow-lg hover:scale-105 transition-all cursor-pointer"
              title="تحميل صورة شخصية"
            >
              <Camera size={16} />
            </button>

            {profilePhoto && (
              <button
                type="button"
                onClick={() => setProfilePhoto('')}
                className="absolute -top-2 -left-2 bg-rose-600 text-white p-1.5 rounded-xl shadow hover:bg-rose-700 transition cursor-pointer"
                title="إزالة الصورة"
              >
                <Trash2 size={13} />
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{fullName || 'البيانات الشخصية'}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold">
                <ShieldCheck size={13} /> موظف معتمد
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">تحديث واستعراض استمارة بياناتك المسجلة في النظام</p>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono text-slate-600">
              <span className="flex items-center gap-1">
                <Phone size={12} className="text-orange-600" /> {phone || 'بدون رقم'}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard size={12} className="text-emerald-600" /> {nationalId || 'الرقم القومي غير مسجل'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer"
        >
          <ArrowRight size={15} className={isRtl ? '' : 'rotate-180'} />
          <span>رجوع للخلف</span>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. البيانات الشخصية */}
        <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
            <User size={18} className="text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">1. البيانات الشخصية الأساسية</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم بالكامل (رباعي) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك رباعي"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم بالإنجليزية</label>
              <input
                type="text"
                value={fullNameEn}
                onChange={(e) => setFullNameEn(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الميلاد</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">النوع / الجنس</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-semibold"
              >
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الحالة الاجتماعية</label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-semibold"
              >
                <option value="">-- اختر الحالة --</option>
                <option value="أعزب">أعزب</option>
                <option value="متزوج">متزوج</option>
                <option value="متزوج ويعول">متزوج ويعول</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الموقف التجنيدي</label>
              <select
                value={militaryStatus}
                onChange={(e) => setMilitaryStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-semibold"
              >
                <option value="">-- اختر الموقف --</option>
                <option value="أدى الخدمة العسكرية">أدى الخدمة العسكرية</option>
                <option value="إعفاء نهائي">إعفاء نهائي</option>
                <option value="إعفاء مؤقت">إعفاء مؤقت</option>
                <option value="تأجيل دراسي">تأجيل دراسي</option>
                <option value="غير مطلوب (إناث)">غير مطلوب (إناث)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. الهوية والتأمينات */}
        <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">2. بيانات الهوية والتأمينات الاجتماعية</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الرقم القومي (14 رقماً) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={14}
                required
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="299xxxxxxxxxxx"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سريان البطاقة</label>
              <input
                type="date"
                value={nationalIdExpiry}
                onChange={(e) => setNationalIdExpiry(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم التأميني</label>
              <input
                type="text"
                value={socialInsuranceNo}
                onChange={(e) => setSocialInsuranceNo(e.target.value)}
                placeholder="مثال: 12345678"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رخصة القيادة</label>
              <select
                value={drivingLicense}
                onChange={(e) => setDrivingLicense(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-semibold"
              >
                <option value="">لا يوجد رخصة قيادة</option>
                <option value="رخصة خاصة">رخصة خاصة</option>
                <option value="درجة ثالثة مهنية">درجة ثالثة مهنية</option>
                <option value="درجة ثانية مهنية">درجة ثانية مهنية</option>
                <option value="درجة أولى مهنية">درجة أولى مهنية</option>
                <option value="رخصة دراجة نارية (موتوسيكل)">رخصة دراجة نارية (موتوسيكل)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. الاتصال والعنوان والطوارئ */}
        <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
            <Phone size={18} className="text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">3. بيانات الاتصال والإقامة وجهة الطوارئ</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم التليفون الأساسي <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم تليفون إضافي / واتساب</label>
              <input
                type="tel"
                value={phoneAlt}
                onChange={(e) => setPhoneAlt(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان ومحل الإقامة</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="المدينة، اسم الشارع..."
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">جهة اتصال للطوارئ (الاسم)</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="اسم الشخص للرجوع إليه"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">صلة القرابة</label>
              <input
                type="text"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="مثال: الوالد، الأخ..."
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">هاتف الطوارئ</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* 4. صرف المستحقات والرواتب */}
        <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">4. بيانات تحويل الراتب والمستحقات</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة التحويل المفضلة</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value as 'INSTAPAY' | 'WALLET' | 'BANK' | 'CASH')}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                <option value="WALLET">محفظة كاش (فودافون / أورنج / اتصالات / وي)</option>
                <option value="BANK">تحويل بنكي مباشر (حساب بنكي / IBAN)</option>
                <option value="CASH">استلام نقدي بالفرع (Cash)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {payoutMethod === 'INSTAPAY'
                  ? 'عنوان الدفع (IPA) أو رقم الموبايل'
                  : payoutMethod === 'WALLET'
                  ? 'رقم محفظة كاش'
                  : payoutMethod === 'BANK'
                  ? 'رقم الحساب أو الـ IBAN'
                  : 'ملاحظة الاستلام'}
              </label>
              <input
                type="text"
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
                placeholder={payoutMethod === 'INSTAPAY' ? '01xxxxxxxxx أو username@instapay' : 'رقم الحساب أو المحفظة'}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم البنك أو شبكة المحفظة</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="مثال: فودافون كاش / بنك مصر"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 5. المؤهل والتعليم */}
        <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
            <GraduationCap size={18} className="text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">5. المؤهل الدراسي وسنة التخرج</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">المستوى التعليمي</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-semibold"
              >
                <option value="">-- اختر المؤهل --</option>
                <option value="مؤهل عالي (جامعي / بكالوريوس)">مؤهل عالي (جامعي / بكالوريوس)</option>
                <option value="مؤهل فوق متوسط">مؤهل فوق متوسط</option>
                <option value="مؤهل متوسط (دبلوم / ثانوية)">مؤهل متوسط (دبلوم / ثانوية)</option>
                <option value="طالب مقيد بالجامعة">طالب مقيد بالجامعة</option>
                <option value="بدون مؤهل">بدون مؤهل</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">التخصص / الكلية</label>
              <input
                type="text"
                value={educationField}
                onChange={(e) => setEducationField(e.target.value)}
                placeholder="مثال: تجارة / نظم ومعلومات..."
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سنة التخرج</label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="مثال: 2023"
                className="w-full bg-white border border-slate-300 text-slate-900 font-mono rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* 6. كلمة المرور */}
        <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock size={18} className="text-rose-600" /> 6. أمان الحساب وتغيير كلمة المرور
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              أدخل كلمة المرور الحالية والجديدة، ثم احفظ التغيير بشكل مستقل عن بيانات الملف الشخصي.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-rose-600 mb-1.5">
                كلمة المرور الحالية <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="كلمة المرور الحالية"
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
            >
              {changingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>{changingPassword ? 'جارٍ تغيير كلمة المرور...' : 'تغيير كلمة المرور'}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-10 py-4 text-xs font-bold text-white shadow-xl shadow-orange-500/25 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'جاري الحفظ والتسجيل...' : 'حفظ استمارة البيانات وتحديث الحساب'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
