'use client';

import React, { useState, useEffect } from 'react';
import type { BeforeInstallPromptEvent } from './PwaInstallEventCapture';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const DISMISSED_KEY = 'lk_shift_pwa_prompt_dismissed';

function isPromptDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === 'true';
  } catch (error) {
    console.warn('Unable to read PWA prompt dismissal:', error);
    return false;
  }
}

function persistPromptDismissal(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, 'true');
  } catch (error) {
    console.warn('Unable to persist PWA prompt dismissal:', error);
  }
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone || isPromptDismissed()) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = () => {
      const event = window.lkShiftDeferredInstallPrompt;
      if (!event) return;
      setDeferredPrompt(event);
      setShowPrompt(true);
    };
    const handleAppInstalled = () => {
      persistPromptDismissal();
      setShowPrompt(false);
    };

    window.addEventListener('lk-shift-beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    handleBeforeInstallPrompt();

    if (isIosDevice) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('lk-shift-beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      persistPromptDismissal();
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    persistPromptDismissal();
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-bounce-in"
      dir="rtl"
    >
      <div className="rounded-2xl border border-orange-500/30 bg-[#121526]/95 p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/50 p-1 border border-white/10 shadow-inner">
            <img src="/Logo.png" alt="L-K Shift" className="h-full w-full object-contain" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">تطبيق L-K Shift</h4>
            <p className="text-[11px] text-slate-300">
              {isIos
                ? 'لتثبيته على آيفون: اضغط مشاركة [ ⎋ ] ثم اختر "إضافة إلى الشاشة الرئيسية ⊞"'
                : 'ثبت التطبيق على هاتفك لسرعة تسجيل البصمة وسهولة الاستخدام'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIos && deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 cursor-pointer"
            >
              تثبيت الآن
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
