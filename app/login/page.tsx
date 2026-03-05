'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase';

// Bubbles data: size, left%, delay, duration
const BUBBLES = [
  { size: 10, left: 8,  delay: 0,   dur: 7  },
  { size: 16, left: 20, delay: 1.5, dur: 9  },
  { size: 8,  left: 35, delay: 3,   dur: 6  },
  { size: 20, left: 50, delay: 0.5, dur: 11 },
  { size: 12, left: 65, delay: 2,   dur: 8  },
  { size: 6,  left: 78, delay: 4,   dur: 5  },
  { size: 18, left: 88, delay: 1,   dur: 10 },
  { size: 9,  left: 95, delay: 3.5, dur: 7  },
];

// Particles: size, left%, bottom%, delay, duration, dx
const PARTICLES = [
  { size: 3, left: 5,  bottom: 10, delay: 0,   dur: 12, dx: 30  },
  { size: 2, left: 15, bottom: 25, delay: 2,   dur: 9,  dx: -20 },
  { size: 4, left: 28, bottom: 5,  delay: 1,   dur: 14, dx: 40  },
  { size: 2, left: 42, bottom: 30, delay: 3.5, dur: 10, dx: -30 },
  { size: 3, left: 55, bottom: 15, delay: 0.5, dur: 11, dx: 25  },
  { size: 5, left: 68, bottom: 8,  delay: 2.5, dur: 13, dx: -40 },
  { size: 2, left: 75, bottom: 20, delay: 1.5, dur: 8,  dx: 35  },
  { size: 3, left: 85, bottom: 35, delay: 4,   dur: 15, dx: -25 },
  { size: 4, left: 92, bottom: 12, delay: 0.8, dur: 10, dx: 20  },
  { size: 2, left: 12, bottom: 40, delay: 3,   dur: 12, dx: 30  },
  { size: 3, left: 48, bottom: 45, delay: 1.8, dur: 9,  dx: -15 },
  { size: 2, left: 60, bottom: 50, delay: 2.8, dur: 11, dx: 10  },
];

// DNA strands: left position, delay, duration
const DNA_STRANDS = [
  { left: 5,  delay: 0,   dur: 18 },
  { left: 82, delay: 6,   dur: 22 },
  { left: 45, delay: 12,  dur: 20 },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2d26 50%, #0a1628 100%)' }}
    >
      {/* ── LAB ANIMATION LAYER ─────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        {/* Static glow orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)' }} />

        {/* Scan line sweeping top to bottom */}
        <div className="lab-scan" style={{ animationDelay: '1s', animationDuration: '6s' }} />
        <div className="lab-scan" style={{ animationDelay: '4s', animationDuration: '6s', opacity: 0.35 }} />

        {/* Bubbles rising from bottom */}
        {BUBBLES.map((b, i) => (
          <div
            key={`bubble-${i}`}
            className="lab-bubble"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              bottom: '-5%',
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
            }}
          />
        ))}

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={`particle-${i}`}
            className="lab-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              ['--dx' as string]: `${p.dx}px`,
            }}
          />
        ))}

        {/* DNA Strand SVGs floating upward */}
        {DNA_STRANDS.map((d, i) => (
          <div
            key={`dna-${i}`}
            style={{
              position: 'absolute',
              left: `${d.left}%`,
              bottom: '-30%',
              width: 28,
              animation: `dnaDrift ${d.dur}s linear ${d.delay}s infinite`,
            }}
          >
            <svg viewBox="0 0 28 120" width="28" height="120" fill="none">
              <path
                d="M4 0 Q18 15 4 30 Q18 45 4 60 Q18 75 4 90 Q18 105 4 120"
                stroke="rgba(45,212,191,0.45)" strokeWidth="1.5" fill="none"
              />
              <path
                d="M24 0 Q10 15 24 30 Q10 45 24 60 Q10 75 24 90 Q10 105 24 120"
                stroke="rgba(14,165,233,0.45)" strokeWidth="1.5" fill="none"
              />
              {[15, 30, 45, 60, 75, 90, 105].map((y, ri) => (
                <line key={ri} x1="4" y1={y} x2="24" y2={y}
                  stroke="rgba(45,212,191,0.25)" strokeWidth="1" />
              ))}
            </svg>
          </div>
        ))}

        {/* Molecule atom clusters with orbiting electrons */}
        {[
          { cx: '13%', cy: '28%', delay: 0 },
          { cx: '82%', cy: '67%', delay: 1.2 },
          { cx: '62%', cy: '18%', delay: 2.4 },
        ].map((mol, i) => (
          <div
            key={`mol-${i}`}
            style={{
              position: 'absolute',
              left: mol.cx,
              top: mol.cy,
              width: 48,
              height: 48,
              marginLeft: -24,
              marginTop: -24,
            }}
          >
            {/* Center atom */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 8, height: 8, borderRadius: '50%',
              background: 'rgba(45,212,191,0.5)',
              boxShadow: '0 0 8px rgba(45,212,191,0.5)',
            }} />
            {/* Orbiting electron 1 */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5,
              animation: `orbit ${3 + i}s linear ${mol.delay}s infinite`,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(14,165,233,0.7)' }} />
            </div>
            {/* Orbiting electron 2 */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 4, height: 4, marginLeft: -2, marginTop: -2,
              animation: `orbit ${2.5 + i * 0.5}s linear ${mol.delay + 1}s infinite reverse`,
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(45,212,191,0.6)' }} />
            </div>
            {/* Orbit ring */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 44, height: 44, borderRadius: '50%',
              border: '1px solid rgba(45,212,191,0.12)',
            }} />
          </div>
        ))}

        {/* Pulse rings expanding from center */}
        {[0, 0.8, 1.6].map((d, i) => (
          <div
            key={`ring-${i}`}
            className="lab-pulse-ring"
            style={{
              top: '50%', left: '50%',
              width: 80, height: 80,
              marginLeft: -40, marginTop: -40,
              animationDelay: `${d}s`,
            }}
          />
        ))}
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">

        {/* Logo & Title */}
        <div className="mb-8 flex flex-col items-center animate-float">
          {/* Test tube with glow ring */}
          <div className="mb-4 relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full animate-pulse-glow"
              style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)' }} />
            <div className="absolute w-16 h-16 rounded-full"
              style={{
                border: '1px solid rgba(45,212,191,0.2)',
                animation: 'pulseRing 2s ease-out 0.5s infinite',
              }} />
            <div className="relative w-12 h-28 border-[3px] border-teal-400/80 border-t-0 rounded-b-[24px] overflow-hidden"
              style={{ background: 'rgba(45,212,191,0.05)' }}>
              <div className="absolute bottom-0 left-0 w-full"
                style={{
                  height: '55%',
                  background: 'linear-gradient(to top, #0d9488, #2dd4bf)',
                  boxShadow: '0 0 20px #2dd4bf',
                }} />
              {/* Bubbles inside tube */}
              <div style={{
                position: 'absolute', bottom: '30%', left: '25%',
                width: 4, height: 4, borderRadius: '50%',
                background: 'rgba(255,255,255,0.5)',
                animation: 'bubbleUp 2s ease-in infinite',
              }} />
              <div style={{
                position: 'absolute', bottom: '20%', left: '60%',
                width: 3, height: 3, borderRadius: '50%',
                background: 'rgba(255,255,255,0.4)',
                animation: 'bubbleUp 2.5s ease-in 0.8s infinite',
              }} />
            </div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-14 h-2 bg-teal-400/60 rounded-t" />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity size={22} className="text-teal-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">DigiLab</h1>
          </div>
          <p className="text-teal-200/70 text-sm font-medium">Sistem Informasi Laboratorium</p>
          <p className="text-teal-300/50 text-xs font-semibold tracking-widest uppercase mt-0.5">Puskesmas Sekadau</p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleLogin}
          className="w-full rounded-3xl p-7 border border-white/10 flex flex-col gap-4"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock size={16} className="text-teal-300" />
            <span className="text-white/70 text-sm font-semibold tracking-widest uppercase">Masuk Sistem</span>
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Email</label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 focus-within:border-teal-400 focus-within:bg-white/15 transition-all">
              <Mail size={15} className="text-white/40 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                disabled={loading}
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Password</label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 focus-within:border-teal-400 focus-within:bg-white/15 transition-all">
              <Lock size={15} className="text-white/40 flex-shrink-0" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-2 w-full py-3.5 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white',
              boxShadow: loading ? 'none' : '0 0 28px rgba(13,149,136,0.5)',
            }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
            ) : 'MASUK SISTEM'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-1">
          <p className="text-white/25 text-xs">
            DigiLab Puskesmas Sekadau © {new Date().getFullYear()}
          </p>
          <p className="text-white/20 text-[10px] leading-relaxed max-w-xs mx-auto">
            DigiLab dikembangkan oleh <span className="text-white/35 font-semibold">Banu Prasetya</span> bersama Analis Laboratorium Kesehatan Puskesmas Sekadau
          </p>
        </div>
      </div>
    </div>
  );
}
