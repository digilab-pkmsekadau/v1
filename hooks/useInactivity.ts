'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 menit
const WARNING_BEFORE_MS = 60 * 1000;          // warning 1 menit sebelum logout

export function useInactivity() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warnToastRef = useRef<string | number | null>(null);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    toast.info('Sesi berakhir karena tidak aktif');
    router.push('/login');
    router.refresh();
  }, [router]);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (warnToastRef.current) toast.dismiss(warnToastRef.current);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      warnToastRef.current = toast.warning(
        '⚠️ Sesi akan berakhir dalam 1 menit karena tidak ada aktivitas',
        { duration: WARNING_BEFORE_MS }
      );
    }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS);

    // Set logout timer
    timerRef.current = setTimeout(logout, INACTIVITY_LIMIT_MS);
  }, [logout]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    const handleActivity = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimer(); // Start on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimer]);
}
