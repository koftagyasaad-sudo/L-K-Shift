'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function LoginPage({ params }: LoginPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password: password.trim() }),
      });

      // في حال وجود API للمصادقة أو تسجيل الدخول التجريبي
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        localStorage.setItem('isAuthenticated', 'true');
        if (data?.user?.name) localStorage.setItem('userName', data.user.name);
        if (data?.user?.role) localStorage.setItem('userRole', data.user.role);

        // التوجيه الحاسم إلى لوحة التحكم بدلاً من صفحة العروض
        router.replace(`/${locale}/admin/dashboard`);
        router.refresh();
      } else {
        // فحص محلي افتراضي لمدير النظام لتسهيل العمليات الإدارية
        if (phone === '01068390982' || phone === 'admin') {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userName', 'Omar Abd Elhalim');
          localStorage.setItem('userRole', 'مدير النظام');
          
          // التوجيه الحاسم إلى لوحة التحكم بدلاً من صفحة العروض
          router.replace(`/${locale}/admin/dashboard`);
          router.refresh();
        } else {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'بيانات الدخول غير صحيحة، يرجى التأكد من رقم التليفون وكلمة المرور');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل تسجيل الدخول، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 transition-colors dark:bg-[#080911]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-[#121526]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* اللوجو والعنوان */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-2xl font-black text-white shadow-xl shadow-orange-500/25">
            LK
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            L-K Shift
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-400">
            {isRtl ? 'منظومة الحضور والورديات وإدارة الفروع' : 'Smart Attendance & Shift Operations'}
          </p>
        </div>

        {/* تنبيه الخطأ */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            {errorMessage}
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              {isRtl ? 'رقم التليفون (اسم المستخدم)' : 'Phone Number'}
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder={isRtl ? 'أدخل رقم التليفون المسجل' : '01xxxxxxxxx'}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? isRtl
                ? 'جاري التحقق والدخول...'
                : 'Signing in...'
              : isRtl
              ? 'تسجيل الدخول'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
