import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'L-K Shift - نظام إدارة الورديات والحضور',
  description: 'منظومة متكاملة لإدارة الحضور الذكي والورديات بالـ GPS',
  manifest: '/manifest.json',
  themeColor: '#ea580c',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'L-K Shift',
  },
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ea580c" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="L-K Shift" />
        <link rel="apple-touch-icon" href="/Logo.png" />
      </head>
      <body className={`${cairo.variable} font-sans antialiased bg-[#080911] text-slate-100`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          {/* رسالة طلب التثبيت التلقائية للموبايل */}
          <PwaInstallPrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
