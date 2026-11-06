'use client';

import React, { useState, useEffect } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. تسجيل الـ Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration failed:', err));
    }

    // 2. التحقق إن كان التطبيق مفتوحاً بالفعل كتطبيق مستقل (Standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // لا نظهر الرسالة إذا كان التطبيق مثبتاً ويعمل بالفعل
    }

    // 3. فحص إذا كان جهاز آيفون (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. استلام إشعار المتصفح لإتاحة التثبيت (لأجهزة Android والكمبيوتر)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // إظهار البانر بعد ثانيتين من فتح الموقع
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // للمستخدمين على أجهزة iOS في Safari نظهر التوجيه إذا لم يكن مثبتاً
    if (isIosDevice && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa_ios_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIos) {
      sessionStorage.setItem('pwa_ios_dismissed', 'true');
    }
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
