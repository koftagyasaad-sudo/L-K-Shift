'use client';

import { useEffect } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    lkShiftDeferredInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export default function PwaInstallEventCapture() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.warn('Service worker registration failed:', error));
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.lkShiftDeferredInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event('lk-shift-beforeinstallprompt'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  return null;
}
