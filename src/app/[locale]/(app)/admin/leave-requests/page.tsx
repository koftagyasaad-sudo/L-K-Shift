'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Building2,
  User,
  Timer,
  X,
  Send,
  Users2,
} from 'lucide-react';

interface RequestItem {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  branchName: string;
  requestType: 'LEAVE' | 'PERMISSION' | 'ADVANCE' | 'COMPLAINT' | 'STAFF_REQUEST';
  startDate: string;
  endDate: string;
  durationDays: number;
  advanceAmount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export default function LeaveApprovalsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [rejectModalReq, setRejectModalReq] = useState<RequestItem | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [statusAlert, setStatusAlert] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req: RequestItem) => {
    setProcessingId(req.id);
    setStatusAlert(null);
    const adminId = localStorage.getItem('userId') || '';

    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: req.id,
          status: 'APPROVED',
          adminId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل اعتماد الطلب');

      setStatusAlert({ type: 'ok', text: `تم قبول واعتماد طلب (${req.userName}) بنجاح!` });
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'APPROVED' } : r))
      );
    } catch (err: any) {
      setStatusAlert({ type: 'err', text: err.message || 'حدث خطأ أثناء الاعتماد' });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (req: RequestItem) => {
    setRejectModalReq(req);
    setRejectionReasonText('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReq) return;

    setProcessingId(rejectModalReq.id);
    setStatusAlert(null);
    const adminId = localStorage.getItem('userId') || '';

    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: rejectModalReq.id,
          status: 'REJECTED',
          rejectionReason: rejectionReasonText.trim(),
          adminId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل رفض الطلب');

      setStatusAlert({ type: 'ok', text: `تم رفض طلب (${rejectModalReq.userName}) وإشعاره بالسبب!` });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectModalReq.id
            ? { ...r, status: 'REJECTED', rejectionReason: rejectionReasonText.trim() }
            : r
        )
      );
      setRejectModalReq(null);
    } catch (err: any) {
      setStatusAlert({ type: 'err', text: err.message || 'حدث خطأ أثناء رفض الطلب' });
    } finally {
      setProcessingId(null);
    }
  };

  const getBadgeType = (type: string) => {
    switch (type) {
      case 'LEAVE':
        return { label: 'طلب إجازة', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'PERMISSION':
        return { label: 'إذن تأخير/مغادرة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'ADVANCE':
        return { label: 'سلفة مالية', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'COMPLAINT':
        return { label: 'شكوى', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'STAFF_REQUEST':
        return { label: 'طلب عمالة', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      default:
        return { label: 'طلب عام', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchType = typeFilter === 'ALL' || r.requestType === typeFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.userName.toLowerCase().includes(q) ||
      r.branchName.toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6 pb-16 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">اعتماد الإجازات والطلبات والسلف</h1>
          <p className="text-xs text-slate-400 mt-1">
            مراجعة طلبات الموظفين وطلبات العمالة والبت فيها بالقبول أو الرفض الفوري
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {statusAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold ${
            statusAlert.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {statusAlert.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusAlert.text}</span>
        </div>
      )}

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0c0e18] border border-white/5 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 block">إجمالي الطلبات</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{requests.length}</span>
        </div>
        <div className="bg-[#0c0e18] border border-amber-500/20 p-5 rounded-2xl bg-amber-500/5">
          <span className="text-xs text-amber-400 font-bold block">بانتظار القرار</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{pendingCount}</span>
        </div>
        <div className="bg-[#0c0e18] border border-emerald-500/20 p-5 rounded-2xl bg-emerald-500/5">
          <span className="text-xs text-emerald-400 font-bold block">معتمدة ومقبولة</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{approvedCount}</span>
        </div>
        <div className="bg-[#0c0e18] border border-rose-500/20 p-5 rounded-2xl bg-rose-500/5">
          <span className="text-xs text-rose-400 font-bold block">مرفوضة</span>
          <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">{rejectedCount}</span>
        </div>
      </div>

      {/* التبويبات والفلاتر */}
      <div className="bg-[#0c0e18] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'LEAVE', label: 'إجازات' },
            { id: 'PERMISSION', label: 'أذونات' },
            { id: 'ADVANCE', label: 'سلف مالية' },
            { id: 'STAFF_REQUEST', label: 'طلبات عمالة' },
            { id: 'COMPLAINT', label: 'شكاوى' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === t.id
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="PENDING">قيد الانتظار</option>
            <option value="APPROVED">معتمد ومقبول</option>
            <option value="REJECTED">مرفوض</option>
          </select>

          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو السبب..."
              className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-xs pl-8 focus:outline-none focus:border-orange-500"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* جدول الطلبات */}
      {loading ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 bg-[#0c0e18] border border-white/5 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-400">جاري تحميل الطلبات...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-[#0c0e18] border border-white/5 rounded-3xl p-16 text-center text-slate-400">
          <Calendar size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-xs font-bold">لا توجد طلبات مسجلة مطابقة للبحث والفلاتر</p>
        </div>
      ) : (
        <div className="bg-[#0c0e18] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="p-4">الموظف / المدير</th>
                  <th className="p-4">نوع الطلب</th>
                  <th className="p-4">تفاصيل المدة / العدد</th>
                  <th className="p-4">السبب والمبررات</th>
                  <th className="p-4 text-center">التاريخ</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center min-w-[200px]">القرار والإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredRequests.map((req) => {
                  const bType = getBadgeType(req.requestType);
                  const isProcessing = processingId === req.id;

                  return (
                    <tr key={req.id} className="hover:bg-white/5 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{req.userName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 size={11} className="text-orange-500" /> {req.branchName}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-bold ${bType.color}`}>
                          {bType.label}
                        </span>
                      </td>

                      <td className="p-4">
                        {req.requestType === 'STAFF_REQUEST' ? (
                          <span className="font-bold text-purple-400 flex items-center gap-1">
                            <Users2 size={13} /> عدد: {req.durationDays} أفراد
                          </span>
                        ) : req.requestType === 'ADVANCE' ? (
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {req.advanceAmount} ج.م
                          </span>
                        ) : req.requestType === 'LEAVE' ? (
                          <span className="font-semibold text-slate-200">
                            {req.durationDays} يوم ({req.startDate} إلى {req.endDate})
                          </span>
                        ) : req.requestType === 'PERMISSION' ? (
                          <span className="font-semibold text-amber-300 flex items-center gap-1">
                            <Timer size={13} /> {req.startDate}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-4 max-w-xs">
                        <p className="text-slate-300 leading-relaxed line-clamp-2" title={req.reason}>
                          {req.reason}
                        </p>
                        {req.rejectionReason && (
                          <p className="text-[11px] text-rose-400 mt-1">
                            <strong>سبب الرفض:</strong> {req.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="p-4 text-center font-mono text-slate-400">
                        {req.createdAt ? String(req.createdAt).slice(0, 10) : '—'}
                      </td>

                      <td className="p-4 text-center">
                        {req.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={11} /> قيد المراجعة
                          </span>
                        ) : req.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> معتمد ومقبول
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle size={11} /> مرفوض
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(req)}
                              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                              title="قبول واعتماد"
                            >
                              {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                              <span>قبول</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => openRejectModal(req)}
                              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
                              title="رفض الطلب"
                            >
                              <XCircle size={13} />
                              <span>رفض</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => (req.status === 'APPROVED' ? openRejectModal(req) : handleApprove(req))}
                              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                            >
                              تعديل القرار
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة سبب الرفض */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0c0e18] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle size={18} className="text-rose-500" />
                <span>رفض طلب ({rejectModalReq.userName})</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  سبب الرفض (سيصل كإشعار مباشر للمرسل):
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder="مثال: لا يوجد شواغر حالياً، أو استنفاد رصيد الإجازات..."
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {processingId ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>تأكيد الرفض وإرسال الإشعار</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
