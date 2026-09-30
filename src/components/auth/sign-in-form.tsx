"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}`;
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError(t("error"));
        toast.error(t("error"));
        return;
      }

      toast.success(t("submit"));
      router.replace(result.url ?? callbackUrl);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("phone")}</span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-[#D8261C] focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
          placeholder="0500000000"
          autoComplete="tel"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("password")}</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-[#D8261C] focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
          autoComplete="current-password"
        />
      </label>

      {error ? <p className="text-sm font-medium text-[#D8261C]">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[#D8261C] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#D8261C]/30 transition hover:bg-[#bb2319] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? t("pending") : t("submit")}
      </button>
    </form>
  );
}
