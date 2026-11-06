'use client';

import React, { useState, useEffect, use } from 'react';

interface RequestItem {
  id: number;
  requestType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationHours: number;
  advanceAmount?: number;
  substituteName: string;
  reason: string;
  finalStatus: string;
  branchNotes?: string;
  hrNotes?: string;
  createdAt: string;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function EmployeeRequestsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [requestsList, setRequestsList] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // حقول الطلب
  const [requestType, setRequestType] = useState('ANNUAL'); // ANNUAL, PERMISSION, ADVANCE, SICK, UNPAID
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationHours, setDurationHours] = useState('2');
  const [advanceAmount, setAdvanceAmount] = useState('1000');
  const [repaymentMonths, setRepaymentMonths] = useState('2');
  const [substituteName, setSubstituteName] = useState('');
  const [reason, setReason] = useState('');

  const fetchMyRequests = async () => {
    try {
      setIsLoading(true);
      const uid = localStorage.getItem('userId') || '1';
      const res = await fetch(`/api/leave-requests?userId=${uid}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequestsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const uid = localStorage.getItem('userId') || '1';
    const uName = localStorage.getItem('userName') || 'موظف';
    const uPhone = localStorage.getItem('userPhone') || '';
    const bId = localStorage.getItem('userBranchId') || '';
    const bName = localStorage.getItem('userBranchName') || 'الفرع المسند';

    let days = 1;
    if (requestType !== 'PERMISSION' && requestType !== 'ADVANCE' && startDate && endDate) {
      const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          userName: uName,
          userPhone: uPhone,
          branchId: bId,
          branchName: bName,
          requestType,
          startDate: requestType === 'ADVANCE' ? new Date().toISOString().slice(0, 10) : startDate,
          endDate: requestType === 'PERMISSION' || requestType === 'ADVANCE' ? startDate : endDate,
          durationDays: requestType === 'PERMISSION' || requestType === 'ADVANCE' ? 0 : days,
          durationHours: requestType === 'PERMISSION' ? parseFloat(durationHours) : 0,
          advanceAmount: requestType === 'ADVANCE' ? parseFloat(advanceAmount) : 0,
          substituteName: requestType === 'ADVANCE' ? '—' : substituteName,
          reason,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل إرسال الطلب');

      setStatusMessage({ text: 'تم إرسال طلبك بنجاح لمسار الاعتماد المزدوج', isError: false });
      setShowModal(false);
      setReason('');
      setSubstituteName('');
      await fetchMyRequests();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'حدث خطأ أثناء إرسال الطلب', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (finalStatus: string) => {
    switch (finalStatus) {
      case 'PENDING_BRANCH':
        return <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">⏳ بانتظار مدير الفرع</span>;
      case 'PENDING_HR':
        return <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600">✓ موافقة الفرع ➜ بانتظار الـ HR</span>;
      case 'APPROVED':
        return <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">✓ معتمد نهائياً</span>;
      case 'REJECTED_BRANCH':
        return <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600">✕ مرفوض من مدير الفرع</span>;
      case 'REJECTED_HR':
        return <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600">✕ مرفوض من الـ HR</span>;
      default:
        return <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 text-xs font-bold text-slate-500">قيد المراجعة</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'تقديم ومتابعة الطلبات (إجازة / إذن / سلفة)' : 'Requests Portal'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isRtl ? 'تقديم طلب جديد ومتابعة ردود مدير الفرع وإدارة الـ HR' : 'Submit & track leaves, permissions, and salary advances'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 cursor-pointer"
        >
          {isRtl ? '+ تقديم طلب جديد' : '+ New Request'}
        </button>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-bold ${
            statusMessage.isError
              ? 'border border-rose-500/30 bg-rose-50 text-rose-800'
              : 'border border-emerald-500/30 bg-emerald-50 text-emerald-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* جدول الطلبات */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
        {isLoading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : requestsList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            {isRtl ? 'لم تقدم أي طلبات حتى الآن' : 'No requests submitted yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'نوع الطلب' : 'Type'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'التفاصيل / القيمة' : 'Details'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'حالة الاعتماد' : 'Status'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الملاحظات والردود' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {requestsList.map((req) => (
                  <tr key={req.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {req.requestType === 'ANNUAL' && 'إجازة سنوية اعتيادية'}
                      {req.requestType === 'PERMISSION' && `إذن ساعي (${req.durationHours} س)`}
                      {req.requestType === 'ADVANCE' && 'طلب سلفة مالية'}
                      {req.requestType === 'SICK' && 'إجازة مرضية'}
                      {req.requestType === 'UNPAID' && 'إجازة بدون راتب'}
                      <div className="text-[11px] font-normal text-slate-500">{req.reason}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                      {req.requestType === 'ADVANCE' ? (
                        <span className="font-bold text-emerald-600 text-sm">{req.advanceAmount || 1000} ج.م</span>
                      ) : (
                        <span>{req.startDate} {req.endDate !== req.startDate && `إلى ${req.endDate}`}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(req.finalStatus)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {req.branchNotes && (
                        <div><strong className="text-orange-600">رد الفرع:</strong> {req.branchNotes}</div>
                      )}
                      {req.hrNotes && (
                        <div><strong className="text-purple-600">رد الـ HR:</strong> {req.hrNotes}</div>
                      )}
                      {!req.branchNotes && !req.hrNotes && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة التقديم */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-white/10 dark:bg-[#121526]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRtl ? 'تقديم طلب جديد' : 'New Request'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">نوع الطلب</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="ANNUAL">إجازة سنوية اعتيادية</option>
                  <option value="PERMISSION">إذن ساعي في نفس اليوم</option>
                  <option value="ADVANCE">طلب سلفة مالية</option>
                  <option value="SICK">إجازة مرضية</option>
                  <option value="UNPAID">إجازة بدون راتب</option>
                </select>
              </div>

              {requestType === 'ADVANCE' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">مبلغ السلفة (جنيه)</label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      required
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">السداد على (شهور)</label>
                    <select
                      value={repaymentMonths}
                      onChange={(e) => setRepaymentMonths(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="1">شهر واحد</option>
                      <option value="2">شهرين</option>
                      <option value="3">3 شهور</option>
                    </select>
                  </div>
                </div>
              )}

              {requestType === 'PERMISSION' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">تاريخ الإذن</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">عدد الساعات</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      required
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {requestType !== 'PERMISSION' && requestType !== 'ADVANCE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">من تاريخ</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">إلى تاريخ</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {requestType !== 'ADVANCE' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">الموظف البديل لتغطية الشيفت</label>
                  <input
                    type="text"
                    value={substituteName}
                    onChange={(e) => setSubstituteName(e.target.value)}
                    placeholder="اسم الزميل المتفق معه"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">سبب الطلب والتفاصيل <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="وضح الأسباب لاعتماد الطلب..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
