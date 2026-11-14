'use client';

import React, { useEffect, useState } from 'react';

export default function LaunchSplashScreen() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Show sleek animated intro once per app launch session
    if (sessionStorage.getItem('lk_splash_shown') === '1') {
      setVisible(false);
      return;
    }
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 950);
    const hideTimer = setTimeout(() => {
      sessionStorage.setItem('lk_splash_shown', '1');
      setVisible(false);
    }, 1350);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#181d23] transition-all duration-400 ease-out ${
        exiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      dir="ltr"
    >
      {/* Ambient cyan radial glow */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-28 w-28 rounded-full bg-[#57cef8]/20 blur-xl animate-pulse" />
        <div className="absolute h-20 w-20 rounded-2xl border border-[#57cef8]/40 animate-ping [animation-duration:1.6s]" />

        {/* Compact sleek logo box */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#57cef8] bg-[#232a32] shadow-[0_0_30px_rgba(87,206,248,0.35)] animate-[bounce_1.4s_ease-in-out_infinite]">
          <div className="flex flex-col items-center">
            <div className="flex items-baseline text-2xl font-black tracking-tighter leading-none">
              <span className="text-white">L</span>
              <span className="text-[#57cef8]">K</span>
            </div>
            <span className="mt-1 h-0.5 w-8 rounded-full bg-[#57cef8]" />
          </div>
        </div>
      </div>

      {/* Brand title & animated progress bar */}
      <div className="mt-5 flex flex-col items-center">
        <span className="text-sm font-extrabold tracking-widest text-white uppercase">
          L-K Shift
        </span>
        <span className="mt-1 text-[11px] font-medium text-slate-400">
          Smart Attendance & Shift Core
        </span>
        <div className="mt-4 h-1 w-28 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full origin-left animate-[pulse_0.9s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#57cef8] via-white to-[#57cef8]" />
        </div>
      </div>
    </div>
  );
}
