'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function EmployeeRequestsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userId, setUserId] = useState('');
  const [, setUserRole] = useState('موظف');
  const [isManager, setIsManager] = useState(false);

  // أنواع الطلبات
  const [requestType, setRequestType] = useState<
    'LEAVE' | 'PERMISSION' | 'ADVANCE' | 'COMPLAINT' | 'STAFF_REQUEST'
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

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem('userId') || '';
    const urole = localStorage.getItem('userRole') || 'موظف';
    const permsRaw = localStorage.getItem('userPermissions') || '[]';
    const perms: string[] = JSON.parse(permsRaw);

    setUserId(uid);
    setUserRole(urole);
    setStartDate(new Date().toISOString().slice(0, 10));

    // تحديد ما إذا كان المستخدم مديراً لإتاحة خيار طلب العمالة
    const hasManagerRole =
      urole === 'SUPER_ADMIN' ||
      urole === 'مدير النظام' ||
      urole.includes('مدير') ||
      urole.includes('مشرف') ||
      perms.includes('*') ||
      perms.includes('manager');

    setIsManager(hasManagerRole);
  }, []);

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
      finalReason = `[طلب عمالة: ${staffCount} ${targetRole} لمقر: ${targetBranch}] - مبررات الطلب: ${finalReason}`;
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
          durationDays: requestType === 'STAFF_REQUEST' ? staffCount : durationDays,
          advanceAmount,
          reason: finalReason,
          targetRole: requestType === 'STAFF_REQUEST' ? targetRole : null,
          staffCount: requestType === 'STAFF_REQUEST' ? parseInt(staffCount, 10) : 1,
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
    } catch (err: unknown) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'حدث خطأ أثناء الإرسال' });
    } finally {
      setLoading(false);
    }
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
              ]
                .filter((t) => t.visible)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setRequestType(t.id as 'LEAVE' | 'PERMISSION' | 'ADVANCE' | 'COMPLAINT' | 'STAFF_REQUEST')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      requestType === t.id
                        ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white border-orange-500 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <t.icon size={15} />
                    <span>{t.label}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* في حالة طلب عمالة (للمديرين فقط) */}
          {requestType === 'STAFF_REQUEST' && (
            <div className="sm:col-span-2 bg-orange-500/5 border border-orange-500/20 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 border-b border-orange-500/10 pb-2">
                <Users2 size={16} />
                <span>بيانات احتياج العمالة المطلوب توفيرها من الـ HR:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوظيفة المطلوبة</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500"
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
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
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
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* في حالة الإذن: تحديد المدة والوقت */}
          {requestType === 'PERMISSION' && (
            <div className="sm:col-span-2 bg-slate-900/60 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
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
                        ? 'bg-orange-500 text-white border-orange-500 shadow'
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
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">إلى الساعة (اختياري):</label>
                  <input
                    type="time"
                    value={permissionToTime}
                    onChange={(e) => setPermissionToTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* تاريخ الطلب */}
          {requestType !== 'COMPLAINT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">التاريخ</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          {/* تاريخ النهاية للإجازة */}
          {requestType === 'LEAVE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">إلى تاريخ</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          {/* مبلغ السلفة */}
          {requestType === 'ADVANCE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المبلغ المطلوب (جنيه)</label>
              <input
                type="number"
                required
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="مثال: 500"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
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
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-8 py-3 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            <span>{loading ? 'جاري الإرسال...' : 'إرسال الطلب'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
