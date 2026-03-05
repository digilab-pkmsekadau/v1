'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, ChevronRight, Loader2, Users } from 'lucide-react';

interface Patient {
  id: string;
  nama: string;
  nik?: string;
  alamat?: string;
  tgl_lahir?: string;
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
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
          <Users size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Data Pasien</h1>
          <p className="text-xs text-slate-400 font-medium">Cari & lihat riwayat pemeriksaan pasien</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-3 mb-4">
        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-teal-400 transition-colors">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari nama atau NIK pasien..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          {loading && <Loader2 size={14} className="animate-spin text-teal-500 flex-shrink-0" />}
        </div>
      </div>

      {/* Patient List */}
      <div className="glass-panel overflow-hidden">
        {loading && patients.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-teal-500" />
          </div>
        ) : patients.length === 0 && searched ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <User size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">Pasien tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {patients.length > 0 && (
              <div className="px-4 py-2 bg-slate-50">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {patients.length} pasien terdaftar
                </span>
              </div>
            )}
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => router.push(`/pasien/${p.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-teal-50/50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-700 font-extrabold text-sm">
                    {p.nama.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{p.nama}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.nik && (
                      <span className="text-[11px] text-slate-400">NIK: {p.nik}</span>
                    )}
                    {p.tgl_lahir && (
                      <span className="text-[11px] text-slate-400">• {p.tgl_lahir}</span>
                    )}
                  </div>
                  {p.alamat && (
                    <div className="text-[11px] text-slate-400 truncate">{p.alamat}</div>
                  )}
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
