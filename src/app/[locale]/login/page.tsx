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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-10"
    >
      {/* خلفية ديكورية خفيفة بروح المطعم */}
      <RestaurantBackdrop />

      <div className="relative z-10 w-full max-w-sm">
        <div className="overflow-hidden rounded-[28px] border border-orange-100/80 bg-white/95 shadow-2xl shadow-orange-900/10 backdrop-blur-md">
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500" />

          <div className="px-8 pb-8 pt-9 sm:px-9">
            {/* اللوجو الكبير */}
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-[22px] bg-gradient-to-br from-orange-400 to-red-500 shadow-xl shadow-orange-500/40">
                <Image
                  src="/Logo.png"
                  alt="L&K Shift Logo"
                  fill
                  sizes="112px"
                  className="object-contain p-1"
                  priority
                />
              </div>

              <h1 className="mt-5 text-2xl font-black tracking-tight text-neutral-900">
                L&amp;K <span className="text-orange-500">Shift</span>
              </h1>
              <p className="mt-1.5 text-sm font-semibold text-neutral-600">
                {isRtl ? "نظام الموارد البشرية" : "Human Resources System"}
              </p>
              <p className="text-xs text-neutral-400">
                {isRtl ? "للأسد والكفتجي" : "Lion Broast & Koftagi"}
              </p>
            </div>

            {/* الفورم */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  autoComplete="username"
                  placeholder={isRtl ? "أدخل رقم الهاتف" : "Enter phone number"}
                  className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-3 transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-neutral-400 transition hover:text-orange-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={isRtl ? "كلمة المرور" : "Password"}
                  className="w-full bg-transparent text-center text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
              </div>

              <label className="flex cursor-pointer items-center justify-end gap-2 text-xs font-medium text-neutral-600">
                {isRtl ? "تذكر بيانات دخولي" : "Remember my login"}
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 accent-orange-500"
                />
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

        <p className="relative z-10 mt-6 text-center text-[11px] font-medium text-neutral-400">
          Powered by{" "}
          <span className="font-semibold text-orange-500">Omar Abd Elhalim</span>
        </p>
      </div>
    </div>
  );
}

/**
 * خلفية ديكورية خفيفة جدًا بروح المطعم:
 * أيقونات (شوكة وسكينة، طبق، قبعة شيف، كوب) متناثرة بشفافية منخفضة جدًا.
 */
function RestaurantBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="restaurant-pattern"
            x="0"
            y="0"
            width="180"
            height="180"
            patternUnits="userSpaceOnUse"
          >
            {/* شوكة وسكينة */}
            <g transform="translate(15,20)" stroke="#ea580c" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <line x1="0" y1="0" x2="0" y2="40" />
              <line x1="-6" y1="0" x2="-6" y2="12" />
              <line x1="6" y1="0" x2="6" y2="12" />
              <path d="M20 0 L20 16 Q20 22 26 22 L26 40" />
            </g>

            {/* طبق */}
            <circle cx="110" cy="40" r="18" stroke="#ea580c" strokeWidth="2.5" fill="none" />
            <circle cx="110" cy="40" r="10" stroke="#ea580c" strokeWidth="1.5" fill="none" />

            {/* كوب */}
            <g transform="translate(60,100)" stroke="#ea580c" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M0 0 L4 28 L24 28 L28 0 Z" />
              <path d="M28 4 Q38 4 38 14 Q38 22 28 20" />
            </g>

            {/* قبعة شيف */}
            <g transform="translate(140,110)" stroke="#ea580c" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M0 24 L0 10 Q0 -4 14 -4 Q20 -10 26 -4 Q40 -4 40 10 L40 24 Z" />
              <line x1="0" y1="24" x2="40" y2="24" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#restaurant-pattern)" />
      </svg>
    </div>
  );
}
