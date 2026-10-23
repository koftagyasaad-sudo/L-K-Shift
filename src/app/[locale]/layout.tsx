import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { isValidLocale } from "@/i18n/routing";

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const session = await auth();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppProviders session={session}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
