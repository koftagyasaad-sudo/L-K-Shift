"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogIn, Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // مؤقتًا: تسجيل دخول مباشر للوحة التحكم
      // لاحقًا يتم ربطه بـ Auth حقيقي (NextAuth / Neon)
      if (!email.trim() || !password.trim()) {
        setError(isAr ? "يرجى إدخال البريد وكلمة المرور" : "Please enter email and password");
        setLoading(false);
        return;
      }

      // محاكاة نجاح تسجيل الدخول
      await new Promise((r) => setTimeout(r, 600));
      router.push(`/${locale}`);
      router.refresh();
    } catch {
      setError(isAr ? "فشل تسجيل الدخول" : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4"
    >
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            L-K Shift
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isAr ? "نظام إدارة الحضور والورديات" : "Attendance & Shift Management"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-orange-200/60 dark:border-orange-500/20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl shadow-orange-500/10 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-orange-500" />
            {isAr ? "تسجيل الدخول" : "Sign In"}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? "admin@example.com" : "admin@example.com"}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-orange-400 transition"
                autoComplete="email"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 pe-11 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-orange-400 transition"
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                  tabIndex={-1}
                  aria-label={isAr ? "إظهار/إخفاء كلمة المرور" : "Toggle password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-2.5 px-4 shadow-lg shadow-orange-500/25 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAr ? "جاري الدخول..." : "Signing in..."}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {isAr ? "دخول" : "Sign In"}
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {isAr
              ? "صلاحيات مطلقة للنظام — أدخل أي بريد وكلمة مرور للمتابعة"
              : "Full system access — enter any email & password to continue"}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          © {new Date().getFullYear()} L-K Shift
        </p>
      </div>
    </div>
  );
}
