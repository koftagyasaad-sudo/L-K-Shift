'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserPlus, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isRtl = locale === 'ar';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // حقول الدخول
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // حقول التسجيل الجديد
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // معالجة تسجيل الدخول
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
      }

      const user = data.user;

      localStorage.clear();
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', String(user.id));
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userPhone', user.phone);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userBranchId', user.branchId ? String(user.branchId) : '');
      localStorage.setItem('userBranchName', user.branchName || '');
      localStorage.setItem('userPermissions', JSON.stringify(user.permissions || []));
      localStorage.setItem('isOnboarded', String(user.isOnboarded));

      const perms: string[] = user.permissions || [];
      const isAdmin = perms.includes('*') || user.role === 'مدير النظام' || user.role === 'SUPER_ADMIN';

      if (isAdmin || perms.includes('dashboard.view')) {
        router.push(`/${locale}/admin/dashboard`);
      } else {
        router.push(`/${locale}/attendance`);
      }
    } catch (err: any) {
      setError(err.message || (isRtl ? 'حدث خطأ أثناء تسجيل الدخول' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  // معالجة إنشاء حساب موظف جديد
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

      // التحويل لتبويب الدخول بعد نجاح التسجيل
      setTimeout(() => {
        setActiveTab('LOGIN');
      }, 1500);
    } catch (err: any) {
      setError(err.message || (isRtl ? 'فشل إنشاء الحساب' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* اللوجو الأصلي */}
        <div className="mb-6 flex flex-col items-center">
          <img src="/Logo.png" alt="L-K Shift Logo" className="h-20 w-auto mb-4 drop-shadow-xl" />
          <h1 className="text-3xl font-black text-white tracking-wider">L-K Shift</h1>
          <p className="text-gray-400 text-sm mt-2">
            {isRtl ? 'نظام إدارة الحضور والورديات' : 'Attendance & Shift Management'}
          </p>
        </div>

        {/* الكارد الزجاجي */}
        <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-7 sm:p-8 rounded-[2rem] shadow-2xl">
          {/* تبويبات الدخول والتسجيل */}
          <div className="flex rounded-2xl bg-black/40 p-1 mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'LOGIN'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'REGISTER'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isRtl ? 'إنشاء حساب موظف' : 'New Account'}
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

          {/* نموذج تسجيل الدخول */}
          {activeTab === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {isRtl ? 'رقم التليفون (اسم المستخدم)' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRtl ? 'أدخل رقم الهاتف المسجل' : '01xxxxxxxxx'}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-left text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-left text-sm"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isRtl ? 'دخول' : 'Sign In'}
                    <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* نموذج إنشاء حساب جديد */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {isRtl ? 'الاسم رباعي' : 'Full Name'} <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder={isRtl ? 'أدخل اسمك رباعي' : 'Enter full name'}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {isRtl ? 'رقم الهاتف (سيكون اسم دخولك)' : 'Phone Number'} <span className="text-orange-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-left text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {isRtl ? 'كلمة المرور' : 'Password'} <span className="text-orange-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="6 أحرف أو أرقام على الأقل"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-left text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="text-orange-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-left text-sm"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {isRtl ? 'إنشاء حساب موظف جديد' : 'Register Account'}
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            © {new Date().getFullYear()} L-K Shift. {isRtl ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </p>
        </div>
      </div>
    </div>
  );
}
