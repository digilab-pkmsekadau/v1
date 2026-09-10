'use client';

import { Search, User, ChevronRight, ChevronLeft, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Patient {
  id: string;
  nama: string;
  nik?: string;
  jenis_kelamin?: string;
  alamat?: string;
  tgl_lahir?: string;
}

const PAGE_SIZE = 25;

// Daftar nomor halaman ringkas: 1 ... (aktif-1, aktif, aktif+1) ... terakhir
function pageNumbers(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('gap');
    out.push(sorted[i]);
  }
  return out;
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const q = query.trim();
    const shouldSearch = q.length >= 2;
    const delay = shouldSearch ? 400 : 0;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
        if (shouldSearch) params.set('q', q);
        const res = await fetch(`/api/patients?${params.toString()}`);
        const json = await res.json();
        setPatients(json.data ?? []);
        setTotal(json.total ?? 0);
        setTotalPages(json.totalPages ?? 1);
        setSearched(true);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, page]);

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="brutal-icon-lg bg-orange-500 border-black dark:border-white"
          >
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
          <Users size={20} className="text-white relative z-10" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white tracking-tight uppercase">Data Pasien</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">Cari & lihat riwayat pemeriksaan pasien</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-2xl p-3 mb-5" style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-900"
          
        >
          <Search size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Cari nama atau NIK pasien..."
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
            autoFocus
          />
          {loading && <Loader2 size={14} className="animate-spin text-teal-500 flex-shrink-0" />}
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-2xl overflow-hidden" style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>
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
          <div>
            {patients.length > 0 && (
              <div className="px-4 py-2.5"
                style={{ background: 'var(--surface)' }}
              >
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {total} pasien terdaftar — halaman {page} dari {totalPages}
                </span>
              </div>
            )}
            {patients.map((p, i) => (
              <button
                key={p.id}
                onClick={() => router.push(`/pasien/${p.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50 dark:hover:bg-zinc-800 text-left group border-b-2 border-black dark:border-white last:border-b-0"

              >
                {/* Avatar with unique gradient */}
                <div className="w-11 h-11 rounded-xl border-2 border-black dark:border-white flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
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
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0 group-hover:text-teal-500 dark:group-hover:text-teal-400 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Paginasi */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            aria-label="Halaman sebelumnya"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black uppercase border-2 border-black dark:border-white bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] disabled:opacity-40"
            
          >
            <ChevronLeft size={14} /> Prev
          </button>

          {pageNumbers(page, totalPages).map((n, i) =>
            n === 'gap' ? (
              <span key={`gap-${i}`} className="px-1.5 text-xs text-slate-400">…</span>
            ) : (
              <button
                key={n}
                onClick={() => setPage(n)}
                disabled={false}
                aria-current={n === page ? 'page' : undefined}
                className={`min-w-9 px-3 py-2 rounded-xl text-xs font-bold ${
                  n === page
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                style={n === page ? { background: '#f97316', borderColor: 'black' } : {}}
              >
                {n}
              </button>
            )
          )}

          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            aria-label="Halaman berikutnya"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black uppercase border-2 border-black dark:border-white bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] disabled:opacity-40"
            
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

