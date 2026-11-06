'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function GoogleFormsStyleCareersPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('23');
  const [city, setCity] = useState('');
  const [militaryStatus, setMilitaryStatus] = useState('تم التأدية');
  const [jobTitle, setJobTitle] = useState('شيف بروست ومطبخ');
  const [preferredBranchName, setPreferredBranchName] = useState('فرع دسوق');
  const [cvUrl, setCvUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY',
          fullName: fullName.trim(),
          phone: phone.trim(),
          age: parseInt(age, 10),
          city: city.trim(),
          militaryStatus,
          jobTitle,
          preferredBranchName,
          cvUrl: cvUrl.trim() || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل إرسال الاستمارة');

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الاستمارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0ebf8] dark:bg-[#0f111a] py-8 px-4 font-sans text-slate-900 dark:text-slate-100" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* كارت رأس الاستمارة (بنفس شريط جوجل فورمز العلوي) */}
        <div className="rounded-2xl border-t-8 border-t-purple-600 bg-white dark:bg-[#1a1d2d] shadow-sm p-6 sm:p-8 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            استمارة التقديم والتوظيف - L-K Shift
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            يرجى تعبئة كافة الحقول بدقة. سيتم مراجعة طلبك بواسطة إدارة الموارد البشرية والتواصل معك هاتفياً لتحديد موعد المقابلة الشخصية.
          </p>
          <div className="pt-2 text-[11px] text-rose-600 font-semibold border-t border-slate-100 dark:border-white/5">
            * يشير إلى سؤال مطلوب
          </div>
        </div>

        {isSuccess ? (
          <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-8 text-center space-y-3">
            <div className="text-4xl text-emerald-500">✓</div>
            <h2 className="text-xl font-bold">تم تسجيل ردك بنجاح!</h2>
            <p className="text-xs text-slate-500">شكراً لتقديمك. تم حفظ بياناتك وسيتم التواصل معك قريباً.</p>
            <div className="pt-4">
              <Link href={`/${locale}/careers`} onClick={() => setIsSuccess(false)} className="text-xs text-purple-600 underline font-bold">
                إرسال رد آخر
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-bold text-rose-800">
                {errorMsg}
              </div>
            )}

            {/* سؤال 1: الاسم */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                الاسم رباعي (كما هو مدون بالبطاقة) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="إجابتك"
                className="w-full border-b-2 border-slate-300 bg-transparent py-1.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700"
              />
            </div>

            {/* سؤال 2: رقم الهاتف */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                رقم التليفون (متاح واتساب للمقابلة) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full border-b-2 border-slate-300 bg-transparent py-1.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 font-mono text-left"
                dir="ltr"
              />
            </div>

            {/* سؤال 3: السن */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                السن <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="18"
                max="60"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="إجابتك"
                className="w-full border-b-2 border-slate-300 bg-transparent py-1.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700"
              />
            </div>

            {/* سؤال 4: المدينة */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                المدينة / محل الإقامة الحالي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: دسوق / كفر الشيخ"
                className="w-full border-b-2 border-slate-300 bg-transparent py-1.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700"
              />
            </div>

            {/* سؤال 5: الموقف التجنيدي (Radio Buttons) */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                الموقف من التجنيد <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2.5 pt-1">
                {['تم التأدية', 'إعفاء نهائي', 'تأجيل دراسي / عائلي', 'غير مطلوب (إناث)'].map((opt) => (
                  <label key={opt} className="flex items-center gap-3 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="militaryStatus"
                      value={opt}
                      checked={militaryStatus === opt}
                      onChange={(e) => setMilitaryStatus(e.target.value)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* سؤال 6: الوظيفة المطلوبة (Radio Buttons) */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                الوظيفة المراد التقديم عليها <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2.5 pt-1">
                {[
                  'شيف بروست ومطبخ',
                  'كاشير واستقبال',
                  'عضو صالة وخدمة عملاء',
                  'مندوب توصيل (ديليفري)',
                  'مشرف تشغيل',
                  'خدمة عملاء وكول سنتر',
                ].map((opt) => (
                  <label key={opt} className="flex items-center gap-3 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="jobTitle"
                      value={opt}
                      checked={jobTitle === opt}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* سؤال 7: الفرع الأقرب */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                الفرع الأقرب لك للعمل <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2.5 pt-1">
                {['فرع دسوق', 'فرع كفر الشيخ', 'الإدارة المركزية'].map((opt) => (
                  <label key={opt} className="flex items-center gap-3 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="preferredBranch"
                      value={opt}
                      checked={preferredBranchName === opt}
                      onChange={(e) => setPreferredBranchName(e.target.value)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* سؤال 8: رابط الـ CV */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d2d] shadow-sm p-6 space-y-3">
              <label className="block text-sm font-bold">
                رابط السيرة الذاتية (CV) أو Google Drive (اختياري)
              </label>
              <input
                type="url"
                value={cvUrl}
                onChange={(e) => setCvUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full border-b-2 border-slate-300 bg-transparent py-1.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 text-left font-mono"
                dir="ltr"
              />
            </div>

            {/* زر الإرسال بنمط جوجل فورمز */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-purple-600 px-8 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFullName('');
                  setPhone('');
                  setCity('');
                  setCvUrl('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                محو النموذج
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-[11px] text-slate-400 pt-4">
          لم يتم إنشاء هذا النموذج أو اعتماده بواسطة Google. - نظام L-K Shift
        </div>
      </div>
    </div>
  );
}
