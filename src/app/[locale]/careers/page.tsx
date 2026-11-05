'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function PublicCareersPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('23');
  const [city, setCity] = useState('دسوق');
  const [militaryStatus, setMilitaryStatus] = useState('إعفاء نهائي');
  const [jobTitle, setJobTitle] = useState('عضو فريق مطبخ (شيف بروست)');
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
      if (!res.ok) throw new Error(resData.message || 'فشل إرسال الطلب');

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال استمارة التقديم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#080911] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-2xl font-black text-white shadow-xl shadow-orange-500/20 mb-4">
            LK
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {isRtl ? 'انضم إلى فريق عملنا' : 'Join Our Team'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            {isRtl ? 'بوابة التوظيف المباشرة لسلسلة المطاعم والفروع - L-K Shift' : 'Career Portal & Talent Acquisition'}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#121526]/90 p-8 shadow-2xl backdrop-blur-xl">
          {isSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-3xl">
                ✓
              </div>
              <h2 className="text-xl font-bold text-white">تم استلام طلبك بنجاح!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                شكراً لاهتمامك بالانضمام إلينا. تم حفظ بياناتك لدى إدارة الموارد البشرية، وسيتم التواصل معك هاتفياً لتحديد موعد المقابلة.
              </p>
              <div className="pt-4">
                <Link
                  href={`/${locale}/login`}
                  className="inline-block text-xs font-bold text-orange-400 hover:underline"
                >
                  العودة لتسجيل الدخول &larr;
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الاسم رباعي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك رباعي كما بالبطاقة"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رقم الهاتف والتواصل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">السن</label>
                  <input
                    type="number"
                    min="18"
                    max="60"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">المدينة / محل الإقامة</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="دسوق، كفر الشيخ..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الموقف من التجنيد</label>
                  <select
                    value={militaryStatus}
                    onChange={(e) => setMilitaryStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="تم التأدية">تم تأدية الخدمة العسكرية</option>
                    <option value="إعفاء نهائي">إعفاء نهائي</option>
                    <option value="تأجيل">تأجيل دراسي / عائلي</option>
                    <option value="غير مطلوب">غير مطلوب (إناث)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوظيفة المرغوبة</label>
                  <select
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="عضو فريق مطبخ (شيف بروست)">عضو فريق مطبخ (شيف بروست)</option>
                    <option value="كاشير واستقبال">كاشير واستقبال</option>
                    <option value="عضو صالة وخدمة عملاء">عضو صالة وخدمة عملاء</option>
                    <option value="مندوب توصيل (ديليفري)">مندوب توصيل (ديليفري)</option>
                    <option value="مشرف تشغيل / صالة">مشرف تشغيل / صالة</option>
                    <option value="خدمة عملاء وكول سنتر">خدمة عملاء وكول سنتر</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الفرع الأقرب لك للعمل</label>
                  <select
                    value={preferredBranchName}
                    onChange={(e) => setPreferredBranchName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="فرع دسوق">فرع دسوق</option>
                    <option value="فرع كفر الشيخ">فرع كفر الشيخ</option>
                    <option value="الإدارة المركزية">الإدارة المركزية</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رابط السيرة الذاتية (CV) أو Google Drive (اختياري)
                  </label>
                  <input
                    type="url"
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    placeholder="https://drive.google.com/... أو رابط لينكد إن"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال استمارة التقديم'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
