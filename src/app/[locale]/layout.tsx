import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import arabicMessages from '../../../messages/ar.json';
import englishMessages from '../../../messages/en.json';

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
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
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
  const messages = locale === 'en' ? englishMessages : arabicMessages;
  const publicMessages = {
    app: messages.app,
    auth: messages.auth,
    common: messages.common,
    header: Object.fromEntries(
      Object.entries(messages.header).filter(([key]) => key !== 'adminRoles')
    ),
  };

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased bg-[#080911] text-slate-100`}>
        <NextIntlClientProvider messages={publicMessages}>
          {children}
          {/* رسالة طلب التثبيت التلقائية للموبايل */}
          <PwaInstallPrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
