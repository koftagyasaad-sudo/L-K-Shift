"use client";

import { Lock, Phone } from "lucide-react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      phone,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      toast.error("رقم الهاتف أو كلمة المرور غير صحيحة");
      return;
    }

    toast.success("تم تسجيل الدخول بنجاح");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center">
      <div className="w-full max-w-md rounded-[32px] border border-border bg-surface p-8 shadow-2xl shadow-black/5">
        <div className="mb-8 text-center">
          <div className="gradient-hero mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg shadow-primary/30">
            LK
          </div>
          <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-foreground-muted">أدخل بياناتك للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">رقم الهاتف</span>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-4 py-3 focus-within:border-primary">
              <Phone className="h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                placeholder="010"
                className="w-full bg-transparent text-foreground outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">كلمة المرور</span>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-4 py-3 focus-within:border-primary">
              <Lock className="h-4 w-4 text-foreground-muted" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••"
                className="w-full bg-transparent text-foreground outline-none"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="gradient-hero w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-border bg-background-secondary p-4 text-center">
          <p className="text-xs font-medium text-foreground-muted">بيانات تجريبية</p>
          <p className="mt-1 text-sm font-semibold text-foreground">010 / 123</p>
        </div>
      </div>
    </div>
  );
}
