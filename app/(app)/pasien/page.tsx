'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, ChevronRight, Loader2, Users } from 'lucide-react';

interface Patient {
  id: string;
  nama: string;
  nik?: string;
  jenis_kelamin?: string;
  alamat?: string;
  tgl_lahir?: string;
}

// Generate a consistent gradient from patient name
function getAvatarGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #0d9488, #14b8a6)',
    'linear-gradient(135deg, #2563eb, #3b82f6)',
    'linear-gradient(135deg, #7c3aed, #a855f7)',
    'linear-gradient(135deg, #dc2626, #f43f5e)',
    'linear-gradient(135deg, #d97706, #f59e0b)',
    'linear-gradient(135deg, #059669, #10b981)',
    'linear-gradient(135deg, #0891b2, #06b6d4)',
    'linear-gradient(135deg, #db2777, #ec4899)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export default function PasienPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setPatients([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setPatients(json.data ?? []);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Load semua pasien saat halaman pertama dibuka
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/patients');
        const json = await res.json();
        setPatients(json.data ?? []);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
          <Users size={20} className="text-white relative z-10" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Data Pasien</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Cari & lihat riwayat pemeriksaan pasien</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-3 mb-5">
        <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 transition-all duration-200 focus-within:shadow-md"
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
          }}
        >
          <Search size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari nama atau NIK pasien..."
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
            autoFocus
          />
          {loading && <Loader2 size={14} className="animate-spin text-teal-500 flex-shrink-0" />}
        </div>
      </div>

      {/* Patient List */}
      <div className="glass-panel overflow-hidden">
        {loading && patients.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-teal-500" />
          </div>
        ) : patients.length === 0 && searched ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(148,163,184,0.08), rgba(148,163,184,0.04))' }}
            >
              <User size={30} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Pasien tidak ditemukan</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba gunakan kata kunci lain</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {patients.length > 0 && (
              <div className="px-4 py-2.5"
                style={{ background: 'var(--surface)' }}
              >
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {patients.length} pasien terdaftar
                </span>
              </div>
            )}
            {patients.map((p, i) => (
              <button
                key={p.id}
                onClick={() => router.push(`/pasien/${p.id}`)}
                className="animate-stagger w-full flex items-center gap-3 px-4 py-3.5 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all duration-200 text-left group active:scale-[0.98]"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Avatar with unique gradient */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden"
                  style={{ background: getAvatarGradient(p.nama) }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
                  <span className="text-white font-extrabold text-sm relative z-10">
                    {p.nama.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{p.nama}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.nik && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">NIK: {p.nik}</span>
                    )}
                    {p.jenis_kelamin && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">• {p.jenis_kelamin === 'L' ? 'Laki-Laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : p.jenis_kelamin}</span>
                    )}
                    {p.tgl_lahir && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">• {p.tgl_lahir}</span>
                    )}
                  </div>
                  {p.alamat && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{p.alamat}</div>
                  )}
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0 group-hover:text-teal-500 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all duration-200" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
