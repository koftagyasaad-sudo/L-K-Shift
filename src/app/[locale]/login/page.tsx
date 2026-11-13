'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import PasswordInput from '@/components/ui/PasswordInput';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const submittedPhone = String(formData.get('phone') || formData.get('login_phone_field_lk') || username || '').trim();
    const submittedPassword = String(formData.get('password') || formData.get('login_pwd_field_lk') || password || '');

    if (!submittedPhone || !submittedPassword) {
      setError(isRtl ? 'يرجى إدخال رقم الهاتف وكلمة المرور' : 'Please enter phone and password');
      setLoading(false);
      return;
    }

    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: submittedPhone,
          password: submittedPassword,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.success) {
        throw new Error(loginData.message || (isRtl ? 'رقم الهاتف أو كلمة المرور غير صحيحة' : 'Invalid credentials'));
      }

      // Also call NextAuth signIn in the background without blocking
      signIn('credentials', {
        phone: submittedPhone,
        username: submittedPhone,
        password: submittedPassword,
        redirect: false,
      }).catch(() => {});

      const user = loginData.user;

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', String(user.id));
      localStorage.setItem('userName', String(user.name || submittedPhone));
      localStorage.setItem('userPhone', String(user.phone || submittedPhone));
      localStorage.setItem('userRole', String(user.role || 'مدير النظام'));
      localStorage.setItem('userBranchId', user.branchId ? String(user.branchId) : '');
      localStorage.setItem('userBranchName', String(user.branchName || 'الإدارة'));
      localStorage.setItem('userPermissions', JSON.stringify(user.permissions || []));
      localStorage.setItem('isOnboarded', 'true');

      const perms: string[] = Array.isArray(user.permissions) ? user.permissions : [];
      const isAdmin =
        perms.includes('*') ||
        user.systemRole === 'SUPER_ADMIN' ||
        user.role === 'مدير النظام' ||
        user.role === 'SUPER_ADMIN' ||
        String(user.role || '').includes('مدير');

      const targetPath = (isAdmin || perms.length > 0)
        ? `/${locale}/admin/dashboard`
        : `/${locale}/attendance`;

      window.location.href = targetPath;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (isRtl ? 'حدث خطأ أثناء تسجيل الدخول' : 'Login failed'));
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setError(isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          phone: regPhone.trim(),
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (isRtl ? 'فشل إنشاء الحساب' : 'Registration failed'));
      }

      setSuccessMsg(data.message);
      setUsername(regPhone.trim());
      setPassword(regPassword.trim());

      setTimeout(() => {
        setActiveTab('LOGIN');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (isRtl ? 'فشل إنشاء الحساب' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full max-w-full flex-col items-center justify-center overflow-hidden bg-[#f8f9fa] p-4 text-slate-900 dark:bg-[#0c0d10] dark:text-zinc-100"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <ThemeToggle className="absolute end-4 top-4 z-20" />
      {'\n'}
      {'\n'}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/Logo.png"
            alt="L-K Shift Logo"
            className="mb-3 h-20 w-auto object-contain"
          />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">L-K Shift</h1>
          <p className="mt-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
            {isRtl ? 'نظام إدارة الحضور والانصراف والورديات الميدانية' : 'Attendance & Shift Management System'}
          </p>
        </div>

        {'\n'}
        <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 dark:border-white/[0.08] dark:bg-[#141519]">
          <div className="mb-6 flex rounded-xl border border-slate-200/90 bg-slate-50 p-1 dark:border-white/[0.08] dark:bg-[#0c0d10]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'LOGIN'
                  ? 'bg-white text-orange-600 shadow-sm dark:bg-[#1c1e24] dark:text-orange-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {isRtl ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'REGISTER'
                  ? 'bg-white text-orange-600 shadow-sm dark:bg-[#1c1e24] dark:text-orange-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {isRtl ? 'تسجيل بيانات موظف جديد' : 'New Account'}
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs text-center font-semibold leading-relaxed">
              {successMsg}
            </div>
          )}

          {'\n'}
          {activeTab === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 font-semibold mb-1.5">
                  {isRtl ? 'رقم الهاتف المسجل' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  autoCapitalize="none"
                  required
                  autoComplete="off"
                  name="phone"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRtl ? 'أدخل رقم الهاتف المسجل' : '01xxxxxxxxx'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-white/[0.08] dark:bg-[#0c0d10] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 font-semibold mb-1.5">
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </label>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  showLabel={isRtl ? 'إظهار كلمة المرور' : 'Show password'}
                  hideLabel={isRtl ? 'إخفاء كلمة المرور' : 'Hide password'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-white/[0.08] dark:bg-[#0c0d10] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end pt-0.5">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs font-medium text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400"
                >
                  {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                    <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 font-semibold mb-1.5">
                  {isRtl ? 'الاسم رباعي' : 'Full Name'} <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder={isRtl ? 'أدخل اسمك رباعي' : 'Enter full name'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-white/[0.08] dark:bg-[#0c0d10] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 font-semibold mb-1.5">
                  {isRtl ? 'رقم الهاتف (اسم المستخدم)' : 'Phone Number'} <span className="text-orange-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoCapitalize="none"
                  required
                  autoComplete="off"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-white/[0.08] dark:bg-[#0c0d10] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 font-semibold mb-1.5">
                  {isRtl ? 'كلمة المرور' : 'Password'} <span className="text-orange-500">*</span>
                </label>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="6 أحرف أو أرقام على الأقل"
                  showLabel={isRtl ? 'إظهار كلمة المرور' : 'Show password'}
                  hideLabel={isRtl ? 'إخفاء كلمة المرور' : 'Hide password'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-white/[0.08] dark:bg-[#0c0d10] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 font-semibold mb-1.5">
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="text-orange-500">*</span>
                </label>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  showLabel={isRtl ? 'إظهار تأكيد كلمة المرور' : 'Show password confirmation'}
                  hideLabel={isRtl ? 'إخفاء تأكيد كلمة المرور' : 'Hide password confirmation'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-white/[0.08] dark:bg-[#0c0d10] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {isRtl ? 'تسجيل بيانات موظف جديد جديد' : 'Register Account'}
                  </>
                )}
              </button>
            </form>
          )}

          {'\n'}
          <div className="mt-6 flex flex-col items-center gap-1 border-t border-slate-200/90 pt-4 text-center text-[11px] text-slate-600 dark:border-white/[0.08] dark:text-zinc-400">
            <span>© {new Date().getFullYear()} L-K Shift Core. {isRtl ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
            <span className="font-medium">Developed by Omar Abd Elhaleam</span>
          </div>
        </div>
      </div>
    </div>
  );
}
