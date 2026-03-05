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
      <div className="p-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex gap-3 mb-3 items-center">
            <div className="skeleton h-4 w-12 rounded" />
            <div className="skeleton h-4 flex-1 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari pasien, no urut, dokter..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">No</th>
              <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Pasien</th>
              <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tgl</th>
              <th className="hidden md:table-cell text-left py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Dokter</th>
              <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center">Aksi</th>
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
                  className={`border-b border-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-teal-50/40`}
                >
                  <td className="py-3 px-3 font-bold text-teal-700 text-xs">{row.no}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800 text-sm leading-tight">{row.nama}</div>
                    <div className="text-xs text-slate-400">{row.biaya}</div>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">{row.tgl}</td>
                  <td className="hidden md:table-cell py-3 px-3 text-xs text-slate-500">{row.dokter}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Tombol Detail */}
                      <button
                        onClick={() => router.push(`/riwayat/${row.exam_id}`)}
                        className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center hover:bg-teal-100 transition-colors group"
                        title="Lihat detail"
                      >
                        <Eye size={13} className="text-teal-500 group-hover:text-teal-700" />
                      </button>
                      {/* Tombol Hapus */}
                      <button
                        onClick={() => onDelete(row.exam_id)}
                        className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors group"
                        title="Hapus"
                      >
                        <Trash2 size={13} className="text-red-400 group-hover:text-red-600" />
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
        <div className="flex items-center justify-between p-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">{filtered.length} data</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft size={14} className="text-slate-500" />
            </button>
            <span className="text-xs font-bold text-slate-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
