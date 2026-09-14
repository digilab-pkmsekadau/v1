'use client';

import { Eye, EyeOff, Mail, Lock, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createSupabaseBrowserClient } from '@/lib/supabase';

function LabLogoMorph() {
  return (
    <svg
      className="lab-logo-mark h-14 w-14 lg:h-24 lg:w-24"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="lab-logo-activity"
        pathLength="1"
        d="M12 61h21l8-17 12 34 11-24 7 7h18"
      />

      <path
        className="lab-logo-pipette"
        pathLength="1"
        d="m27 28 11-11 27 27-11 11zm7-7 27 27M54 55l17 17M68 75l6-6"
      />

      <path
        className="lab-logo-drop"
        d="M75 72c0 0-7 9-7 14a7 7 0 0 0 14 0c0-5-7-14-7-14Z"
      />

      <path
        className="lab-logo-tube"
        pathLength="1"
        d="M42 46h40M48 46v37c0 9 6 14 14 14s14-5 14-14V46"
      />
      <path
        className="lab-logo-liquid"
        d="M50 77c7-5 17 5 24 0v7c0 7-5 11-12 11s-12-4-12-11Z"
      />

      <path
        className="lab-logo-graph"
        pathLength="1"
        d="M17 91V72l18-9 15 8 17-27 15 10 21-27"
      />
      <path className="lab-logo-graph-dot" d="M97 27h6v6" />
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

      {/* ── LEFT: brand panel ─────────────────────── */}
      <div className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-10 lg:w-[52%] lg:py-16 lg:px-12 bg-orange-500 border-b-4 lg:border-b-0 lg:border-r-4 border-black dark:border-white">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border-4 border-white/20" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full border-4 border-white/15" />
          <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full border-4 border-white/10" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6 lg:mb-8 flex items-center justify-center">
            <div className="w-24 h-24 lg:w-40 lg:h-40 rounded-3xl bg-white border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <LabLogoMorph />
            </div>
          </div>

          {/* Wordmark */}
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white uppercase mb-2">DigiLab</h1>
          <p className="text-white/90 text-sm lg:text-lg font-bold uppercase tracking-widest">Sistem Informasi Laboratorium</p>
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase mt-2">Puskesmas Sekadau</p>
          
          <div className="hidden lg:block mt-8 max-w-xs">
            <p className="text-white/80 text-sm leading-relaxed font-medium">
              Pencatatan &amp; pelaporan hasil laboratorium yang cepat, akurat, dan terpercaya.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: login form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 lg:px-12">
        <div className="w-full max-w-sm flex flex-col items-center">

          <form onSubmit={handleLogin} className="brutal-card w-full p-6 flex flex-col gap-4">

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="brutal-icon-sm bg-orange-500 border-black dark:border-white">
                <Lock size={16} strokeWidth={2.5} className="text-white" />
              </span>
              <span className="text-gray-600 dark:text-gray-300 text-sm font-black tracking-widest uppercase">Masuk Sistem</span>
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Email</label>
              <div className="flex items-center gap-2">
                <span className="brutal-icon-sm bg-amber-400 border-black dark:border-white flex-shrink-0">
                  <Mail size={14} strokeWidth={2.5} className="text-black" />
                </span>
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
                <span className="brutal-icon-sm bg-indigo-400 border-black dark:border-white flex-shrink-0">
                  <Lock size={14} strokeWidth={2.5} className="text-black" />
                </span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="brutal-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="brutal-icon-sm bg-gray-200 dark:bg-zinc-700 border-black dark:border-white flex-shrink-0 cursor-pointer hover:bg-gray-300 dark:hover:bg-zinc-600"
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
            <p className="text-gray-400 dark:text-gray-500 text-[10px] leading-relaxed max-w-xs mx-auto font-medium">
              DigiLab dikembangkan oleh <span className="text-gray-600 dark:text-gray-300 font-bold">Banu Prasetya</span> bersama Analis Laboratorium Kesehatan Puskesmas Sekadau
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
