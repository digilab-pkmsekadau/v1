'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TestTubes, LogOut, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function TopHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { isDark, toggle } = useDarkMode();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Keluar dari DigiLab?',
      message: 'Sesi kamu akan diakhiri. Pastikan semua data sudah tersimpan.',
      confirmLabel: 'Ya, Keluar',
      cancelLabel: 'Batal',
      variant: 'warning',
      icon: 'logout',
    });
    if (!ok) return;

    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Berhasil keluar');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Gagal logout');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: isDark
          ? 'rgba(11, 17, 32, 0.78)'
          : 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: isDark
          ? '1px solid rgba(148, 163, 184, 0.06)'
          : '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 1px 12px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
            <TestTubes size={19} className="text-white relative z-10" strokeWidth={2.3} />
          </div>
          <div>
            <div className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-teal-500 dark:from-teal-400 dark:to-teal-300 text-base leading-tight tracking-tight">
              DigiLab
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-tight tracking-wide">
              Puskesmas Sekadau
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90"
            style={{
              background: isDark
                ? 'rgba(148, 163, 184, 0.08)'
                : 'rgba(241, 245, 249, 0.8)',
              border: isDark
                ? '1px solid rgba(148, 163, 184, 0.1)'
                : '1px solid rgba(226, 232, 240, 0.6)',
            }}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark
              ? <Sun size={17} className="text-amber-400" />
              : <Moon size={17} className="text-slate-500" />
            }
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90 disabled:opacity-50"
            style={{
              background: isDark
                ? 'rgba(220, 38, 38, 0.08)'
                : 'rgba(254, 242, 242, 0.8)',
              border: isDark
                ? '1px solid rgba(220, 38, 38, 0.12)'
                : '1px solid rgba(254, 202, 202, 0.5)',
            }}
            title="Keluar"
          >
            <LogOut size={17} className="text-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
