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
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}
          >
            <TestTubes size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-extrabold text-teal-700 dark:text-teal-400 text-base leading-tight">DigiLab</div>
            <div className="text-xs text-slate-400 font-medium leading-tight">Puskesmas</div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-200"
            title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
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
            className="w-10 h-10 rounded-xl border border-red-100 bg-red-50 flex items-center justify-center hover:bg-red-100 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
            title="Keluar"
          >
            <LogOut size={17} className="text-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
