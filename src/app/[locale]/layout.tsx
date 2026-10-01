import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { GlobalHeader } from "@/components/layout/global-header";
import { Sidebar } from "@/components/layout/sidebar";
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

  const [messages, session, t] = await Promise.all([
    getMessages(),
    auth(),
    getTranslations("header"),
  ]);

  const typedLocale = locale as "ar" | "en";
  const dir = typedLocale === "ar" ? "rtl" : "ltr";
  const logoutLabel = typedLocale === "ar" ? "تسجيل الخروج" : "Logout";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProviders session={session}>
        <div dir={dir} className="flex min-h-screen bg-background text-foreground">
          <Sidebar
            locale={typedLocale}
            isSuperAdmin={session?.user?.systemRole === "SUPER_ADMIN"}
            isAuthenticated={Boolean(session?.user)}
            labels={{
              overview: t("overview"),
              adminRoles: t("adminRoles"),
              employeeProfile: t("employeeProfile"),
              logout: logoutLabel,
            }}
          />

          <div className="flex min-h-screen flex-1 flex-col">
            <GlobalHeader locale={typedLocale} />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
