import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { isRtl } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "L&K Shift",
  description: "Restaurant group HR, attendance, shift, and self-service management system.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const locale = headerStore.get("x-next-intl-locale") ?? routing.defaultLocale;

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
