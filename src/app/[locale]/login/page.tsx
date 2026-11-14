'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowRight, Loader2, WifiOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import PasswordInput from '@/components/ui/PasswordInput';
import { ThemeToggle } from '@/components/theme-toggle';
import LaunchSplashScreen from '@/components/LaunchSplashScreen';

async function sha256Hex(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const buf = new TextEncoder().encode(text + ':LK_OFFLINE_SALT_2026');
    const digest = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return text;
}

interface OfflineVaultEntry {
  phone: string;
  passwordHash: string;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    systemRole: string;
    branchId: string;
    branchName: string;
    permissions: string[];
  };
}

export default function LoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isOffline, setIsOffline] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If user already has an active authenticated session (especially when launching offline), go straight to app
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const uid = localStorage.getItem('userId');
    if (isAuth && uid && !navigator.onLine) {
      window.location.href = `/${locale}/attendance`;
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [locale]);

  const applySessionAndRedirect = (user: OfflineVaultEntry['user']) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', String(user.id));
    localStorage.setItem('userName', String(user.name || user.phone));
    localStorage.setItem('userPhone', String(user.phone));
    localStorage.setItem('userRole', String(user.role || 'موظف'));
    localStorage.setItem('userBranchId', user.branchId ? String(user.branchId) : '');
    localStorage.setItem('userBranchName', String(user.branchName || 'الإدارة'));
    localStorage.setItem('userPermissions', JSON.stringify(user.permissions || []));
    localStorage.setItem('isOnboarded', 'true');

    const perms: string[] = Array.isArray(user.permissions) ? user.permissions : [];
    const isAdmin =
      perms.includes('*') ||
      user.systemRole === 'SUPER_ADMIN' ||
      user.role === 'مدير النظام' ||
      String(user.role || '').includes('مدير');

    const activeLocale = locale === 'ar' || locale === 'en' ? locale : 'ar';
    if (!navigator.onLine) {
      window.location.href = `/${activeLocale}/attendance`;
      return;
    }
    const targetPath = isAdmin ? `/${activeLocale}/admin/dashboard` : `/${activeLocale}/attendance`;
    window.location.href = targetPath;
  };

  const tryOfflineVaultLogin = async (cleanPhone: string, rawPassword: string): Promise<boolean> => {
    try {
      const vaultRaw = localStorage.getItem('lk_offline_vault');
      if (!vaultRaw) return false;
      const vault: Record<string, OfflineVaultEntry> = JSON.parse(vaultRaw);
      const entry = vault[cleanPhone];
      if (!entry) return false;
      const inputHash = await sha256Hex(rawPassword);
      if (entry.passwordHash !== inputHash) {
        throw new Error(isRtl ? 'كلمة المرور غير صحيحة (وضع الأوفلاين)' : 'Incorrect password (offline mode)');
      }
      applySessionAndRedirect(entry.user);
      return true;
    } catch (err) {
      if (err instanceof Error && err.message.includes('كلمة المرور')) {
        throw err;
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawPhone = String(formData.get('phone') || username || '').trim();
    const submittedPhone = rawPhone
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/\s+/g, '');
    const submittedPassword = String(formData.get('password') || password || '');

    if (!submittedPhone || !submittedPassword) {
      setError(isRtl ? 'يرجى إدخال رقم الهاتف وكلمة المرور' : 'Please enter phone and password');
      setLoading(false);
      return;
    }

    // 1. If device is currently offline, authenticate directly against encrypted local vault
    if (!navigator.onLine) {
      try {
        const ok = await tryOfflineVaultLogin(submittedPhone, submittedPassword);
        if (!ok) {
          setError(
            isRtl
              ? 'يجب تسجيل الدخول بالإنترنت مرة واحدة على الأقل على هذا الهاتف لتفعيل الدخول الأوفلاين.'
              : 'Please sign in online at least once on this device to enable offline login.'
          );
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول أوفلاين');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Online login
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

      signIn('credentials', {
        phone: submittedPhone,
        username: submittedPhone,
        password: submittedPassword,
        redirect: false,
      }).catch(() => {});

      const user = loginData.user;
      const userObj: OfflineVaultEntry['user'] = {
        id: String(user.id),
        name: String(user.name || submittedPhone),
        phone: String(user.phone || submittedPhone),
        role: String(user.role || 'موظف'),
        systemRole: String(user.systemRole || 'EMPLOYEE'),
        branchId: user.branchId ? String(user.branchId) : '',
        branchName: String(user.branchName || 'الإدارة'),
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      };

      // Save encrypted SHA-256 credentials in local vault for future offline logins
      try {
        const pwdHash = await sha256Hex(submittedPassword);
        const existingVaultRaw = localStorage.getItem('lk_offline_vault');
        const vault: Record<string, OfflineVaultEntry> = existingVaultRaw ? JSON.parse(existingVaultRaw) : {};
        vault[submittedPhone] = {
          phone: submittedPhone,
          passwordHash: pwdHash,
          user: userObj,
        };
        localStorage.setItem('lk_offline_vault', JSON.stringify(vault));
      } catch {}

      // Pre-cache branches for offline geofence verification right away
      try {
        fetch('/api/branches', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              const mapped = data.map((b: Record<string, unknown>) => ({
                id: String(b.id ?? ''),
                name: String(b.nameAr || b.name_ar || b.name || 'فرع'),
                lat: parseFloat(String(b.latitude ?? 31.12225)),
                lng: parseFloat(String(b.longitude ?? 30.64821)),
                radius: Math.max(1, Number(b.geofenceRadius ?? b.geofence_radius ?? b.radiusMeters ?? 10)),
              }));
              localStorage.setItem('lk_cached_branches', JSON.stringify(mapped));
            }
          })
          .catch(() => {});
      } catch {}

      applySessionAndRedirect(userObj);
    } catch (err: unknown) {
      // Network dropped mid-request: fallback to offline vault
      if (err instanceof TypeError || (err instanceof Error && /fetch|network/i.test(err.message))) {
        try {
          const ok = await tryOfflineVaultLogin(submittedPhone, submittedPassword);
          if (ok) return;
        } catch (vaultErr: unknown) {
          setError(vaultErr instanceof Error ? vaultErr.message : 'كلمة المرور غير صحيحة');
          setLoading(false);
          return;
        }
        setError(
          isRtl
            ? 'لا يوجد اتصال بالإنترنت حالياً. يرجى تسجيل الدخول بالإنترنت مرة واحدة أولاً لتفعيل البصمة الأوفلاين.'
            : 'Offline: please sign in online once first.'
        );
      } else {
        setError(err instanceof Error ? err.message : (isRtl ? 'حدث خطأ أثناء تسجيل الدخول' : 'Login failed'));
      }
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!navigator.onLine) {
      setError(isRtl ? 'يتطلب إنشاء حساب جديد اتصالاً بالإنترنت.' : 'Registration requires internet connection.');
      return;
    }

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
      className="relative flex min-h-screen w-full max-w-full flex-col items-center justify-center overflow-hidden bg-[#f2f3f5] p-4 text-slate-900 dark:bg-[#181d23] dark:text-zinc-100"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <LaunchSplashScreen />
      <ThemeToggle className="absolute end-4 top-4 z-20" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-[fadeIn_0.45s_ease-out]">
        {/* لوجو عصري صغير وأنيق مع نبض ضوئي */}
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute h-16 w-16 rounded-2xl bg-[#57cef8]/20 blur-md animate-pulse" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#57cef8] bg-[#232a32] shadow-lg transition-transform duration-300 hover:scale-105">
              <div className="flex flex-col items-center">
                <div className="flex items-baseline text-xl font-black tracking-tighter leading-none" dir="ltr">
                  <span className="text-white">L</span>
                  <span className="text-[#57cef8]">K</span>
                </div>
                <span className="mt-1 h-0.5 w-6 rounded-full bg-[#57cef8]" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">L-K Shift</h1>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">
            {isRtl ? 'نظام إدارة الحضور والانصراف والورديات الميدانية' : 'Attendance & Shift Management System'}
          </p>
          {isOffline && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-extrabold text-amber-500">
              <WifiOff size={13} />
              <span>وضع الأوفلاين نشط — يمكنك الدخول لتسجيل البصمة</span>
            </span>
          )}
        </div>

        <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 dark:border-white/[0.08] dark:bg-[#232a32]">
          <div className="mb-6 flex rounded-xl border border-slate-200/90 bg-slate-50 p-1 dark:border-white/[0.08] dark:bg-[#181d23]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'LOGIN'
                  ? 'bg-white text-[#0099cc] shadow-sm dark:bg-[#292f35] dark:text-[#57cef8]'
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
                  ? 'bg-white text-[#0099cc] shadow-sm dark:bg-[#292f35] dark:text-[#57cef8]'
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

          {activeTab === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#57cef8] focus:outline-none dark:border-white/[0.08] dark:bg-[#181d23] dark:text-zinc-100"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#57cef8] focus:outline-none dark:border-white/[0.08] dark:bg-[#181d23] dark:text-zinc-100"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end pt-0.5">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs font-medium text-[#0099cc] transition-colors hover:underline dark:text-[#57cef8]"
                >
                  {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#57cef8] px-6 py-3.5 text-sm font-extrabold text-[#181d23] transition-colors hover:bg-[#70c6eb] disabled:opacity-70 cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {isRtl ? 'الاسم رباعي' : 'Full Name'} <span className="text-[#57cef8]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder={isRtl ? 'أدخل اسمك رباعي' : 'Enter full name'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#57cef8] focus:outline-none dark:border-white/[0.08] dark:bg-[#181d23] dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {isRtl ? 'رقم الهاتف (اسم المستخدم)' : 'Phone Number'} <span className="text-[#57cef8]">*</span>
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#57cef8] focus:outline-none dark:border-white/[0.08] dark:bg-[#181d23] dark:text-zinc-100"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {isRtl ? 'كلمة المرور' : 'Password'} <span className="text-[#57cef8]">*</span>
                </label>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="8 خانات (حرف كبير وصغير ورقم ورمز)"
                  showLabel={isRtl ? 'إظهار كلمة المرور' : 'Show password'}
                  hideLabel={isRtl ? 'إخفاء كلمة المرور' : 'Hide password'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#57cef8] focus:outline-none dark:border-white/[0.08] dark:bg-[#181d23] dark:text-zinc-100"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="text-[#57cef8]">*</span>
                </label>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  showLabel={isRtl ? 'إظهار تأكيد كلمة المرور' : 'Show password confirmation'}
                  hideLabel={isRtl ? 'إخفاء تأكيد كلمة المرور' : 'Hide password confirmation'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#57cef8] focus:outline-none dark:border-white/[0.08] dark:bg-[#181d23] dark:text-zinc-100"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#57cef8] px-6 py-3.5 text-sm font-extrabold text-[#181d23] transition-colors hover:bg-[#70c6eb] disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {isRtl ? 'تسجيل بيانات موظف جديد' : 'Register Account'}
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-col items-center gap-1 border-t border-slate-200/90 pt-4 text-center text-[11px] text-slate-600 dark:border-white/[0.08] dark:text-zinc-400">
            <span>© {new Date().getFullYear()} L-K Shift Core. {isRtl ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
            <span className="font-medium">Developed by Omar Abd Elhaleam</span>
          </div>
        </div>
      </div>
    </div>
  );
}
