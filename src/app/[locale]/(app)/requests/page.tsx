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
  ShieldAlert,
  FileText,
} from 'lucide-react';

export default function EmployeeRequestsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('موظف');

  const [requestType, setRequestType] = useState<'LEAVE' | 'PERMISSION' | 'ADVANCE' | 'COMPLAINT'>('LEAVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState('1');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    const uid = localStorage.getItem('userId') || '';
    const uname = localStorage.getItem('userName') || '';
    const urole = localStorage.getItem('userRole') || 'موظف';
    setUserId(uid);
    setUserName(uname);
    setUserRole(urole);

    if (uid) fetchMyRequests(uid, urole);
  }, []);

  const fetchMyRequests = async (uid: string, urole: string) => {
    try {
      const res = await fetch(`/api/requests?userId=${uid}&role=${urole}`);
      if (res.ok) {
        const data = await res.json();
        setMyRequests(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requestType,
          startDate,
          endDate: requestType === 'LEAVE' ? endDate : startDate,
          durationDays,
          advanceAmount,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إرسال الطلب');

      setStatusMsg({
        type: 'ok',
        text: requestType === 'COMPLAINT'
          ? 'تم إرسال شكواك السرية بنجاح إلى إدارة الموارد البشرية ومدير النظام فقط.'
          : 'تم إرسال طلبك بنجاح، ووصل إشعار للمسؤولين لمراجعته.',
      });

      setReason('');
      setAdvanceAmount('');
      fetchMyRequests(userId, userRole);
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'حدث خطأ أثناء الإرسال' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white">تقديم الطلبات والشكاوى السرية</h1>
        <p className="text-xs text-slate-400 mt-1">
          تقديم الإجازات، الأذونات، طلبات السلف المالية، أو تقديم شكاوى سرية مشفرة لإدارة الـ HR
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

      {/* نموذج التقديم */}
      <form onSubmit={handleSubmit} className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الطلب</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'LEAVE', label: 'طلب إجازة', icon: Calendar },
                { id: 'PERMISSION', label: 'إذن تأخير/مغادرة', icon: Clock },
                { id: 'ADVANCE', label: 'سلفة مالية', icon: DollarSign },
                { id: 'COMPLAINT', label: 'شكوى سرية (HR)', icon: ShieldAlert },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRequestType(t.id as any)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    requestType === t.id
                      ? t.id === 'COMPLAINT'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-gradient-to-r from-orange-500 to-rose-600 text-white border-orange-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <t.icon size={15} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {requestType === 'COMPLAINT' && (
            <div className="sm:col-span-2 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold leading-relaxed flex items-center gap-2">
              <ShieldAlert size={18} className="shrink-0" />
              <span>
                تنبيه سرية: هذه الشكوى لن تظهر لمدير الفرع أو زملائك، وتصل مشفرة مباشرة لمدير النظام ومسؤول الموارد البشرية (HR) فقط.
              </span>
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
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
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
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
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
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {requestType === 'COMPLAINT' ? 'تفاصيل الشكوى والواقعة بالتفصيل' : 'سبب الطلب والتفاصيل'}
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={requestType === 'COMPLAINT' ? 'اكتب شكواك بكل حرية وأمان...' : 'اكتب الأسباب هنا...'}
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
