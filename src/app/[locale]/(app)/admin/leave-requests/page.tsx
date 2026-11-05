'use client';

import React, { useState, useEffect, use } from 'react';

interface RequestItem {
  id: number;
  userId: string;
  userName: string;
  userPhone: string;
  branchName: string;
  requestType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationHours: number;
  substituteName: string;
  reason: string;
  branchStatus: string;
  branchNotes?: string;
  hrStatus: string;
  hrNotes?: string;
  finalStatus: string;
  createdAt: string;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminLeaveRequestsReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('مدير النظام');

  // نافذة اتخاذ القرار
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/leave-requests', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'مدير النظام';
    setUserRole(role);
    fetchRequests();
  }, []);

  const isHrOrSuper = userRole === 'مدير النظام' || userRole === 'SUPER_ADMIN' || userRole.includes('HR');

  const openDecisionModal = (req: RequestItem, decision: 'APPROVE' | 'REJECT') => {
    setSelectedReq(req);
    setDecisionType(decision);
    setDecisionNotes('');
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (decisionType === 'REJECT' && !decisionNotes.trim()) {
      alert(isRtl ? 'يجب إدخال سبب الرفض لتوضيحه للموظف' : 'Rejection reason is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const actionBy = isHrOrSuper && selectedReq.branchStatus === 'APPROVED' ? 'HR_ADMIN' : 'BRANCH_MANAGER';
      const reviewer = localStorage.getItem('userName') || userRole;

      const res = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedReq.id,
          actionBy,
          decision: decisionType,
          notes: decisionNotes.trim(),
          reviewerName: reviewer,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل اتخاذ الإجراء');

      alert(resData.message);
      setSelectedReq(null);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ القرار');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          {isRtl ? 'اعتماد ومراجعة الإجازات والأذونات' : 'Leave & Permission Approvals'}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {isRtl
            ? 'نظام الاعتماد المزدوج: موافقة مدير الفرع أولاً للتشغيل ➜ ثم موافقة الـ HR للاعتماد والخصم'
            : 'Two-stage approval workflow: Branch Manager (operations) ➜ HR Admin (policy & quota)'}
        </p>
      </div>

      {/* جدول الطلبات بانتظار الاعتماد */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            {isRtl ? 'لا توجد طلبات واردة حالياً' : 'No pending requests'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الموظف والفرع' : 'Employee & Branch'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'نوع الطلب والتاريخ' : 'Type & Period'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'البديل والسبب' : 'Cover & Reason'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'المرحلة الحالية' : 'Stage'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {requests.map((req) => (
                  <tr key={req.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div>{req.userName}</div>
                      <div className="text-xs font-mono font-normal text-slate-500">{req.userPhone} | {req.branchName}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-bold text-orange-600">
                        {req.requestType === 'ANNUAL' && 'إجازة سنوية'}
                        {req.requestType === 'PERMISSION' && `إذن ساعي (${req.durationHours} س)`}
                        {req.requestType === 'SICK' && 'إجازة مرضية'}
                        {req.requestType === 'UNPAID' && 'بدون راتب'}
                      </span>
                      <div className="font-mono text-slate-600 dark:text-slate-400">{req.startDate} {req.endDate !== req.startDate && `إلى ${req.endDate}`}</div>
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs">
                      <div><strong>البديل:</strong> {req.substituteName || '—'}</div>
                      <div className="text-slate-500 truncate mt-0.5">{req.reason}</div>
                    </td>
                    <td className="px-6 py-4">
                      {req.finalStatus === 'PENDING_BRANCH' && (
                        <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                          بانتظار موافقة مدير الفرع
                        </span>
                      )}
                      {req.finalStatus === 'PENDING_HR' && (
                        <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600">
                          وافق الفرع ➜ بانتظار الـ HR
                        </span>
                      )}
                      {req.finalStatus === 'APPROVED' && (
                        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                          ✓ معتمد نهائياً ومخصوم
                        </span>
                      )}
                      {req.finalStatus === 'REJECTED_BRANCH' && (
                        <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600">
                          ✕ مرفوض من الفرع
                        </span>
                      )}
                      {req.finalStatus === 'REJECTED_HR' && (
                        <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600">
                          ✕ مرفوض من الـ HR
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.finalStatus === 'PENDING_BRANCH' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, 'APPROVE')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            موافقة الفرع
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, 'REJECT')}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      )}

                      {req.finalStatus === 'PENDING_HR' && isHrOrSuper && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, 'APPROVE')}
                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 cursor-pointer"
                          >
                            اعتماد نهائي (HR)
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(req, 'REJECT')}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      )}

                      {(req.finalStatus === 'APPROVED' || req.finalStatus.includes('REJECTED')) && (
                        <span className="text-xs text-slate-400 font-medium">تم الحسم</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة اتخاذ القرار والملاحظات */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-white/10 dark:bg-[#121526]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {decisionType === 'APPROVE' ? 'تأكيد الموافقة على الطلب' : 'تأكيد رفض الطلب'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              طلب الموظف: <strong>{selectedReq.userName}</strong> ({selectedReq.requestType})
            </p>

            <form onSubmit={handleExecuteDecision} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {decisionType === 'REJECT' ? 'سبب الرفض (إلزامي للموظف)' : 'ملاحظات وتوجيهات (اختياري)'}
                </label>
                <textarea
                  required={decisionType === 'REJECT'}
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={decisionType === 'REJECT' ? 'اكتب سبب الرفض لتوضيحه في إشعار الموظف...' : 'أي ملاحظات تشغيلية...'}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                    decisionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? 'جاري الحفظ...' : decisionType === 'APPROVE' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
