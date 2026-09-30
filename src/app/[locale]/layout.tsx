import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { GlobalHeader } from "@/components/layout/global-header";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, session] = await Promise.all([getMessages(), auth()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProviders session={session}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(216,38,28,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_40%,_#f8fafc_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(216,38,28,0.24),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#121212_45%,_#0b1120_100%)] dark:text-white">
          <GlobalHeader locale={locale as "ar" | "en"} />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
