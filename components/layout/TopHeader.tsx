'use client';

import { TestTubes, LogOut, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useDarkMode } from '@/hooks/useDarkMode';

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
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#FAF9F6] dark:bg-zinc-950 border-b-2 border-black dark:border-white transition-colors duration-200">
      <div className="flex items-center justify-between gap-3 px-3 h-16 max-w-2xl mx-auto sm:px-4">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="brutal-icon bg-orange-500 border-black dark:border-white">
            <TestTubes size={19} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-black text-black dark:text-white text-base leading-tight tracking-tight">
              DigiLab
            </div>
            <div className="truncate text-[9px] text-gray-500 dark:text-gray-400 font-bold leading-tight tracking-wide uppercase sm:text-[10px]">
              Puskesmas Sekadau
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="brutal-icon bg-white dark:bg-zinc-800 border-black dark:border-white hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark
              ? <Sun size={17} className="text-amber-400" strokeWidth={2.5} />
              : <Moon size={17} className="text-black" strokeWidth={2.5} />
            }
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Keluar dari aplikasi"
            className="brutal-icon bg-rose-400 dark:bg-rose-500 border-black dark:border-white hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
            title="Keluar"
          >
            <LogOut size={17} className="text-black dark:text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
