'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { meetsPasswordMinimum } from '@/lib/password-policy';
import PasswordInput from '@/components/ui/PasswordInput';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  // المراحل: 1 = إرسال الـ OTP، 2 = إدخال وتأكيد الـ OTP، 3 = تعيين الباسورد الجديد
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/forgot-password', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to check SMS availability.');
        return response.json();
      })
      .then((data: { smsEnabled?: boolean }) => {
        if (active && data.smsEnabled === false) setSmsUnavailable(true);
      })
      .catch((error: unknown) => {
        console.error('Failed to check SMS availability:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  // مؤقت إعادة الإرسال
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // الخطوة 1: إرسال كود الـ OTP عبر الـ SMS
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      setStatusMsg({ type: 'err', text: 'يرجى إدخال رقم الهاتف المسجل' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_OTP', phone: phone.trim() }),
      });

      const data = await res.json();
      if (data.code === 'SMS_DISABLED') {
        setSmsUnavailable(true);
        setStatusMsg(null);
        return;
      }
      if (!res.ok) throw new Error(data.message || 'فشل إرسال كود التحقق');

      setStatusMsg({ type: 'ok', text: data.message });
      setStep(2);
      setResendCooldown(60);
    } catch (err: unknown) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الكود' });
    } finally {
      setLoading(false);
    }
  };

  // الخطوة 2: تأكيد كود الـ OTP المستلم في رسالة الـ SMS
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      setStatusMsg({ type: 'err', text: 'يرجى إدخال كود التحقق المكون من 6 أرقام المستلم على هاتفك' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY_OTP', phone: phone.trim(), otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'كود التحقق غير صحيح');

      setResetToken(data.resetToken);
      setStatusMsg({ type: 'ok', text: 'تم التحقق بنجاح! يمكنك الآن تعيين كلمة مرور قوية جديدة.' });
      setStep(3);
    } catch (err: unknown) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'كود التحقق غير صحيح' });
    } finally {
      setLoading(false);
    }
  };

  // الخطوة 3: تعيين كلمة المرور الجديدة
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'err', text: 'كلمة المرور وتأكيدها غير متطابقين!' });
      return;
    }

    if (!meetsPasswordMinimum(newPassword)) {
      setStatusMsg({
        type: 'err',
        text: 'يجب أن تتكون كلمة المرور من 6 محارف على الأقل.',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تحديث كلمة المرور');

      setStatusMsg({ type: 'ok', text: 'تم تغيير كلمة المرور بنجاح! جاري تحويلك لصفحة تسجيل الدخول...' });
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 1500);
    } catch (err: unknown) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full max-w-full items-center justify-center overflow-hidden bg-[#f6f5ff] p-4 text-[#0a0814] dark:bg-[#050309] dark:text-[#f6f0ff]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <ThemeToggle className="absolute end-4 top-4 z-20" />
      {/* هالة خلفية متدرجة */}
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-[#9d6bff]/10 blur-3xl" />

      {'\n'}
      <div className="sonomir-auth-card relative z-10 w-full max-w-md space-y-6">
        {/* اللوجو والعنوان */}
        <div className="text-center space-y-2">
          <div className="sonomir-iridescent mx-auto flex h-16 w-16 items-center justify-center rounded-2xl p-2 shadow-lg shadow-[#9d6bff]/20">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow brightness-110" />
          </div>
          <h1 className="sonomir-gradient-text text-xl font-black tracking-tight">استعادة كلمة المرور (OTP)</h1>
          <p className="text-xs text-[#433b5c] dark:text-[#c9c0e8]">
            {step === 1 && 'أدخل رقم هاتفك لاستلام رمز التحقق في رسالة نصية قصيرة'}
            {step === 2 && `أدخل كود التحقق المرسل في رسالة SMS إلى هاتفك (${phone})`}
            {step === 3 && 'قم بإنشاء كلمة مرور قوية وجديدة لحسابك'}
          </p>
        </div>

        {/* مؤشر المراحل */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s ? 'w-8 bg-orange-500' : step > s ? 'w-4 bg-emerald-500' : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
              statusMsg.type === 'ok'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {statusMsg.type === 'ok' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
            <span className="leading-relaxed">{statusMsg.text}</span>
          </div>
        )}

        {'\n'}
        {/* المرحلة 1: طلب رقم الهاتف */}
        {step === 1 && (
          smsUnavailable ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-200" role="status">
              <p className="font-bold text-amber-950 dark:text-amber-100">استعادة كلمة المرور عبر SMS غير مفعّلة حاليًا.</p>
              <p className="mt-1">
                لإعادة تعيين كلمة المرور فورًا، يرجى التواصل مع مدير الفرع أو مسؤول النظام.
              </p>
              <Link
                href={`/${locale}/login`}
                className="mt-3 inline-flex font-bold text-[#6e42bd] underline underline-offset-2 hover:text-[#9d6bff] dark:text-[#c9c0e8] dark:hover:text-[#46f4ff]"
              >
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          ) : (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم التليفون المسجل بالحساب</label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="tel"
                  autoCapitalize="none"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-[#0c0e18] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-orange-500 transition text-left"
                  dir="ltr"
                />
                <Phone size={16} className="absolute right-4 top-3.5 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sonomir-iridescent flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black text-[#050309] shadow-lg shadow-[#9d6bff]/20 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              <span>إرسال رمز التحقق OTP في رسالة SMS</span>
            </button>
          </form>
          )
        )}

        {'\n'}
        {/* المرحلة 2: إدخال كود الـ OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">كود التحقق (OTP)</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                className="w-full bg-[#0c0e18] border border-white/10 rounded-2xl px-4 py-3.5 text-center text-lg tracking-[0.5em] font-mono font-black text-orange-400 focus:outline-none focus:border-orange-500 transition"
                dir="ltr"
              />
              <span className="text-[11px] text-slate-400 block mt-1.5 text-center">
                تم إرسال الكود إلى {phone} في رسالة SMS
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sonomir-iridescent flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black text-[#050309] shadow-lg shadow-[#9d6bff]/20 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>تأكيد الكود ومتابعة</span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                تغيير رقم الهاتف
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleSendOtp()}
                className="text-orange-400 hover:underline disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>{resendCooldown > 0 ? `إعادة الإرسال بعد (${resendCooldown}ث)` : 'إعادة إرسال الكود'}</span>
              </button>
            </div>
          </form>
        )}

        {'\n'}
        {/* المرحلة 3: تعيين كلمة المرور الجديدة والقوية */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور الجديدة *</label>
              <PasswordInput
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة مرور قوية"
                autoComplete="new-password"
                dir="ltr"
                className="w-full rounded-2xl border border-violet-950/15 bg-violet-50 px-4 py-3 text-left text-xs text-[#0a0814] transition focus:border-[#9d6bff] focus:outline-none dark:border-[#c4b2ff]/15 dark:bg-[#050309] dark:text-[#f6f0ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">تأكيد كلمة المرور الجديدة *</label>
              <PasswordInput
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                autoComplete="new-password"
                dir="ltr"
                className="w-full rounded-2xl border border-violet-950/15 bg-violet-50 px-4 py-3 text-left text-xs text-[#0a0814] transition focus:border-[#9d6bff] focus:outline-none dark:border-[#c4b2ff]/15 dark:bg-[#050309] dark:text-[#f6f0ff]"
              />
            </div>

            {/* الحد الأدنى لطول كلمة المرور */}
            <div className="space-y-1 rounded-2xl border border-violet-950/10 bg-violet-50 p-3 text-[11px] dark:border-[#c4b2ff]/10 dark:bg-[#050309]">
              <span className="mb-1 block font-bold text-[#433b5c] dark:text-[#c9c0e8]">الحد الأدنى لطول كلمة المرور:</span>
              <p className={meetsPasswordMinimum(newPassword) ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                ✓ 6 محارف على الأقل
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
              <span>تحديث وتأكيد كلمة المرور الآن</span>
            </button>
          </form>
        )}

        {'\n'}
        {/* العودة لتسجيل الدخول */}
        <div className="border-t border-violet-950/10 pt-2 text-center dark:border-[#c4b2ff]/10">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#433b5c] transition hover:text-[#0a0814] dark:text-[#c9c0e8] dark:hover:text-[#f6f0ff]"
          >
            <ArrowRight size={13} />
            <span>العودة إلى صفحة تسجيل الدخول</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
