'use client';

import React, { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fadeExit, setFadeExit] = useState(false);

  useEffect(() => {
    // إظهار شاشة البداية بشكل جذاب لمدة 1.4 ثانية ثم إخفاؤها بسلاسة
    const exitTimer = setTimeout(() => {
      setFadeExit(true);
    }, 1400);

    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 1800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ${
        fadeExit ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      dir="rtl"
    >
      {/* هالة خلفية متحركة */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-orange-600/25 to-rose-600/25 blur-3xl animate-pulse pointer-events-none" />

      {/* الحاوية الدائرية مع أنيميشن الدخول والتوهج */}
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          {/* حلقة دائرية خارجية دوارة بتدرج لوني فخم */}
          <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-400 opacity-80 blur-xs animate-spin [animation-duration:3s]" />

          {/* الإطار الدائري الحاوي للشعار */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900 border-2 border-orange-500/50 p-4 shadow-2xl flex items-center justify-center overflow-hidden transform transition-transform animate-bounce [animation-duration:2s]">
            <img
              src="/Logo.png"
              alt="L-K Shift Core Logo"
              className="w-full h-full object-contain filter drop-shadow brightness-110"
            />
          </div>
        </div>

        {/* النصوص الرسمية وشريط التحميل */}
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            L-K Shift <span className="text-orange-500">Core</span>
          </h1>
          <p className="text-[11px] font-semibold text-slate-400 tracking-wider">
            نظام إدارة الحضور والورديات الذكي
          </p>

          {/* شريط التحميل الانسيابي الدائري الأطراف */}
          <div className="w-44 h-1.5 bg-slate-800 rounded-full mx-auto mt-4 overflow-hidden relative">
            <div className="absolute inset-y-0 bg-gradient-to-r from-orange-500 via-amber-400 to-rose-600 rounded-full w-full -translate-x-full animate-[progress_1.3s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
