'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Calendar, Clock, DollarSign, Send, CheckCircle2, 
  XCircle, AlertCircle, FileText, Loader2, ArrowRight, Ban 
} from 'lucide-react';

interface RequestsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function EmployeeRequestsPage({ params }: RequestsPageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [userId, setUserId] = useState<string>('');
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // حقول إنشاء الطلب
  const [requestType, setRequestType] = useState<'ANNUAL' | 'SICK' | 'PERMISSION' | 'ADVANCE'>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState('1');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [reason, setReason] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadRequests = async (uid: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leave-requests?userId=${uid}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequestsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedId = localStorage.getItem('userId') || '';
    setUserId(storedId);
    if (storedId) {
      loadRequests(storedId);
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setStatusMsg({ type: 'err', text: 'يرجى تسجيل الدخول أولاً' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const payload = {
        userId,
        requestType,
        startDate,
        endDate: requestType === 'PERMISSION' ? startDate : (endDate || startDate),
        durationDays: requestType === 'PERMISSION' ? 0.5 : (parseInt(durationDays, 10) || 1),
        advanceAmount: requestType === 'ADVANCE' ? (parseFloat(advanceAmount) || 0) : 0,
        reason,
      };

      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل إرسال الطلب');

      setStatusMsg({ type: 'ok', text: 'تم إرسال طلبك بنجاح وهو قيد مراجعة الإدارة الآن' });
      setReason('');
      setAdvanceAmount('');
      setStartDate('');
      setEndDate('');
      await loadRequests(userId);
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'حدث خطأ في الإرسال' });
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'ANNUAL': return 'إجازة سنوية اعتيادية';
      case 'SICK': return 'إجازة مرضية';
      case 'PERMISSION': return 'إذن تأخير / انصراف ساعي';
      case 'ADVANCE': return 'طلب سلفة مالية';
      default: return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <Calendar className="text-orange-500" /> تقديم ومتابعة الإجازات والأذونات والسلف
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          إرسال طلبات الإجازات ومتابعة حالة الاعتماد وأسباب الرفض المسجلة من المدير
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* نموذج إرسال طلب جديد */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
        <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Send size={15} className="text-orange-500" /> إرسال طلب جديد
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">نوع الطلب:</label>
            <select
              value={requestType}
              onChange={(e: any) => setRequestType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500"
            >
              <option value="ANNUAL">🌴 إجازة سنوية اعتيادية</option>
              <option value="SICK">🩺 إجازة مرضية</option>
              <option value="PERMISSION">⏱️ إذن ساعي (تأخير / انصراف مبكر)</option>
              <option value="ADVANCE">💵 طلب سلفة مالية على الراتب</option>
            </select>
          </div>

          {requestType === 'ADVANCE' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">المبلغ المطلوب (ج.م):</label>
              <input
                type="number"
                required
                min="50"
                step="50"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="مثال: 500"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">عدد الأيام:</label>
              <input
                type="number"
                required
                min="1"
                max="30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              {requestType === 'PERMISSION' ? 'تاريخ الإذن:' : 'تاريخ البداية:'}
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          {requestType !== 'PERMISSION' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">تاريخ النهاية:</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">سبب أو تفاصيل الطلب:</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب التوضيح الخاص بطلبك للمدير..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-7 py-3 text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            <span>{submitting ? 'جاري الإرسال...' : 'تأكيد وإرسال الطلب'}</span>
          </button>
        </div>
      </form>

      {/* سجل طلبات الموظف السابقة وحالة الاعتماد والرفض */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
        <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <FileText size={16} className="text-orange-500" /> سجل طلباتي ومتابعة الردود
        </h2>

        {loading ? (
          <div className="flex py-12 flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-xs text-slate-400">جاري تحميل سجل الطلبات...</span>
          </div>
        ) : requestsList.length === 0 ? (
          <p className="text-center py-10 text-xs text-slate-400">لا توجد طلبات سابقة مسجلة لك</p>
        ) : (
          <div className="space-y-4">
            {requestsList.map((req) => (
              <div
                key={req.id}
                className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-3 transition hover:border-slate-600"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/40 pb-3">
                  <div>
                    <span className="font-bold text-sm text-white">{getTypeName(req.requestType)}</span>
                    <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                      الفترة: {req.startDate} {req.endDate && req.endDate !== req.startDate ? `إلى ${req.endDate}` : ''}
                      {req.advanceAmount > 0 && ` — المبلغ: ${req.advanceAmount} ج.م`}
                    </span>
                  </div>

                  {/* شارة الحالة */}
                  <div>
                    {req.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold">
                        <CheckCircle2 size={13} /> تم الاعتماد والموافقة
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-xl text-xs font-bold">
                        <XCircle size={13} /> تم رفض الطلب
                      </span>
                    )}
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-xl text-xs font-bold">
                        <Clock size={13} /> قيد المراجعة لدى الإدارة
                      </span>
                    )}
                  </div>
                </div>

                {/* سبب الموظف */}
                {req.reason && (
                  <p className="text-xs text-slate-300">
                    <span className="text-slate-500 font-semibold">ملاحظتك:</span> {req.reason}
                  </p>
                )}

                {/* إظهار سبب الرفض الصادر من المدير في حال تم الرفض */}
                {req.status === 'REJECTED' && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <Ban size={14} /> سبب الرفض المسجل من المدير:
                    </span>
                    <p className="text-rose-200 font-medium pr-5">
                      {req.rejectionReason || 'لم يتم توضيح سبب الرفض'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
