'use client';

import React, { useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function LoginPage({ params }: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // استخدام محرك NextAuth الأصلي لمطابقة بيانات الدخول في قاعدة البيانات
      const result = await signIn('credentials', {
        redirect: false,
        phone: phone.trim(),
        username: phone.trim(), // دعم احترازي لكلا التسميتين في الـ Provider
        password: password.trim(),
        callbackUrl: `/${locale}/admin/dashboard`,
      });

      if (result?.error) {
        setErrorMessage(
          isRtl
            ? 'بيانات الدخول غير صحيحة، يرجى التأكد من رقم التليفون وكلمة المرور'
            : 'Invalid credentials, please verify your phone and password'
        );
      } else {
        // تأمين حالة المصادقة محلياً لضمان تناسق القائمة الجانبية والموجه
        localStorage.setItem('isAuthenticated', 'true');
        
        // التوجيه الحاسم إلى لوحة التحكم بدلاً من صفحة العروض
        router.replace(`/${locale}/admin/dashboard`);
        router.refresh();
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      setErrorMessage(
        isRtl
          ? 'حدث خطأ أثناء محاولة تسجيل الدخول، يرجى المحاولة لاحقاً'
          : 'An error occurred during sign in, please try again'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 transition-colors duration-300 dark:bg-[#080911]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#121526]/90 dark:shadow-2xl dark:backdrop-blur-xl sm:p-10">
        {/* اللوجو والعنوان الأصلي للمنظومة */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-2xl font-black text-white shadow-lg shadow-orange-500/25">
            LK
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            L-K Shift
          </h1>
          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isRtl ? 'منظومة الحضور والورديات وإدارة الفروع' : 'Smart Attendance & Shift Operations'}
          </p>
        </div>

        {/* رسائل التنبيه والخطأ */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
            {errorMessage}
          </div>
        )}

        {/* نموذج تسجيل الدخول المتوافق مع الثيمين */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? 'رقم التليفون (اسم المستخدم)' : 'Phone Number'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
              placeholder={isRtl ? 'أدخل رقم التليفون المسجل' : '01xxxxxxxxx'}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? 'كلمة المرور' : 'Password'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
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
