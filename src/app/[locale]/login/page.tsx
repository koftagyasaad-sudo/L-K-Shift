"use client";

import { Lock, Phone, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const { status } = useSession();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isRtl = locale === "ar";

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

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
      toast.error(isRtl ? "رقم الهاتف أو كلمة المرور غير صحيحة" : "Invalid phone or password");
      setLoading(false);
      return;
    }

    toast.success(isRtl ? "تم تسجيل الدخول بنجاح" : "Signed in successfully");
    router.push("/");
    router.refresh();
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen bg-background">
      <div className="gradient-hero relative hidden flex-1 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black backdrop-blur-sm">
            LK
          </div>
          <div>
            <p className="text-xl font-bold">L&amp;K Shift</p>
            <p className="text-sm text-white/80">Workforce Hub</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-black leading-tight">
            {isRtl ? "نظام إدارة الحضور والموارد البشرية" : "Attendance & HR Management System"}
          </h2>
          <p className="mt-4 text-base leading-7 text-white/85">
            {isRtl
              ? "منصة موحدة لإدارة حضور الموظفين والفروع والطلبات في مكان واحد."
              : "One unified platform to manage employee attendance, branches, and requests."}
          </p>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Lion Broast &amp; Koftagi</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="gradient-hero mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg shadow-primary/30">
              LK
            </div>
            <p className="text-lg font-bold text-foreground">L&amp;K Shift</p>
          </div>

          <h1 className="text-2xl font-bold text-foreground">{isRtl ? "تسجيل الدخول" : "Sign in"}</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            {isRtl ? "أدخل بياناتك للوصول إلى لوحة التحكم" : "Enter your credentials to access the dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">{isRtl ? "رقم الهاتف" : "Phone number"}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-4 py-3 transition focus-within:border-accent">
                <Phone className="h-4 w-4 text-foreground-muted" />
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  autoComplete="tel"
                  className="w-full bg-transparent text-foreground outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">{isRtl ? "كلمة المرور" : "Password"}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-4 py-3 transition focus-within:border-accent">
                <Lock className="h-4 w-4 text-foreground-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent text-foreground outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent-hover flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 transition disabled:opacity-60"
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
    </div>
  );
}
