'use client';

import React, { useState, useEffect, use } from 'react';

interface ApplicationItem {
  id: number;
  fullName: string;
  phone: string;
  age: number;
  birthDate?: string;
  city: string;
  militaryStatus: string;
  jobTitle: string;
  expectedSalary?: number;
  skillsCourses?: string;
  experienceNotes?: string;
  cvUrl?: string;
  status: string;
  createdAt: string;
}

interface ManpowerItem {
  id: number;
  branchName: string;
  requestedByName: string;
  jobTitle: string;
  quantity: number;
  urgency: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminRecruitmentPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'APPLICATIONS' | 'MANPOWER'>('APPLICATIONS');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [manpowerRequests, setManpowerRequests] = useState<ManpowerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const [showManpowerModal, setShowManpowerModal] = useState(false);
  const [reqJobTitle, setReqJobTitle] = useState('شيف بروست ومطبخ');
  const [reqQty, setReqQty] = useState('2');
  const [reqUrgency, setReqUrgency] = useState('URGENT');
  const [reqReason, setReqReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [appsRes, manRes] = await Promise.all([
        fetch('/api/recruitment', { cache: 'no-store' }),
        fetch('/api/recruitment?view=MANPOWER_REQUESTS', { cache: 'no-store' }),
      ]);

      if (appsRes.ok) setApplications(await appsRes.json());
      if (manRes.ok) setManpowerRequests(await manRes.json());
    } catch (err) {
      console.error('Failed to load recruitment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCareerLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://l-k-shift.vercel.app';
    const careerUrl = `${origin}/${locale}/careers`;
    navigator.clipboard.writeText(careerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadApplicantPDF = (app: ApplicationItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لتحميل ملف الـ PDF');
      return;
    }

    const applicationDate = new Date(app.createdAt).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>استمارة توظيف - ${app.fullName}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; direction: rtl; background: #fff; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #ea580c; padding-bottom: 12px; margin-bottom: 16px; }
          .logo-img { height: 60px; width: auto; object-fit: contain; }
          .title-box h1 { margin: 0; font-size: 19px; color: #0f172a; }
          .title-box p { margin: 3px 0 0; font-size: 11px; color: #64748b; }
          .badge { display: inline-block; background: #ffedd5; color: #c2410c; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 6px; margin-top: 4px; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 12px; font-weight: bold; background: #f8fafc; border-right: 4px solid #ea580c; padding: 6px 10px; margin-bottom: 8px; color: #334155; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
          .field { border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
          .label { font-size: 10px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px; }
          .value { font-size: 12px; font-weight: bold; color: #0f172a; }
          .notes-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-size: 11px; line-height: 1.5; color: #1e293b; white-space: pre-wrap; }
          .evaluation-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; min-height: 80px; background: #fcfcfc; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 25px; text-align: center; }
          .sig-line { border-top: 1px solid #94a3b8; margin-top: 35px; padding-top: 4px; font-size: 10px; color: #475569; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-box">
            <h1>استمارة طلب التحاق بالعمل (Job Application)</h1>
            <p>منظومة إدارة الكوادر والموارد البشرية — L-K Shift</p>
            <span class="badge">كود الملف: APP-${app.id}</span>
          </div>
          <img src="/Logo.png" alt="L-K Shift Logo" class="logo-img" />
        </div>

        <div class="section">
          <div class="section-title">أولاً: البيانات الشخصية للمتقدم</div>
          <div class="grid">
            <div class="field"><span class="label">الاسم رباعي:</span><span class="value">${app.fullName}</span></div>
            <div class="field"><span class="label">رقم الهاتف (واتساب):</span><span class="value" dir="ltr">${app.phone}</span></div>
            <div class="field"><span class="label">السن وتاريخ الميلاد:</span><span class="value">${app.age} سنة ${app.birthDate ? `(${app.birthDate})` : ''}</span></div>
            <div class="field"><span class="label">محل السكن / المدينة:</span><span class="value">${app.city}</span></div>
            <div class="field"><span class="label">الموقف من التجنيد:</span><span class="value">${app.militaryStatus}</span></div>
            <div class="field"><span class="label">تاريخ التقديم:</span><span class="value">${applicationDate}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ثانياً: الوظيفة والراتب المتوقع</div>
          <div class="grid">
            <div class="field"><span class="label">الوظيفة المتقدم عليها:</span><span class="value" style="color: #ea580c;">${app.jobTitle}</span></div>
            <div class="field"><span class="label">الراتب المتوقع:</span><span class="value">${app.expectedSalary ? `${app.expectedSalary} ج.م` : 'لم يحدد'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ثالثاً: الكورسات والمهارات الشخصية</div>
          <div class="notes-box">${app.skillsCourses || 'لا توجد كورسات مسجلة'}</div>
        </div>

        <div class="section">
          <div class="section-title">رابعاً: سابقة الأعمال والخبرات السابقة</div>
          <div class="notes-box">${app.experienceNotes || 'لا توجد سابقة أعمال مسجلة'}</div>
        </div>

        ${app.cvUrl ? `
          <div class="section">
            <div class="section-title">خامساً: رابط السيرة الذاتية (CV)</div>
            <div style="font-size: 11px; color: #ea580c; word-break: break-all;">
              <a href="${app.cvUrl}" target="_blank">${app.cvUrl}</a>
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">تقييم وقرار المقابلة الشخصية (خاص بإدارة الموارد البشرية)</div>
          <div class="evaluation-box">
            <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
              [ &nbsp; ] مقبول &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] قائمة انتظار &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] مرفوض &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; الراتب المعتمد: .......................... ج.م
            </div>
            <div style="font-size: 10px; color: #64748b;">ملاحظات مسؤول المقابلة:</div>
          </div>
        </div>

        <div class="signatures">
          <div><div class="sig-line">توقيع المتقدم</div></div>
          <div><div class="sig-line">مسؤول المقابلة (HR)</div></div>
          <div><div class="sig-line">اعتماد الإدارة</div></div>
        </div>

        <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleCreateManpowerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bId = localStorage.getItem('userBranchId') || '1';
    const bName = localStorage.getItem('userBranchName') || 'الفرع';
    const uName = localStorage.getItem('userName') || 'مدير الفرع';

    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_MANPOWER',
          branchId: bId,
          branchName: bName,
          requestedByName: uName,
          jobTitle: reqJobTitle,
          quantity: parseInt(reqQty, 10),
          urgency: reqUrgency,
          reason: reqReason.trim(),
        }),
      });

      if (!res.ok) throw new Error('فشل إرسال الطلب');

      alert('تم إرسال طلب عجز العمالة بنجاح إلى إدارة الموارد البشرية');
      setShowManpowerModal(false);
      setReqReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {activeTab === 'APPLICATIONS' ? 'استمارات التوظيف للمتقدمين' : 'طلبات عجز وتشغيل الفروع'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'APPLICATIONS'
              ? 'متابعة وفحص استمارات المتقدمين وتوليد وثائق الـ PDF الرسمية للمقابلة'
              : 'متابعة وإرسال طلبات سد العجز والعمالة الواردة من مديري الفروع'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'APPLICATIONS' ? (
            <>
              <button
                type="button"
                onClick={handleCopyCareerLink}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  copiedLink ? 'bg-emerald-600' : 'bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95'
                }`}
              >
                <span>{copiedLink ? '✓ تم النسخ للحافظة!' : '📋 نسخ رابط الاستمارة للتقديم'}</span>
              </button>
              <a
                href={`/${locale}/careers`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 bg-white dark:bg-white/5 dark:border-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
              >
                👁️ فتح الاستمارة
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowManpowerModal(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 cursor-pointer"
            >
              + إنشاء طلب عجز عمالة للفرع
            </button>
          )}
        </div>
      </div>

      <div className="flex rounded-2xl bg-slate-200/60 dark:bg-white/5 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'APPLICATIONS'
              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          📄 استمارات المتقدمين للوظائف ({applications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MANPOWER')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'MANPOWER'
              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          🏢 طلبات عجز وتشغيل الفروع ({manpowerRequests.length})
        </button>
      </div>

      {activeTab === 'APPLICATIONS' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              لا توجد استمارات تقديم مسجلة حتى الآن
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
                <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">اسم المتقدم</th>
                    <th className="px-6 py-4 font-semibold">الوظيفة والراتب</th>
                    <th className="px-6 py-4 font-semibold">السن وتاريخ الميلاد</th>
                    <th className="px-6 py-4 font-semibold">المدينة والتجنيد</th>
                    <th className="px-6 py-4 font-semibold text-center">الاستمارة والـ PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {applications.map((app) => (
                    <tr key={app.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <div>{app.fullName}</div>
                        <div className="text-xs font-mono font-normal text-slate-500">{app.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-bold text-orange-600">{app.jobTitle}</span>
                        {app.expectedSalary && (
                          <div className="text-emerald-500 font-mono mt-0.5">الراتب المتوقع: {app.expectedSalary} ج.م</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>{app.age} سنة</div>
                        {app.birthDate && <div className="text-[11px] font-mono text-slate-400">{app.birthDate}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>{app.city}</div>
                        <div className="text-[11px] text-slate-400">{app.militaryStatus}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadApplicantPDF(app)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-500/20 transition cursor-pointer"
                            title="تحميل وطباعة الاستمارة بصيغة PDF الرسمية"
                          >
                            <span>📄 تحميل PDF</span>
                          </button>

                          {app.cvUrl && (
                            <a
                              href={app.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-300 hover:bg-slate-50"
                            >
                              الـ CV ↗
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          {manpowerRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              لا توجد طلبات عجز عمالة حالياً
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
                <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">الفرع ومقدم الطلب</th>
                    <th className="px-6 py-4 font-semibold">الوظيفة والعدد المطلوب</th>
                    <th className="px-6 py-4 font-semibold">درجة الأهمية</th>
                    <th className="px-6 py-4 font-semibold">السبب وتفاصيل العجز</th>
                    <th className="px-6 py-4 font-semibold text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {manpowerRequests.map((m) => (
                    <tr key={m.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <div>{m.branchName}</div>
                        <div className="text-xs font-normal text-slate-500">{m.requestedByName}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-orange-600">
                        {m.jobTitle} ({m.quantity} أفراد)
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600">
                          {m.urgency === 'CRITICAL' ? 'حرج وفوري' : m.urgency === 'URGENT' ? 'عاجل' : 'عادي'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                        {m.reason}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600">
                          قيد المراجعة
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showManpowerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-white/10 dark:bg-[#121526]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                طلب عجز وتشغيل عمالة للفرع
              </h3>
              <button
                type="button"
                onClick={() => setShowManpowerModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManpowerRequest} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المسمى الوظيفي المطلوب
                  </label>
                  <select
                    value={reqJobTitle}
                    onChange={(e) => setReqJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="شيف بروست ومطبخ">شيف بروست ومطبخ</option>
                    <option value="كاشير">كاشير</option>
                    <option value="عضو صالة">عضو صالة</option>
                    <option value="ديليفري">ديليفري</option>
                    <option value="مشرف تشغيل">مشرف تشغيل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العدد المطلوب
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  درجة الأهمية
                </label>
                <select
                  value={reqUrgency}
                  onChange={(e) => setReqUrgency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="NORMAL">عادي</option>
                  <option value="URGENT">عاجل</option>
                  <option value="CRITICAL">حرج وفوري (عجز بالشيفت)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سبب الطلب وتفاصيل العجز
                </label>
                <textarea
                  required
                  rows={3}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="وضح سبب الحاجة للعمالة..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowManpowerModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
