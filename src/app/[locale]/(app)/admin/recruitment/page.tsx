'use client';

import React, { useState, useEffect, use } from 'react';

interface ApplicationItem {
  id: number;
  fullName: string;
  phone: string;
  age: number;
  city: string;
  militaryStatus: string;
  jobTitle: string;
  preferredBranchName: string;
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

  // نافذة طلب عمالة لمدير الفرع
  const [showManpowerModal, setShowManpowerModal] = useState(false);
  const [reqJobTitle, setReqJobTitle] = useState('شيف بروست');
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

  const handleCreateManpowerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bId = localStorage.getItem('userBranchId') || '1';
    const bName = localStorage.getItem('userBranchName') || 'فرعي';
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

      alert('تم إرسال طلب نواقص العمالة بنجاح إلى إدارة الموارد البشرية');
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
            {isRtl ? 'إدارة التوظيف ونواقص العمالة' : 'Recruitment & Manpower Requests'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'متابعة المتقدمين للوظائف وطلبات العمالة الواردة من الفروع'
              : 'Candidate applications & branch manpower requisitions'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowManpowerModal(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 cursor-pointer"
        >
          {isRtl ? '+ طلب نواقص عمالة للفرع' : '+ Request Manpower'}
        </button>
      </div>

      {/* تبويبات التبديل */}
      <div className="flex rounded-2xl bg-slate-200/60 dark:bg-white/5 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'APPLICATIONS'
              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isRtl ? `استمارات المتقدمين (${applications.length})` : 'Applications'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MANPOWER')}
          className={`px-5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'MANPOWER'
              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isRtl ? `طلبات عجز الفروع (${manpowerRequests.length})` : 'Branch Requisitions'}
        </button>
      </div>

      {/* جدول استمارات المتقدمين للوظائف */}
      {activeTab === 'APPLICATIONS' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              {isRtl ? 'لا توجد طلبات تقديم حتى الآن' : 'No applications found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
                <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم المتقدم' : 'Applicant'}</th>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'الوظيفة والفرع' : 'Position & Branch'}</th>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'السن والمدينة' : 'Age & City'}</th>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'الموقف التجنيدي' : 'Military'}</th>
                    <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'السيرة الذاتية' : 'CV'}</th>
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
                        <div className="text-slate-500">{app.preferredBranchName}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        {app.age} سنة | {app.city}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        {app.militaryStatus}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {app.cvUrl ? (
                          <a
                            href={app.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-lg bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 hover:bg-orange-500/20"
                          >
                            عرض الـ CV ↗
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">بدون ملف</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* جدول طلبات نواقص العمالة الواردة من الفروع */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          {manpowerRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              {isRtl ? 'لا توجد طلبات نواقص عمالة حالياً' : 'No manpower requests'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
                <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'الفرع ومقدم الطلب' : 'Branch & Requester'}</th>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'الوظيفة والعدد' : 'Position & Qty'}</th>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'درجة الأهمية' : 'Urgency'}</th>
                    <th className="px-6 py-4 font-semibold">{isRtl ? 'سبب الطلب' : 'Reason'}</th>
                    <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {manpowerRequests.map((m) => (
                    <tr key={m.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <div>{m.branchName}</div>
                        <div className="text-xs font-normal text-slate-500">مقدم الطلب: {m.requestedByName}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-orange-600">
                        {m.jobTitle} ({m.quantity} أفراد)
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            m.urgency === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-600'
                              : m.urgency === 'URGENT'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-slate-500/10 text-slate-600'
                          }`}
                        >
                          {m.urgency === 'CRITICAL' && 'حرجة جداً'}
                          {m.urgency === 'URGENT' && 'عاجل'}
                          {m.urgency === 'NORMAL' && 'عادي'}
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

      {/* نافذة طلب نواقص العمالة */}
      {showManpowerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-white/10 dark:bg-[#121526]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                طلب نواقص عمالة وتشغيل للفرع
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
                    <option value="شيف بروست">شيف بروست</option>
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
                  <option value="NORMAL">عادي (خلال شهر)</option>
                  <option value="URGENT">عاجل (خلال أسبوع)</option>
                  <option value="CRITICAL">حرج وفوري (عجز تشغيلي بالشيفت)</option>
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
                  placeholder="وضح سبب الحاجة لزيادة العمالة..."
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
