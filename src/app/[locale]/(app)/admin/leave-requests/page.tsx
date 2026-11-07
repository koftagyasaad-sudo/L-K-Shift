'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Building2,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Ban,
  DollarSign,
  FileText,
} from 'lucide-react';

interface LeaveRequestItem {
  id: number;
  userId: number;
  userName: string;
  userPhone?: string;
  branchName?: string;
  requestType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  advanceAmount: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt?: string;
}

export default function AdminLeaveRequestsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // حالة نافذة تسجيل سبب الرفض
  const [rejectingItem, setRejectingItem] = useState<LeaveRequestItem | null>(null);
  const [rejectionText, setRejectionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // جلب الطلبات من السيرفر
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leave-requests', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error loading leave requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // تنفيذ الموافقة على الطلب
  const handleApprove = async (id: number) => {
    try {
      setActionLoading(true);
      setStatusMessage(null);

      const res = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, status: 'APPROVED' }),
      });

      if (!res.ok) throw new Error('فشل اعتماد الطلب');

      setStatusMessage({ type: 'ok', text: 'تمت الموافقة على الطلب بنجاح' });
      await fetchRequests();
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err.message || 'حدث خطأ أثناء الاعتماد' });
    } finally {
      setActionLoading(false);
    }
  };

  // تنفيذ رفض الطلب مع حفظ السبب المكتوب
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionText.trim()) {
      setStatusMessage({ type: 'err', text: 'يرجى كتابة سبب الرفض ليعلم به الموظف' });
      return;
    }

    try {
      setActionLoading(true);
      setStatusMessage(null);

      const res = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: rejectingItem.id,
          status: 'REJECTED',
          rejectionReason: rejectionText.trim(),
        }),
      });

      if (!res.ok) throw new Error('فشل تسجيل الرفض');

      setStatusMessage({ type: 'ok', text: 'تم رفض الطلب وإرسال السبب لحساب الموظف' });
      setRejectingItem(null);
      setRejectionText('');
      await fetchRequests();
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err.message || 'حدث خطأ أثناء الرفض' });
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'ANNUAL':
        return 'إجازة اعتيادية';
      case 'SICK':
        return 'إجازة مرضية';
      case 'PERMISSION':
        return 'إذن ساعي';
      case 'ADVANCE':
        return 'سلفة مالية';
      default:
        return type || 'طلب إجازة';
    }
  };

  // الفلترة والبحث
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    const nameStr = (req.userName || '').toLowerCase();
    const phoneStr = (req.userPhone || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || nameStr.includes(query) || phoneStr.includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0c0e18]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              اعتماد الإجازات والطلبات والسلف
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              مراجعة طلبات العاملين بالفروع، الموافقة عليها، أو رفضها مع إبداء الأسباب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20">
            <Calendar size={14} /> إجمالي الطلبات: {requests.length}
          </span>
        </div>
      </div>

      {/* رسائل النجاح والخطأ */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold ${
            statusMessage.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
              : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
          }`}
        >
          {statusMessage.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* شريط البحث وفلاتر الحالة */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#0c0e18]">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الموظف أو رقم هاتفه..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-500" />
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/5 text-xs font-bold">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              قيد المراجعة
            </button>
            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              المعتمدة
            </button>
            <button
              onClick={() => setFilterStatus('REJECTED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              المرفوضة
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الطلبات */}
      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-400">جاري تحميل طلبات الإجازات والسلف...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-white/5 dark:bg-[#0c0e18]">
          <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-xs font-bold">لا توجد طلبات مطابقة للبحث أو الفلتر المحدد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-white/5 dark:bg-[#0c0e18]"
            >
              {/* رأس الكارت */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 dark:border-white/5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <User size={15} className="text-orange-500" /> {req.userName}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-mono" dir="ltr">
                      <Phone size={12} /> {req.userPhone || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {req.branchName || 'الفرع الرئيسي'}
                    </span>
                  </div>
                </div>

                <div>
                  {req.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                      <CheckCircle2 size={12} /> معتمد
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                      <XCircle size={12} /> مرفوض
                    </span>
                  )}
                  {req.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
                      <Clock size={12} /> قيد المراجعة
                    </span>
                  )}
                </div>
              </div>

              {/* تفاصيل الطلب */}
              <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 text-xs dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-white">نوع الطلب:</span>
                  <span className="font-black text-orange-600">{getTypeName(req.requestType)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>الفترة المحددة:</span>
                  <span className="font-mono">
                    {req.startDate} {req.endDate && req.endDate !== req.startDate ? `إلى ${req.endDate}` : ''}
                  </span>
                </div>

                {req.advanceAmount > 0 ? (
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-bold">
                    <span>مبلغ السلفة:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{req.advanceAmount} ج.م</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>عدد الأيام:</span>
                    <span className="font-mono">{req.durationDays} يوم</span>
                  </div>
                )}

                {req.reason && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">السبب المدون:</span> {req.reason}
                  </div>
                )}
              </div>

              {/* سبب الرفض إن وجد */}
              {req.status === 'REJECTED' && req.rejectionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                  <span className="font-bold block mb-0.5 flex items-center gap-1">
                    <Ban size={13} /> سبب الرفض المسجل للموظف:
                  </span>
                  <span>{req.rejectionReason}</span>
                </div>
              )}

              {/* أزرار الإجراءات للطلبات المعلقة */}
              {req.status === 'PENDING' && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> اعتماد وقبول
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      setRejectingItem(req);
                      setRejectionText('');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <XCircle size={14} /> رفض الطلب
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* نافذة كتابة سبب الرفض */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-white/10 dark:bg-slate-900 text-slate-900 dark:text-white">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Ban size={22} />
              <h3 className="font-black text-base">رفض طلب ({rejectingItem.userName})</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              اكتب سبب رفض الطلب بالتفصيل؛ سيظهر هذا التوضيح مباشرة في صفحة الموظف.
            </p>

            <textarea
              rows={3}
              required
              value={rejectionText}
              onChange={(e) => setRejectionText(e.target.value)}
              placeholder="مثال: تعارض الموعد مع جدول نوبتجيات الفرع، أو استنفاد رصيد الإجازات..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:outline-none focus:border-rose-500 resize-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                <span>تأكيد الرفض وإرسال السبب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
