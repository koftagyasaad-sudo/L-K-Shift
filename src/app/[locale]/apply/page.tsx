'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  User,
  GraduationCap,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function JobApplicationPublicPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  // 1. منع أي نافذة منبثقة أو طلب لتثبيت التطبيق على هاتف المتقدم
  useEffect(() => {
    const suppressInstallPrompt = (e: Event) => {
      e.preventDefault();
      return false;
    };
    window.addEventListener('beforeinstallprompt', suppressInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', suppressInstallPrompt);
    };
  }, []);

  // بيانات الاستمارة
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [appliedRole, setAppliedRole] = useState('عضو فريق مطبخ');
  const [education, setEducation] = useState('مؤهل متوسط (دبلوم / ثانوية)');
  const [militaryStatus, setMilitaryStatus] = useState('أدى الخدمة العسكرية');
  const [address, setAddress] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [experienceYears, setExperienceYears] = useState('بدون خبرة سابقة');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('يرجى إدخال الاسم ورقم الهاتف على الأقل');
      return;
    }

    if (nationalId && nationalId.trim().length !== 14) {
      setErrorMessage('الرقم القومي يجب أن يتكون من 14 رقماً بدقة');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          nationalId: nationalId.trim(),
          birthDate,
          appliedRole,
          education,
          militaryStatus,
          address: address.trim(),
          expectedSalary: expectedSalary.trim(),
          experienceYears,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إرسال طلب التقديم');

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء إرسال البيانات');
    } finally {
      setLoading(false);
    }
  };

  // شاشة النجاح بعد إرسال الاستمارة
  if (isSubmitted) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-rose-600 p-2 mx-auto flex items-center justify-center shadow-lg shadow-orange-500/25">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain brightness-110 drop-shadow" />
          </div>

          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">تم استلام استمارتك بنجاح!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              شكراً لاهتمامك بالانضمام إلى فريق عملنا (بروست الأسد & كفتجي). تم تسجيل بياناتك لدى إدارة الموارد البشرية (HR)، وسيتم التواصل معك هاتفياً لتحديد موعد المقابلة الشخصية في حال توافق متطلبات الوظيفة.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setFullName('');
                setPhone('');
                setNationalId('');
                setAddress('');
                setNotes('');
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              تقديم استمارة جديدة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 py-8 px-4 sm:px-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* الترويسة والعلامة التجارية */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          {/* زخرفة برتقالية خفيفة بالخلفية */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* اللوجو الرسمي للمجموعة */}
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-rose-600 p-2 mx-auto flex items-center justify-center shadow-lg shadow-orange-500/25">
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow brightness-110"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 rounded-full p-1 shadow-xs">
              <Sparkles size={14} className="text-orange-600" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-black tracking-wide">
                بروست الأسد • كفتجي
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              استمارة طلب التوظيف الرسمية
            </h1>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              يسعدنا رغبتك بالانضمام إلى عائلة مطاعمنا. يرجى ملء البيانات التالية بدقة، وسيتم فحص الطلب والتواصل معك من قبل قسم الموارد البشرية.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 shadow-xs">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* نموذج الاستمارة */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. الوظيفة المرغوبة */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Briefcase size={18} />
              </div>
              <h2 className="text-sm font-black">1. الوظيفة والخبرات</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الوظيفة المراد التقديم عليها <span className="text-rose-500">*</span>
                </label>
                <select
                  value={appliedRole}
                  onChange={(e) => setAppliedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="عضو فريق مطبخ">عضو فريق مطبخ</option>
                  <option value="شيف / طاهي">شيف / طاهي</option>
                  <option value="كابتن صالة وويتر">كابتن صالة وويتر</option>
                  <option value="كاشير">كاشير</option>
                  <option value="كول سنتر">كول سنتر</option>
                  <option value="دليفري / طيار توصيل">دليفري / طيار توصيل</option>
                  <option value="مشرف وردية">مشرف وردية</option>
                  <option value="عامل خدمات ونظافة">عامل خدمات ونظافة</option>
                  <option value="وظائف إدارية / أخرى">وظائف إدارية / أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">سنوات الخبرة في مجال المطاعم</label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="بدون خبرة سابقة">بدون خبرة سابقة (حديث التخرج)</option>
                  <option value="أقل من سنة">أقل من سنة</option>
                  <option value="من 1 إلى 3 سنوات">من 1 إلى 3 سنوات</option>
                  <option value="من 3 إلى 5 سنوات">من 3 إلى 5 سنوات</option>
                  <option value="أكثر من 5 سنوات">أكثر من 5 سنوات</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الراتب المتوقع (جنيه مصري / اختياري)</label>
                <input
                  type="text"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="مثال: 5500"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. البيانات الشخصية وبيانات الاتصال */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <User size={18} />
              </div>
              <h2 className="text-sm font-black">2. البيانات الشخصية والتواصل</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الاسم بالكامل (رباعي كما بالبطاقة) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل اسمك رباعي"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف (واتساب والتواصل) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-left rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم القومي (14 رقماً)</label>
                <input
                  type="text"
                  maxLength={14}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="299xxxxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-left rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الميلاد</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  محل الإقامة الحالي (المدينة / المنطقة) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: كفر الشيخ / دسوق..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* 3. المؤهل الدراسي والموقف التجنيدي */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <GraduationCap size={18} />
              </div>
              <h2 className="text-sm font-black">3. المؤهل والموقف التجنيدي</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المؤهل الدراسي</label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="مؤهل عالي (بكالوريوس / ليسانس)">مؤهل عالي (بكالوريوس / ليسانس)</option>
                  <option value="مؤهل فوق متوسط">مؤهل فوق متوسط</option>
                  <option value="مؤهل متوسط (دبلوم / ثانوية)">مؤهل متوسط (دبلوم / ثانوية)</option>
                  <option value="طالب مقيد بالجامعة">طالب مقيد بالجامعة</option>
                  <option value="بدون مؤهل">بدون مؤهل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الموقف من التجنيد (للذكور)</label>
                <select
                  value={militaryStatus}
                  onChange={(e) => setMilitaryStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="أدى الخدمة العسكرية">أدى الخدمة العسكرية</option>
                  <option value="إعفاء نهائي">إعفاء نهائي</option>
                  <option value="إعفاء مؤقت">إعفاء مؤقت</option>
                  <option value="تأجيل دراسي">تأجيل دراسي</option>
                  <option value="غير مطلوب (إناث)">غير مطلوب (إناث)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات أو خبرات سابقة تود ذكرها (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب أي تفاصيل أخرى ترغب في توضيحها لنا..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* زر الإرسال */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white text-sm font-black shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>جاري تسجيل بياناتك...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>إرسال طلب التوظيف الآن</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              🔒 جميع البيانات تخضع لسرية تامة وتُستخدم لأغراض التوظيف فقط.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
