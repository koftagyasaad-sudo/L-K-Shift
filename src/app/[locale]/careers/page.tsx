'use client';

import React, { useState, use } from 'react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

const STANDARD_JOBS = [
  'شيف بروست ومطبخ',
  'كاشير واستقبال',
  'عضو صالة وخدمة عملاء',
  'مندوب توصيل (ديليفري)',
  'مشرف تشغيل / صالة',
  'خدمة عملاء وكول سنتر',
  'أخرى (يرجى التحديد يدويًا)',
];

export default function CustomBrandedCareersPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('23');
  const [birthDate, setBirthDate] = useState('2003-01-01');
  const [city, setCity] = useState('');
  const [militaryStatus, setMilitaryStatus] = useState('تم التأدية');

  // اختيار الوظيفة + خيار "أخرى"
  const [selectedJob, setSelectedJob] = useState('شيف بروست ومطبخ');
  const [customJobTitle, setCustomJobTitle] = useState('');

  // الحقول الإضافية الجديدة
  const [expectedSalary, setExpectedSalary] = useState('');
  const [skillsCourses, setSkillsCourses] = useState('');
  const [experienceNotes, setExperienceNotes] = useState('');
  const [cvUrl, setCvUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // تحديد المسمى النهائي
    const finalJobTitle = selectedJob === 'أخرى (يرجى التحديد يدويًا)' ? customJobTitle.trim() : selectedJob;

    if (!finalJobTitle) {
      setErrorMsg('يرجى كتابة المسمى الوظيفي المطلوب يدوياً');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY',
          fullName: fullName.trim(),
          phone: phone.trim(),
          age: parseInt(age, 10),
          birthDate: birthDate || null,
          city: city.trim(),
          militaryStatus,
          jobTitle: finalJobTitle,
          expectedSalary: expectedSalary ? parseFloat(expectedSalary) : null,
          skillsCourses: skillsCourses.trim(),
          experienceNotes: experienceNotes.trim(),
          cvUrl: cvUrl.trim() || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل إرسال الطلب');

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال استمارة التقديم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#080911] text-slate-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* إضاءات خلفية هوية L-K Shift */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl space-y-6">
        {/* الترويسة الأنيقة */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#141829] to-[#0d0f1b] p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3.5 py-1 text-xs font-bold text-orange-400 mb-3">
                <span>✦</span> انضم لكوادر L-K Shift
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                استمارة طلب التحاق بالعمل
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                يسعدنا انضمامك لفريقنا. يرجى تعبئة بياناتك بدقة لتتم مراجعة طلبك والتواصل معك لتحديد موعد المقابلة الشخصية.
              </p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 font-black text-2xl text-white shadow-xl shadow-orange-500/25">
              LK
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="rounded-3xl border border-emerald-500/20 bg-[#121526]/90 p-10 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-4xl border border-emerald-500/20">
              ✓
            </div>
            <h2 className="text-2xl font-black text-white">تم استلام طلب توظيفك بنجاح!</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              تم تسجيل استمارتك رسمياً في المنظومة لدى إدارة الموارد البشرية. سيتم مراجعة مؤهلاتك والاتصال بك هاتفياً في أقرب وقت.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
              >
                تقديم استمارة جديدة &larr;
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* القسم 1: البيانات الشخصية */}
            <div className="rounded-3xl border border-white/5 bg-[#121526]/80 p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 text-xs font-black">1</span>
                <h3 className="text-sm font-bold text-white">البيانات الشخصية للمتقدم</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    الاسم رباعي (كما بالبطاقة) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="محمد أحمد إبراهيم علي"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    رقم الهاتف والتواصل (واتساب) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoCapitalize="none"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                {/* السن وتاريخ الميلاد جنباً إلى جنب */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    السن (بالسنوات) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="65"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    تاريخ الميلاد <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    المدينة / محل السكن الحالي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="دسوق، كفر الشيخ..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    الموقف من التجنيد <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={militaryStatus}
                    onChange={(e) => setMilitaryStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="تم التأدية">تم تأدية الخدمة العسكرية</option>
                    <option value="إعفاء نهائي">إعفاء نهائي</option>
                    <option value="تأجيل دراسي / عائلي">تأجيل دراسي / عائلي</option>
                    <option value="غير مطلوب (إناث)">غير مطلوب (إناث)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* القسم 2: تفاصيل الوظيفة المطلوبة مع خيار "أخرى" والراتب المتوقع */}
            <div className="rounded-3xl border border-white/5 bg-[#121526]/80 p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 text-xs font-black">2</span>
                <h3 className="text-sm font-bold text-white">الوظيفة والراتب المتوقع</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-3">
                  الوظيفة المراد التقديم عليها <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STANDARD_JOBS.map((job) => {
                    const isSelected = selectedJob === job;
                    return (
                      <button
                        type="button"
                        key={job}
                        onClick={() => setSelectedJob(job)}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-right text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-md shadow-orange-500/10'
                            : 'border-white/5 bg-black/20 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 rounded-full border items-center justify-center ${
                            isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{job}</span>
                      </button>
                    );
                  })}
                </div>

                {/* خانة كتابة الوظيفة يدوياً عند اختيار "أخرى" */}
                {selectedJob === 'أخرى (يرجى التحديد يدويًا)' && (
                  <div className="mt-3.5 p-4 rounded-2xl border border-orange-500/30 bg-orange-500/5">
                    <label className="block text-xs font-bold text-orange-400 mb-1.5">
                      اكتب المسمى الوظيفي المطلوب بدقة: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customJobTitle}
                      onChange={(e) => setCustomJobTitle(e.target.value)}
                      placeholder="مثال: مسؤول تسويق، محاسب فرع، فني صيانة..."
                      className="w-full rounded-xl border border-orange-500/40 bg-black/50 px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* الراتب المتوقع */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  الراتب المتوقع (بالجنيه المصري)
                </label>
                <input
                  type="number"
                  min="0"
                  step="200"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="مثال: 5500"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* القسم 3: المهارات وسابقة الأعمال ومرفق الـ CV */}
            <div className="rounded-3xl border border-white/5 bg-[#121526]/80 p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 text-xs font-black">3</span>
                <h3 className="text-sm font-bold text-white">المهارات والخبرات العملية</h3>
              </div>

              {/* الكورسات والمهارات الشخصية */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  الكورسات والمهارات الشخصية
                </label>
                <textarea
                  rows={2}
                  value={skillsCourses}
                  onChange={(e) => setSkillsCourses(e.target.value)}
                  placeholder="مثال: كورس سلامة وجودة أغذية، إجادة برامج الكاشير، سرعة البديهة واللباقة..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* ملاحظات وسابقة الأعمال */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  ملاحظات وسابقة الأعمال (الخبرات السابقة)
                </label>
                <textarea
                  rows={3}
                  value={experienceNotes}
                  onChange={(e) => setExperienceNotes(e.target.value)}
                  placeholder="المطاعم أو الأماكن التي عملت بها سابقاً، المدة، والمهام التي كنت مسؤولاً عنها..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* رابط الـ CV */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  رابط السيرة الذاتية (CV) أو Google Drive (اختياري)
                </label>
                <input
                  type="url"
                  value={cvUrl}
                  onChange={(e) => setCvUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* زر الإرسال */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-rose-600 to-pink-600 py-4 text-sm font-black text-white shadow-xl shadow-orange-500/25 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'جاري إرسال الاستمارة...' : 'إرسال استمارة طلب التوظيف الآن'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-4">
          منظومة إدارة الكوادر والموارد البشرية — L-K Shift © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
