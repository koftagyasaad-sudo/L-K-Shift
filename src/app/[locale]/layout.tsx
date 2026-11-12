import type { Metadata, Viewport } from 'next';
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'L-K Shift',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ea580c',
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
