'use client';

import { Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';

import EmptyState from '@/components/ui/EmptyState';
import type { HistoryRow } from '@/types';

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

  useEffect(() => {
    setPage(1);
  }, [data]);

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
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border-2 border-black dark:border-white bg-white dark:bg-zinc-900"
          
        >
          <Search size={14} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Cari pasien, no urut, dokter..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            aria-label="Cari pasien, no urut, atau dokter"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black dark:border-white"
              
            >
              <th className="text-left py-3.5 px-3 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">No</th>
              <th className="text-left py-3.5 px-3 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Pasien</th>
              <th className="text-left py-3.5 px-3 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Tgl</th>
              <th className="hidden md:table-cell text-left py-3.5 px-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dokter</th>
              <th className="py-3.5 px-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Aksi</th>
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
                  className="animate-stagger border-b-2 border-black dark:border-white transition-all duration-150 hover:bg-orange-50 dark:hover:bg-zinc-800 group"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(148, 163, 184, 0.02)',
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center justify-center min-w-[44px] h-7 px-2 rounded-lg text-[11px] font-black text-white bg-orange-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                      
                    >
                      {row.no}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-black text-black dark:text-white text-sm leading-tight">{row.nama}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{row.biaya}</div>
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{row.tgl}</td>
                  <td className="hidden md:table-cell py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium">{row.dokter}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Tombol Detail */}
                      <button
                        onClick={() => router.push(`/riwayat/${row.exam_id}`)}
                        aria-label={`Lihat detail pemeriksaan ${row.nama}`}
                        className="w-8 h-8 rounded-lg border-2 border-black dark:border-white flex items-center justify-center cursor-pointer transition-all duration-150 bg-indigo-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        
                        title="Lihat detail"
                      >
                        <Eye size={13} className="text-white" />
                      </button>
                      {/* Tombol Hapus */}
                      <button
                        onClick={() => onDelete(row.exam_id)}
                        aria-label={`Hapus pemeriksaan ${row.nama}`}
                        className="w-8 h-8 rounded-lg border-2 border-black dark:border-white flex items-center justify-center cursor-pointer transition-all duration-150 bg-rose-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        
                        title="Hapus"
                      >
                        <Trash2 size={13} className="text-white" />
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
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{filtered.length} data</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Halaman sebelumnya"
              className="w-8 h-8 rounded-lg border-2 border-black dark:border-white flex items-center justify-center disabled:opacity-30 cursor-pointer transition-all duration-150 bg-white dark:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              
            >
              <ChevronLeft size={14} className="text-slate-500 dark:text-slate-400" />
            </button>
            <span className="text-xs font-black text-black dark:text-white min-w-[50px] text-center">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Halaman selanjutnya"
              className="w-8 h-8 rounded-lg border-2 border-black dark:border-white flex items-center justify-center disabled:opacity-30 cursor-pointer transition-all duration-150 bg-white dark:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              
            >
              <ChevronRight size={14} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

