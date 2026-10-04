"use client";

import { Lock, Phone, Loader2, Eye, EyeOff } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import Image from "next/image";

const REMEMBER_KEY = "lk-shift-remembered-phone";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const { status } = useSession();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const isRtl = locale === "ar";

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const savedPhone = typeof window !== "undefined" ? localStorage.getItem(REMEMBER_KEY) : null;
    if (savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    const result = await signIn("credentials", {
      phone: phone.trim(),
      password,
      redirect: false,
    });

    if (!result || result.error) {
      toast.error(isRtl ? "بيانات الدخول غير صحيحة" : "Invalid login credentials");
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, phone.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    }

    toast.success(isRtl ? "تم تسجيل الدخول بنجاح" : "Signed in successfully");
    router.push("/");
    router.refresh();
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-orange-50 to-orange-100 px-4 py-10"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-orange-100 bg-white/90 shadow-2xl shadow-orange-900/10 backdrop-blur-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500" />

          <div className="px-8 pb-8 pt-10 sm:px-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-3 shadow-lg shadow-orange-500/40">
                <Image
                  src="/Logo.png"
                  alt="L&K Shift Logo"
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                  priority
                />
              </div>

              <h1 className="mt-4 text-xl font-black tracking-tight text-neutral-900">
                L&amp;K <span className="text-orange-500">Shift</span>
              </h1>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                {isRtl ? "نظام الموارد البشرية" : "Human Resources System"}
              </p>
              <p className="text-xs text-neutral-400">
                {isRtl ? "للأسد والكفتجي" : "Lion Broast & Koftagi"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
                  {isRtl ? "رقم الهاتف أو اسم المستخدم" : "Phone or Username"}
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                  <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    autoComplete="username"
                    placeholder={isRtl ? "أدخل رقم الهاتف" : "Enter phone number"}
                    className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
                  {isRtl ? "كلمة المرور" : "Password"}
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                  <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-neutral-400 transition hover:text-orange-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 accent-orange-500"
                />
                {isRtl ? "تذكر بيانات دخولي" : "Remember my login"}
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:from-orange-600 hover:to-red-600 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isRtl ? "جاري الدخول..." : "Signing in..."}</span>
                  </>
                ) : (
                  <span>{isRtl ? "دخول" : "Sign in"}</span>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] font-medium text-neutral-400">
          Powered by{" "}
          <span className="font-semibold text-orange-500">Omar Abd Elhalim</span>
        </p>
      </div>
    </div>
  );
}
