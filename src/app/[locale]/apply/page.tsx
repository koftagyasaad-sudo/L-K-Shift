'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function JobApplicationFormPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  // حقول استمارة التوظيف
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedRole, setSelectedRole] = useState('كول سنتر');
  const [customRole, setCustomRole] = useState('');
  const [education, setEducation] = useState('مؤهل عالي');
  const [militaryStatus, setMilitaryStatus] = useState('أدى الخدمة العسكرية');
  const [address, setAddress] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [experienceYears, setExperienceYears] = useState('سنة إلى سنتين');
  const [skillsAndNotes, setSkillsAndNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const roleOptions = [
    'كول سنتر (Call Center)',
    'عضو فريق مطبخ (Kitchen Staff)',
    'كابتن صالة وويتر (Service)',
    'كاشير (Cashier)',
    'مشرف وردية (Shift Supervisor)',
    'دليفري / طيار توصيل',
    'أخرى',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalRole = selectedRole === 'أخرى' ? customRole.trim() : selectedRole;
    if (selectedRole === 'أخرى' && !customRole.trim()) {
      setErrorMsg('يرجى كتابة المسمى الوظيفي المطلوب في خانة (أخرى)');
      return;
    }

    if (nationalId && nationalId.trim().length !== 14) {
      setErrorMsg('الرقم القومي يجب أن يتكون من 14 رقماً بدقة');
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
          appliedRole: finalRole,
          education,
          militaryStatus,
          address: address.trim(),
          expectedSalary: expectedSalary.trim(),
          experienceYears,
          notes: skillsAndNotes.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('تعذر إرسال الاستمارة، يرجى المحاولة لاحقاً');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الاستمارة');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFullName('');
    setPhone('');
    setNationalId('');
    setBirthDate('');
    setSelectedRole('كول سنتر');
    setCustomRole('');
    setAddress('');
    setExpectedSalary('');
    setSkillsAndNotes('');
  };

  // شاشة نجاح إرسال نموذج Google Form
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f0ebf8] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-slate-800 space-y-4">
          <div className="h-2.5 w-full bg-[#673ab7] rounded-full mb-6" />
          <h1 className="text-2xl font-bold text-slate-900">استمارة طلب الالتحاق بالعمل</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            تم تسجيل ردك بنجاح. شكراً لاهتمامك بالانضمام إلى فريق عملنا، ستقوم إدارة الموارد البشرية بمراجعة استمارتك والتواصل معك لتحديد موعد المقابلة الشخصية.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="text-[#673ab7] hover:underline text-xs font-semibold cursor-pointer"
            >
              إرسال رد آخر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0ebf8] py-8 px-4 text-slate-800 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* كارت عنوان الاستمارة بنمط Google Forms */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="h-3 bg-[#673ab7] w-full" />
          <div className="p-6 sm:p-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              استمارة طلب التحاق بالعمل (Job Application)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              يسعدنا رغبتك في الانضمام إلينا. يرجى ملء كافة البيانات المطلوبة بدقة لمراجعتها من قبل قسم الموارد البشرية.
            </p>
            <div className="pt-2 text-[11px] text-rose-600 font-semibold">
              * تشير إلى سؤال مطلوب
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* السؤال 1: الاسم بالكامل */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              الاسم بالكامل (رباعي طبقاً للبطاقة) <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="إجابتك"
              className="w-full border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm transition-colors"
            />
          </div>

          {/* السؤال 2: رقم الهاتف */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              رقم الهاتف المحمول (الواتساب) <span className="text-rose-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm font-mono text-left transition-colors"
              dir="ltr"
            />
          </div>

          {/* السؤال 3: الرقم القومي */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              الرقم القومي (14 رقماً) <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              maxLength={14}
              required
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="299xxxxxxxxxxx"
              className="w-full border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm font-mono text-left transition-colors"
              dir="ltr"
            />
          </div>

          {/* السؤال 4: تاريخ الميلاد */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              تاريخ الميلاد <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm transition-colors"
            />
          </div>

          {/* السؤال 5: الوظيفة المطلوبة (مع خيار أخرى والكتابة اليدوية) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              الوظيفة المتقدم لها <span className="text-rose-600">*</span>
            </label>
            <div className="space-y-2.5 pt-1">
              {roleOptions.map((role) => (
                <label key={role} className="flex items-center gap-3 cursor-pointer group text-xs sm:text-sm">
                  <input
                    type="radio"
                    name="appliedRole"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="accent-[#673ab7] h-4 w-4"
                  />
                  <span>{role}</span>
                </label>
              ))}

              {/* حقل الإدخال اليدوي إذا تم اختيار "أخرى" */}
              {selectedRole === 'أخرى' && (
                <div className="pr-7 pt-1">
                  <input
                    type="text"
                    required
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="اكتب المسمى الوظيفي المطلوب هنا..."
                    className="w-full border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm text-slate-900 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* السؤال 6: المؤهل الدراسي */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              المؤهل الدراسي <span className="text-rose-600">*</span>
            </label>
            <div className="space-y-2 pt-1 text-xs sm:text-sm">
              {['مؤهل عالي (جامعي / ليسانس / بكالوريوس)', 'مؤهل فوق متوسط', 'مؤهل متوسط (دبلوم فني / ثانوية)', 'طالب حالياً بالجامعة'].map((edu) => (
                <label key={edu} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="education"
                    value={edu}
                    checked={education === edu}
                    onChange={(e) => setEducation(e.target.value)}
                    className="accent-[#673ab7] h-4 w-4"
                  />
                  <span>{edu}</span>
                </label>
              ))}
            </div>
          </div>

          {/* السؤال 7: الموقف من التجنيد */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">الموقف من التجنيد (للذكور)</label>
            <div className="space-y-2 pt-1 text-xs sm:text-sm">
              {['أدى الخدمة العسكرية', 'إعفاء نهائي', 'إعفاء مؤقت', 'تأجيل دراسي', 'غير مطلوب (إناث)'].map((mil) => (
                <label key={mil} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="military"
                    value={mil}
                    checked={militaryStatus === mil}
                    onChange={(e) => setMilitaryStatus(e.target.value)}
                    className="accent-[#673ab7] h-4 w-4"
                  />
                  <span>{mil}</span>
                </label>
              ))}
            </div>
          </div>

          {/* السؤال 8: محل الإقامة */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              العنوان ومحل الإقامة الحالي بالتفصيل <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المدينة، اسم المنطقة، أو القرية..."
              className="w-full border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm transition-colors"
            />
          </div>

          {/* السؤال 9: الراتب المتوقع */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">الراتب المتوقع (شهرياً بالجنيه)</label>
            <input
              type="text"
              value={expectedSalary}
              onChange={(e) => setExpectedSalary(e.target.value)}
              placeholder="مثال: 5500"
              className="w-full border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm font-mono text-left transition-colors"
              dir="ltr"
            />
          </div>

          {/* السؤال 10: الخبرات السابقة والمهارات */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              سابقة الأعمال، الخبرات، أو مهارات إضافية ترغب في ذكرها
            </label>
            <textarea
              rows={3}
              value={skillsAndNotes}
              onChange={(e) => setSkillsAndNotes(e.target.value)}
              placeholder="اذكر المطاعم أو الشركات التي عملت بها ومدة العمل..."
              className="w-full border-b border-slate-300 focus:border-[#673ab7] focus:outline-none py-1.5 text-sm transition-colors resize-none"
            />
          </div>

          {/* زر الإرسال بنمط Google Forms */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#673ab7] hover:bg-[#5e35b1] text-white font-semibold px-8 py-2.5 rounded-lg text-sm shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'جاري الإرسال...' : 'إرسال'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="text-[#673ab7] hover:bg-purple-50 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              تفريغ النموذج
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
