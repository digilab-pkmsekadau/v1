'use client';

import { Activity, Eye, EyeOff, Mail, Lock, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // middleware.ts menolak akun tanpa baris user_roles dan mengarahkan ke sini.
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
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT: teal clay brand panel ─────────────────────── */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-10 lg:w-[52%] lg:py-16 lg:px-12"
        style={{ background: 'linear-gradient(160deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%)' }}
      >
        {/* Soft ambient glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-28 -left-20 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Mascot: moderate on mobile, large on desktop */}
          <div className="mb-5 lg:mb-8 flex items-center justify-center animate-clay-float">
            <img
              src="/mascot-lab.png"
              alt="Alat cek gula darah laboratorium"
              width={340}
              height={340}
              className="w-32 h-32 lg:w-[320px] lg:h-[320px] object-contain"
              style={{ filter: 'drop-shadow(0 20px 30px rgba(13,148,136,0.45))' }}
            />
          </div>

          {/* Wordmark + tagline */}
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <span className="clay-icon w-9 h-9">
              <Activity size={18} strokeWidth={2.4} />
            </span>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-white">DigiLab</h1>
          </div>
          <p className="text-white/90 text-sm lg:text-base font-semibold">Sistem Informasi Laboratorium</p>
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase mt-1">Puskesmas Sekadau</p>
          <p className="hidden lg:block text-white/70 text-sm mt-6 max-w-xs leading-relaxed">
            Pencatatan &amp; pelaporan hasil laboratorium yang cepat, akurat, dan terpercaya.
          </p>
        </div>
      </div>

      {/* ── RIGHT: login form ───────────────────────────────── */}
      <div className="clay-bg flex-1 flex flex-col items-center justify-center px-4 py-10 lg:px-12">
        <div className="w-full max-w-sm flex flex-col items-center">

          <form onSubmit={handleLogin} className="clay-card w-full p-7 flex flex-col gap-4">

            <div className="flex items-center justify-center gap-2.5 mb-2">
              <span className="clay-icon clay-icon-brand w-9 h-9">
                <Lock size={17} strokeWidth={2.4} />
              </span>
              <span className="text-slate-600 text-sm font-bold tracking-widest uppercase">Masuk Sistem</span>
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
              <div className="clay-field flex items-center gap-2.5 px-3 py-2.5">
                <span className="clay-icon w-9 h-9 flex-shrink-0">
                  <Mail size={16} strokeWidth={2.4} />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  disabled={loading}
                  className="flex-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
              <div className="clay-field flex items-center gap-2.5 px-3 py-2.5">
                <span className="clay-icon w-9 h-9 flex-shrink-0">
                  <Lock size={16} strokeWidth={2.4} />
                </span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="flex-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="text-slate-400 hover:text-teal-600 cursor-pointer transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-lg p-1"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              aria-label={loading ? 'Memverifikasi...' : 'Masuk ke sistem'}
              className="clay-btn mt-2 w-full py-3.5 font-bold text-sm tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
              ) : (
                <>
                  <span className="clay-icon w-7 h-7 rounded-xl bg-white/25 shadow-none">
                    <LogIn size={15} strokeWidth={2.4} className="text-white" />
                  </span>
                  Masuk Sistem
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-1">
            <p className="text-slate-500 text-xs font-medium">
              DigiLab Puskesmas Sekadau © {new Date().getFullYear()}
            </p>
            <p className="text-slate-400 text-[10px] leading-relaxed max-w-xs mx-auto">
              DigiLab dikembangkan oleh <span className="text-slate-600 font-semibold">Banu Prasetya</span> bersama Analis Laboratorium Kesehatan Puskesmas Sekadau
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
