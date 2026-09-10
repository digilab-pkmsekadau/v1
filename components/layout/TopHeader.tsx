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
      <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <TestTubes size={19} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-black text-black dark:text-white text-base leading-tight tracking-tight">
              DigiLab
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-tight tracking-wide uppercase">
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
            className="w-10 h-10 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-zinc-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
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
            className="w-10 h-10 rounded-xl border-2 border-black dark:border-white bg-rose-400 dark:bg-rose-500 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
            title="Keluar"
          >
            <LogOut size={17} className="text-black dark:text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
