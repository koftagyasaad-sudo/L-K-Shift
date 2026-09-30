import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("auth");
  const session = await auth();
  const alreadyLoggedIn = !!session?.user;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[32px] border border-white/10 bg-[#121212] p-8 text-white shadow-2xl shadow-black/25">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ffb3ae]">L&amp;K Shift</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-white/75">{t("subtitle")}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">{t("demoTitle")}</p>
            <p className="mt-3 text-sm text-white/70">{t("adminDemo")}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">{t("demoTitle")}</p>
            <p className="mt-3 text-sm text-white/70">{t("employeeDemo")}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#171717]">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t("submit")}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {alreadyLoggedIn ? "Authenticated session detected." : t("subtitle")}
        </p>
        <div className="mt-8">
          <SignInForm />
        </div>
      </section>
    </div>
  );
}
