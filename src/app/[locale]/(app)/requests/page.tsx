'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  DollarSign,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Timer,
  Users2,
  FileText,
  XCircle,
  RefreshCw,
  X,
  Eye,
} from 'lucide-react';

interface MyRequestItem {
  id: number | string;
  userId: number | string;
  userName: string;
  branchName: string;
  requestType: 'LEAVE' | 'PERMISSION' | 'ADVANCE' | 'COMPLAINT' | 'STAFF_REQUEST' | 'PENALTY' | string;
  startDate: string;
  endDate: string;
  durationDays: number;
  advanceAmount: number;
  deductionAmount?: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string;
  createdAt: string;
}

export default function EmployeeRequestsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userId, setUserId] = useState('');
  const [, setUserRole] = useState('موظف');
  const [isManager, setIsManager] = useState(false);

  // أنواع الطلبات
  const [requestType, setRequestType] = useState<
    'LEAVE' | 'PERMISSION' | 'ADVANCE' | 'COMPLAINT' | 'STAFF_REQUEST' | 'PENALTY'
  >('LEAVE');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays] = useState('1');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [reason, setReason] = useState('');

  // تفاصيل الإذن الزمني
  const [permissionDuration, setPermissionDuration] = useState('ساعة واحدة');
  const [permissionFromTime, setPermissionFromTime] = useState('');
  const [permissionToTime, setPermissionToTime] = useState('');

  // تفاصيل طلب العمالة (خاص بالمديرين)
  const [targetRole, setTargetRole] = useState('عضو مطبخ');
  const [staffCount, setStaffCount] = useState('1');
  const [targetBranch, setTargetBranch] = useState('فرع العمل الحالي');
  const [employeesList, setEmployeesList] = useState<Array<{ id: string; fullNameAr?: string; name?: string; branchName?: string }>>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [penaltyCategory, setPenaltyCategory] = useState('DEDUCTION_DAYS');
  const [penaltyDays, setPenaltyDays] = useState('1');
  const [penaltyAmount, setPenaltyAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // سجل طلبات الموظف السابقة + نافذة عرض التفاصيل وسبب القبول/الرفض
  const [myRequests, setMyRequests] = useState<MyRequestItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MyRequestItem | null>(null);

  const fetchMyRequests = useCallback(async (uid: string) => {
    setLoadingHistory(true);
    try {
      const url = uid ? `/api/requests?userId=${encodeURIComponent(uid)}` : '/api/requests';
      const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMyRequests(data);
        }
      }
    } catch {
      // ignore offline fetch error
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('userId') || '';
    const urole = localStorage.getItem('userRole') || 'موظف';
    const permsRaw = localStorage.getItem('userPermissions') || '[]';
    let perms: string[] = [];
    try { perms = JSON.parse(permsRaw); } catch {}

    setUserId(uid);
    setUserRole(urole);
    setStartDate(new Date().toISOString().slice(0, 10));

    const hasManagerRole =
      urole === 'SUPER_ADMIN' ||
      urole === 'مدير النظام' ||
      urole.includes('مدير') ||
      urole.includes('مشرف') ||
      perms.includes('*') ||
      perms.includes('manager');

    setIsManager(hasManagerRole);
    const urlType = new URLSearchParams(window.location.search).get('type');
    if (urlType === 'PENALTY' && hasManagerRole) setRequestType('PENALTY');
    if (hasManagerRole) {
      fetch('/api/employees', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => { if (Array.isArray(list)) setEmployeesList(list); })
        .catch(() => {});
    }

    void fetchMyRequests(uid);
  }, [fetchMyRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setLoading(true);

    let finalReason = reason.trim();
    if (requestType === 'PERMISSION') {
      const timeDetails =
        permissionFromTime && permissionToTime
          ? `(من الساعة ${permissionFromTime} إلى الساعة ${permissionToTime})`
          : '';
      finalReason = `[مدة الإذن: ${permissionDuration} ${timeDetails}] - السبب: ${finalReason}`;
    } else if (requestType === 'STAFF_REQUEST') {
      finalReason = `[طلب عمالة: ${staffCount} ${targetRole} لمقر: ${targetBranch}] - مبررات الطلب:${finalReason}`;
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requestType,
          startDate,
          endDate: requestType === 'LEAVE' ? endDate : startDate,
          advanceAmount,
          reason: finalReason,
          targetRole: requestType === 'STAFF_REQUEST' ? targetRole : null,
          staffCount: requestType === 'STAFF_REQUEST' ? parseInt(staffCount, 10) : 1,
          targetUserId: requestType === 'PENALTY' ? targetUserId : null,
          penaltyCategory: requestType === 'PENALTY' ? penaltyCategory : null,
          durationDays: requestType === 'PENALTY' ? penaltyDays : (requestType === 'STAFF_REQUEST' ? staffCount : durationDays),
          deductionAmount: requestType === 'PENALTY' ? penaltyAmount : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إرسال الطلب');

      setStatusMsg({
        type: 'ok',
        text:
          requestType === 'STAFF_REQUEST'
            ? `تم إرسال طلب العمالة (${staffCount} ${targetRole}) بنجاح إلى مدير النظام وإدارة الموارد البشرية (HR).`
            : requestType === 'COMPLAINT'
            ? 'تم إرسال الشكوى بنجاح إلى الإدارة المختصة.'
            : requestType === 'PERMISSION'
            ? `تم إرسال طلب إذن (${permissionDuration}) بنجاح للمراجعة والاعتماد.`
            : 'تم إرسال طلبك بنجاح، ووصل إشعار للمسؤولين لمراجعته.',
      });

      setReason('');
      setAdvanceAmount('');
      void fetchMyRequests(userId);
    } catch (err: unknown) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'حدث خطأ أثناء الإرسال' });
    } finally {
      setLoading(false);
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'LEAVE':
        return { label: 'طلب إجازة', badge: 'bg-sky-500/15 text-[#57cef8] border-[#57cef8]/30' };
      case 'PERMISSION':
        return { label: 'إذن تأخير / مغادرة', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'ADVANCE':
        return { label: 'سلفة مالية', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'COMPLAINT':
        return { label: 'شكوى إدارية', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      case 'STAFF_REQUEST':
        return { label: 'طلب احتياج عمالة', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'PENALTY':
        return { label: 'جزاء / خصم إداري', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
      default:
        return { label: 'طلب إداري', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
    }
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || 'PENDING').toUpperCase();
    if (s === 'APPROVED') {
      return {
        label: 'تم القبول والاعتماد',
        cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
      };
    }
    if (s === 'REJECTED') {
      return {
        label: 'مرفوض (اضغط لعرض السبب)',
        cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: XCircle,
      };
    }
    return {
      label: 'قيد المراجعة',
      cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: Clock,
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white">تقديم الطلبات والشكاوى</h1>
        <p className="text-xs text-slate-400 mt-1">
          تقديم الإجازات، أذونات التأخير والمغادرة، طلبات السلف، أو طلبات احتياج العمالة للمديرين
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

      <form onSubmit={handleSubmit} className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* اختيار نوع الطلب */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الطلب</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: 'LEAVE', label: 'طلب إجازة', icon: Calendar, visible: true },
                { id: 'PERMISSION', label: 'إذن تأخير/مغادرة', icon: Clock, visible: true },
                { id: 'ADVANCE', label: 'سلفة مالية', icon: DollarSign, visible: true },
                { id: 'COMPLAINT', label: 'شكوى', icon: MessageSquare, visible: true },
                { id: 'STAFF_REQUEST', label: 'طلب عمالة', icon: Users2, visible: isManager },
                { id: 'PENALTY', label: 'جزاء / خصم', icon: AlertCircle, visible: isManager },
              ]
                .filter((t) => t.visible)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setRequestType(t.id as 'LEAVE' | 'PERMISSION' | 'ADVANCE' | 'COMPLAINT' | 'STAFF_REQUEST' | 'PENALTY')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      requestType === t.id
                        ? 'bg-[#57cef8] text-[#181d23] border-[#57cef8] shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <t.icon size={15} />
                    <span>{t.label}</span>
                  </button>
                ))}
            </div>
          </div>

          {requestType === 'PENALTY' && (
            <div className="sm:col-span-2 bg-rose-500/5 border border-rose-500/25 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 border-b border-rose-500/15 pb-2">
                <AlertCircle size={16} />
                <span>إرسال جزاء أو خصم إداري إلى HR ومدير النظام (يُضاف تلقائياً لشيت القبض بعد الاعتماد):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الموظف المستهدف</label>
                  <select
                    required
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-rose-500"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullNameAr || emp.name} {emp.branchName ? `(${emp.branchName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الجزاء /الخصم</label>
                  <select
                    value={penaltyCategory}
                    onChange={(e) => setPenaltyCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-rose-500"
                  >
                    <option value="DEDUCTION_DAYS">خصم أيام من الراتب</option>
                    <option value="DEDUCTION_AMOUNT">خصم مبلغ مالي ثابت (ج.م)</option>
                    <option value="LATE_PENALTY">جزاء تأخير / عدم التزام بالمواعيد</option>
                    <option value="POLICY_PENALTY">جزاء مخالفة لائحة العمل / سلوك</option>
                    <option value="DAMAGE_DEDUCTION">خصم تلفيات / عجز عهدة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">عدد أيام الخصم (إن وُجد)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={penaltyDays}
                    onChange={(e) => setPenaltyDays(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">أو مبلغ خصم محدد بالجنيه (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="اتركه فارغاً للحساب التلقائي بالأيام"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {requestType === 'STAFF_REQUEST' && (
            <div className="sm:col-span-2 bg-[#57cef8]/5 border border-[#57cef8]/20 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#57cef8] border-b border-[#57cef8]/10 pb-2">
                <Users2 size={16} />
                <span>بيانات احتياج العمالة المطلوب توفيرها من الـ HR:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوظيفة المطلوبة</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#57cef8]"
                  >
                    <option value="عضو مطبخ">عضو مطبخ</option>
                    <option value="شيف / طاهي">شيف / طاهي</option>
                    <option value="كابتن صالة وويتر">كابتن صالة وويتر</option>
                    <option value="كاشير">كاشير</option>
                    <option value="كول سنتر">كول سنتر</option>
                    <option value="دليفري / طيار">دليفري / طيار</option>
                    <option value="مشرف وردية">مشرف وردية</option>
                    <option value="عامل نظافة وخدمات">عامل نظافة وخدمات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">العدد المطلوب</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={staffCount}
                    onChange={(e) => setStaffCount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#57cef8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">فرع / مكان الاحتياج</label>
                  <input
                    type="text"
                    required
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    placeholder="مثال: فرع دسوق / كفر الشيخ"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#57cef8]"
                  />
                </div>
              </div>
            </div>
          )}

          {requestType === 'PERMISSION' && (
            <div className="sm:col-span-2 bg-slate-900/60 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#57cef8]">
                <Timer size={16} />
                <span>تحديد وقت ومدة الإذن بدقة:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['30 دقيقة (نصف ساعة)', 'ساعة واحدة', 'ساعتان', '3 ساعات'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setPermissionDuration(dur)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      permissionDuration === dur
                        ? 'bg-[#57cef8] text-[#181d23] border-[#57cef8] shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">من الساعة (اختياري):</label>
                  <input
                    type="time"
                    value={permissionFromTime}
                    onChange={(e) => setPermissionFromTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#57cef8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">إلى الساعة(اختياري):</label>
                  <input
                    type="time"
                    value={permissionToTime}
                    onChange={(e) => setPermissionToTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#57cef8]"
                  />
                </div>
              </div>
            </div>
          )}

          {requestType !== 'COMPLAINT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">التاريخ</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#57cef8]"
              />
            </div>
          )}

          {requestType === 'LEAVE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">إلى تاريخ</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#57cef8]"
              />
            </div>
          )}

          {requestType === 'ADVANCE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المبلغ المطلوب (جنيه)</label>
              <input
                type="number"
                required
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="مثال: 500"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#57cef8] font-mono"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {requestType === 'STAFF_REQUEST'
                ? 'أسباب ومبررات طلب العمالة والوردية المستهدفة'
                : requestType === 'COMPLAINT'
                ? 'تفاصيل الشكوى'
                : 'سبب الطلب والتفاصيل'}
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب التفاصيل هنا..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#57cef8] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#57cef8] hover:opacity-95 text-[#181d23] px-8 py-3 rounded-xl text-xs font-extrabold shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            <span>{loading ? 'جاري الإرسال...' : 'إرسال الطلب'}</span>
          </button>
        </div>
      </form>

      {/* قسم سجل طلباتي السابقة التفاعلي */}
      <div className="bg-[#0c0e18] border border-white/5 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#57cef8]" />
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              سجل طلباتي السابقة ({myRequests.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void fetchMyRequests(userId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw size={13} className={loadingHistory ? 'animate-spin text-[#57cef8]' : ''} />
            <span>تحديث السجل</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          اضغط على أي طلب لعرض كافة تفاصيله ومعرفة حالة اعتماده (مقبول / مرفوض) وسبب القبول أو الرفض من الإدارة.
        </p>

        {loadingHistory ? (
          <div className="py-8 text-center text-xs text-slate-400">جاري تحميل سجل طلباتك...</div>
        ) : myRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            لم تقم بتقديم أي طلبات سابقة حتى الآن.
          </div>
        ) : (
          <div className="space-y-2.5">
            {myRequests.map((req) => {
              const typeMeta = getTypeInfo(req.requestType);
              const statusMeta = getStatusBadge(req.status);
              const StatusIcon = statusMeta.icon;
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setSelectedRequest(req)}
                  className="w-full text-right rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold ${typeMeta.badge}`}>
                        {typeMeta.label}
                      </span>
                      {req.startDate && (
                        <span className="text-[11px] font-mono text-slate-400">
                          بتاريخ: {req.startDate}
                          {req.endDate && req.endDate !== req.startDate ? ` إلى ${req.endDate}` : ''}
                        </span>
                      )}
                      {Number(req.advanceAmount) > 0 && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          ({Number(req.advanceAmount).toLocaleString()} ج.م)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 truncate">{req.reason || 'بدون ملاحظات إضافية'}</p>
                    {String(req.status).toUpperCase() === 'REJECTED' && req.rejectionReason && (
                      <div className="text-[11px] font-bold text-rose-400 truncate">
                        سبب الرفض: {req.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-extrabold ${statusMeta.cls}`}>
                      <StatusIcon size={14} />
                      <span>{statusMeta.label}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      <Eye size={13} className="text-[#57cef8]" />
                      <span>التفاصيل</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* نافذة تفاصيل الطلب المنبثقة (تظهر عند الضغط على أي طلب) */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#181d23] p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#57cef8]" />
                <h3 className="text-sm font-extrabold">تفاصيل الطلب وحالة المراجعة</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {(() => {
              const tMeta = getTypeInfo(selectedRequest.requestType);
              const sMeta = getStatusBadge(selectedRequest.status);
              const SIcon = sMeta.icon;
              const isRejected = String(selectedRequest.status).toUpperCase() === 'REJECTED';
              const isApproved = String(selectedRequest.status).toUpperCase() === 'APPROVED';

              return (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-[#232a32] p-3 border border-white/5">
                    <span className="text-slate-400">نوع الطلب:</span>
                    <span className={`rounded-lg border px-2.5 py-0.5 font-extrabold ${tMeta.badge}`}>
                      {tMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[#232a32] p-3 border border-white/5">
                    <span className="text-slate-400">حالة الطلب:</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-extrabold ${sMeta.cls}`}>
                      <SIcon size={14} />
                      <span>
                        {isApproved ? 'مقبول ومعتمد' : isRejected ? 'مرفوض' : 'قيد المراجعة لدى الإدارة'}
                      </span>
                    </span>
                  </div>

                  {selectedRequest.startDate && (
                    <div className="flex items-center justify-between rounded-xl bg-[#232a32] p-3 border border-white/5">
                      <span className="text-slate-400">تاريخ الطلب / الفترة:</span>
                      <span className="font-mono font-bold text-white">
                        {selectedRequest.startDate}
                        {selectedRequest.endDate && selectedRequest.endDate !== selectedRequest.startDate
                          ? ` إلى ${selectedRequest.endDate}`
                          : ''}
                      </span>
                    </div>
                  )}

                  {Number(selectedRequest.advanceAmount) > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-[#232a32] p-3 border border-white/5">
                      <span className="text-slate-400">المبلغ المالي:</span>
                      <span className="font-mono font-extrabold text-emerald-400">
                        {Number(selectedRequest.advanceAmount).toLocaleString()} ج.م
                      </span>
                    </div>
                  )}

                  <div className="rounded-xl bg-[#232a32] p-3.5 border border-white/5 space-y-1.5">
                    <div className="text-slate-400 font-bold">تفاصيل وسبب الطلب المرسل منك:</div>
                    <div className="text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.reason || 'لا توجد تفاصيل إضافية'}
                    </div>
                  </div>

                  {isRejected && (
                    <div className="rounded-xl bg-rose-500/15 border-2 border-rose-500/50 p-3.5 space-y-1">
                      <div className="text-rose-400 font-extrabold flex items-center gap-1.5">
                        <XCircle size={15} />
                        <span>سبب رفض الطلب من الإدارة:</span>
                      </div>
                      <div className="text-rose-200 font-bold leading-relaxed">
                        {selectedRequest.rejectionReason && selectedRequest.rejectionReason.trim() !== ''
                          ? selectedRequest.rejectionReason
                          : 'تم رفض الطلب من قِبل الإدارة (لم يُذكر سبب إضافي).'}
                      </div>
                    </div>
                  )}

                  {isApproved && (
                    <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3.5 text-emerald-300 font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                      <span>تمت الموافقة على هذا الطلب واعتماده رسمياً في السجلات.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl bg-[#57cef8] px-6 py-2 text-xs font-extrabold text-[#181d23] cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
