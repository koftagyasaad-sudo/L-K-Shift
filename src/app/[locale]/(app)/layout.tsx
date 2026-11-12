import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import AppShell from './app-shell';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <AppShell>{children}</AppShell>
      <PwaInstallPrompt />
    </NextIntlClientProvider>
  );
}
