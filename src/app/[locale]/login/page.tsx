'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Phone, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function LoginPage({ params }: LoginPageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'رقم الهاتف أو كلمة المرور غير صحيحة');
      }

      // توجيه المستخدم حسب دوره
      if (data.user?.system_role === 'SUPER_ADMIN' || data.user?.role === 'SUPER_ADMIN' || data.user?.role === 'مدير نظام') {
        router.push(`/${locale}/admin/dashboard`);
      } else {
        router.push(`/${locale}/employee/attendance`);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080911] relative overflow-hidden" dir="rtl">
      {/* إضاءة خلفية جمالية */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 relative z-10">
        
        {/* اللوجو والترويسة */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto relative flex items-center justify-center">
            <Image 
              src="/Logo.png" 
              alt="L-K Shift Logo" 
              width={64} 
              height={64} 
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">L-K Shift</h1>
          <p className="text-xs text-slate-400 font-medium">نظام إدارة الحضور والورديات</p>
        </div>

        {/* أزرار التبديل (تسجيل دخول / إنشاء حساب) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/50 text-xs font-bold text-center">
          <button
            type="button"
            className="py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md transition"
          >
            تسجيل الدخول
          </button>
          <Link
            href={`/${locale}/careers`}
            className="py-2.5 rounded-xl text-slate-400 hover:text-white transition"
          >
            إنشاء حساب موظف
          </Link>
        </div>

        {/* تنبيه الخطأ */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* فورم تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              رقم التليفون (اسم المستخدم) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="أدخل رقم الهاتف المسجل"
                className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-left font-mono"
                dir="ltr"
              />
              <Phone size={16} className="absolute right-3.5 top-3.5 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-left font-mono"
                dir="ltr"
              />
              <Lock size={16} className="absolute right-3.5 top-3.5 text-slate-500" />
            </div>
          </div>

          {/* خانة نسيان كلمة المرور */}
          <div className="flex justify-end pt-1">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* زر الدخول */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <span>دخول</span>
                <ArrowLeft size={16} />
              </>
            )}
          </button>
        </form>

        {/* حقوق المنظومة */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500">
            © 2026 L-K Shift. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
