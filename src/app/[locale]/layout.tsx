import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { AppProviders } from '@/components/providers/app-providers';
import PwaInstallEventCapture from '@/components/PwaInstallEventCapture';
import arabicMessages from '../../../messages/ar.json';
import englishMessages from '../../../messages/en.json';

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex-arabic',
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
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning className={ibmPlexSansArabic.variable}>
      <body className={`${ibmPlexSansArabic.className} ${ibmPlexSansArabic.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={publicMessages}>
          {'\n'}
          <AppProviders>
            <PwaInstallEventCapture />
            {'\n'}
            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
