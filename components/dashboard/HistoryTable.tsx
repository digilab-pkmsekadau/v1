'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { HistoryRow } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  data: HistoryRow[];
  loading: boolean;
  onDelete: (examId: string) => void;
}

const PAGE_SIZE = 10;

export default function HistoryTable({ data, loading, onDelete }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return data;
    return data.filter(row =>
      row.nama.toLowerCase().includes(q) ||
      row.no.toLowerCase().includes(q) ||
      row.dokter.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  if (loading) {
    return (
      <div className="p-5">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex gap-3 mb-3.5 items-center" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="skeleton h-4 w-12 rounded-lg" />
            <div className="skeleton h-4 flex-1 rounded-lg" />
            <div className="skeleton h-4 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="p-3 border-b border-slate-100/80 dark:border-slate-800/50">
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all duration-200 focus-within:shadow-sm"
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
          }}
        >
          <Search size={14} className="text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari pasien, no urut, dokter..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100/80 dark:border-slate-800/40"
              style={{ background: 'var(--surface)' }}
            >
              <th className="text-left py-3.5 px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No</th>
              <th className="text-left py-3.5 px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pasien</th>
              <th className="text-left py-3.5 px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tgl</th>
              <th className="hidden md:table-cell text-left py-3.5 px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dokter</th>
              <th className="py-3.5 px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    type={search ? 'no-search' : 'no-data'}
                    message={search
                      ? `Tidak ada data untuk pencarian "${search}"`
                      : 'Belum ada pemeriksaan yang tercatat pada periode ini.'}
                  />
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={row.exam_id}
                  className="animate-stagger border-b border-slate-50 dark:border-slate-800/30 transition-all duration-200 hover:bg-teal-50/30 dark:hover:bg-teal-950/15 group"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(148, 163, 184, 0.02)',
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-lg text-[11px] font-bold text-teal-700 dark:text-teal-400"
                      style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(20,184,166,0.05))' }}
                    >
                      {row.no}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{row.nama}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{row.biaya}</div>
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{row.tgl}</td>
                  <td className="hidden md:table-cell py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium">{row.dokter}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Tombol Detail */}
                      <button
                        onClick={() => router.push(`/riwayat/${row.exam_id}`)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
                        style={{
                          background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(20,184,166,0.05))',
                          border: '1px solid rgba(13,148,136,0.12)',
                        }}
                        title="Lihat detail"
                      >
                        <Eye size={13} className="text-teal-600 dark:text-teal-400" />
                      </button>
                      {/* Tombol Hapus */}
                      <button
                        onClick={() => onDelete(row.exam_id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
                        style={{
                          background: 'linear-gradient(135deg, rgba(220,38,38,0.06), rgba(239,68,68,0.04))',
                          border: '1px solid rgba(220,38,38,0.10)',
                        }}
                        title="Hapus"
                      >
                        <Trash2 size={13} className="text-red-400 dark:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3.5 border-t border-slate-100/80 dark:border-slate-800/40">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">{filtered.length} data</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-90"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <ChevronLeft size={14} className="text-slate-500 dark:text-slate-400" />
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[50px] text-center">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-90"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <ChevronRight size={14} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
