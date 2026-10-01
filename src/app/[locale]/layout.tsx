import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { isValidLocale, routing } from "@/i18n/routing";

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

  if (!isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, session] = await Promise.all([getMessages(), auth()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProviders session={session}>{children}</AppProviders>
    </NextIntlClientProvider>
  );
}
