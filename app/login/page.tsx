'use client';

import { Eye, EyeOff, Mail, Lock, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createSupabaseBrowserClient } from '@/lib/supabase';

function LabMark() {
  // Logo statis: tabung + grafik tren naik. Tanpa animasi (MOTION 1, R-19).
  return (
    <svg
      className="h-14 w-14 lg:h-20 lg:w-20"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <rect x="30" y="14" width="26" height="92" rx="10" stroke="#0f172a" strokeWidth="6" />
      <rect x="36" y="52" width="14" height="48" rx="5" fill="#0d9488" stroke="none" />
      <polyline points="66,84 82,64 94,70 108,44" stroke="#f97316" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="108" cy="44" r="5" fill="#f97316" stroke="none" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'no_access') {
      toast.error('Akun Anda belum diberi akses. Hubungi admin.');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message === 'Invalid login credentials'
          ? 'Email atau password salah'
          : error.message
        );
        return;
      }

      toast.success('Berhasil masuk!');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Koneksi bermasalah. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF9F6] dark:bg-zinc-950">

      {/* Panel identitas: teal klinis, tanpa dekorasi mengambang */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-10 lg:w-[52%] lg:py-16 lg:px-12 bg-teal-700 border-b-4 lg:border-b-0 lg:border-r-4 border-black dark:border-white">
        <div className="flex flex-col items-center">
          <div className="mb-6 lg:mb-8 flex items-center justify-center">
            <div className="w-24 h-24 lg:w-36 lg:h-36 rounded-3xl bg-white border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <LabMark />
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white uppercase mb-2">DigiLab</h1>
          <p className="text-white/90 text-sm lg:text-lg font-bold uppercase tracking-widest">Sistem Informasi Laboratorium</p>
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase mt-2">Puskesmas Sekadau</p>

          <p className="hidden lg:block mt-8 max-w-xs text-white/80 text-sm leading-relaxed font-medium">
            Catat hasil lab, pantau tren pasien, dan unduh rekap. Satu alur, tanpa kertas tercecer.
          </p>
        </div>
      </div>

      {/* ── RIGHT: login form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 lg:px-12">
        <div className="w-full max-w-sm flex flex-col items-center">

          <form onSubmit={handleLogin} className="brutal-card w-full p-6 flex flex-col gap-4">

            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock size={16} strokeWidth={2.5} className="text-teal-700 dark:text-teal-400" aria-hidden="true" />
              <span className="text-gray-600 dark:text-gray-300 text-sm font-black tracking-widest uppercase">Masuk Sistem</span>
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Email</label>
              <div className="flex items-center gap-2">
                <Mail size={14} strokeWidth={2.5} className="text-teal-700 dark:text-teal-400 flex-shrink-0" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  disabled={loading}
                  className="brutal-input flex-1"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Password</label>
              <div className="flex items-center gap-2">
                <Lock size={14} strokeWidth={2.5} className="text-teal-700 dark:text-teal-400 flex-shrink-0" aria-hidden="true" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Kata sandi"
                  autoComplete="current-password"
                  disabled={loading}
                  className="brutal-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={showPass}
                >
                  {showPass ? <EyeOff size={14} className="text-black dark:text-white" /> : <Eye size={14} className="text-black dark:text-white" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              aria-label={loading ? 'Memverifikasi...' : 'Masuk ke sistem'}
              className="brutal-btn brutal-btn-primary w-full mt-2 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
              ) : (
                <>
                  <LogIn size={16} strokeWidth={2.5} />
                  Masuk Sistem
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-1">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold">
              DigiLab Puskesmas Sekadau © {new Date().getFullYear()}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed max-w-xs mx-auto font-medium">
              Aplikasi internal Puskesmas Sekadau. Akun dibuat oleh admin, bukan pendaftaran mandiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
