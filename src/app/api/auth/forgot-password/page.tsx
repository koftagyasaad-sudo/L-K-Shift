'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setMsg({ type: 'ok', text: `تم إرسال الكود. كود الاختبار السريع: ${data.debugCode || ''}` });
      } else {
        setMsg({ type: 'err', text: data.message || 'فشل إرسال الكود' });
      }
    } catch {
      setMsg({ type: 'err', text: 'خطأ في الاتصال' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: 'تم تغيير كلمة المرور بنجاح! جاري تحويلك للدخول...' });
        setTimeout(() => router.push('/ar/login'), 2000);
      } else {
        setMsg({ type: 'err', text: data.message || 'الكود غير صحيح' });
      }
    } catch {
      setMsg({ type: 'err', text: 'خطأ في الاتصال' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080911]" dir="rtl">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">استعادة كلمة المرور</h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 ? 'أدخل رقم الهاتف المسجل لإرسال كود التحقق' : 'أدخل الكود وكلمة المرور الجديدة'}
          </p>
        </div>

        {msg && (
          <div
            className={`p-3.5 rounded-xl flex items-center gap-2 text-xs font-bold ${
              msg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msg.text}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">رقم الهاتف المسجل</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-mono text-left focus:outline-none focus:border-orange-500"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-3 rounded-xl text-xs font-bold shadow-lg hover:opacity-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">كود التحقق (OTP)</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="أدخل الـ 6 أرقام"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-3 rounded-xl text-xs font-bold shadow-lg hover:opacity-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري التعيين...' : 'تأكيد وتعيين كلمة المرور'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/ar/login" className="text-xs text-orange-400 hover:underline">
            العودة لصفحة تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
