'use client';

import { useEffect, useRef } from 'react';

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    const notes = [587.33, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      gain.gain.setValueAtTime(0.001, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.28, now + i * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.38);
    });
  } catch {}
}

export default function LiveNotificationListener() {
  const lastTopIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const unlockAudioAndPush = () => {
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          void Notification.requestPermission();
        }
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') void ctx.resume();
        }
      } catch {}
      window.removeEventListener('pointerdown', unlockAudioAndPush);
    };
    window.addEventListener('pointerdown', unlockAudioAndPush, { once: true });

    const pollNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data.notifications) ? data.notifications : [];
        const newestUnread = list.find((n: { isRead?: boolean }) => !n.isRead);

        if (!initializedRef.current) {
          initializedRef.current = true;
          lastTopIdRef.current = newestUnread ? String(newestUnread.id) : null;
          return;
        }

        if (newestUnread && String(newestUnread.id) !== lastTopIdRef.current) {
          lastTopIdRef.current = String(newestUnread.id);
          playNotificationChime();

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(newestUnread.title || 'L-K Shift', {
              body: newestUnread.message || 'لديك إشعار جديد في النظام',
              icon: '/Logo.png?v=25',
            });
          }
        }
      } catch {}
    };

    void pollNotifications();
    const timer = setInterval(pollNotifications, 12000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pointerdown', unlockAudioAndPush);
    };
  }, []);

  return null;
}
