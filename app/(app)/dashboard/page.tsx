'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, Activity, FlaskConical, Dna, Microscope, Download, FileSpreadsheet, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardStats, HistoryRow } from '@/types';
import { getStartOfMonth, getTodayWIB } from '@/lib/utils';
import { exportToExcel } from '@/lib/export';
import { ExportRow } from '@/types';
import HistoryTable from '@/components/dashboard/HistoryTable';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function DashboardPage() {
  const today = getTodayWIB();
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(today);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [monthlyMonth, setMonthlyMonth] = useState(today.slice(0, 7));
  const [exportingMonthly, setExportingMonthly] = useState(false);
  const confirm = useConfirm();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?start=${startDate}&end=${endDate}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStats(data.stats);
      setHistory(data.history);
    } catch {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Keyboard shortcuts
  useKeyboardShortcuts({ onRefresh: fetchDashboard });

  const handleDelete = async (examId: string) => {
    const ok = await confirm({
      title: 'Hapus Data Pemeriksaan?',
      message: 'Data yang dihapus tidak dapat dikembalikan. Yakin ingin menghapus?',
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
      icon: 'trash',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/examinations/${examId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Data berhasil dihapus');
      fetchDashboard();
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const handleDownload = async (param: string, filterMode: string) => {
    try {
      toast.loading('Menyiapkan data export...');
      const res = await fetch(
        `/api/export?param=${encodeURIComponent(param)}&filter=${filterMode}&start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      toast.dismiss();
      if (!data.data || data.data.length === 0) {
        toast.info('Tidak ada data untuk filter tersebut');
        return;
      }
      exportToExcel(data.data as ExportRow[], `Laporan_${param}_${filterMode}_${startDate}`);
      toast.success(`${data.data.length} baris data diexport`);
    } catch {
      toast.dismiss();
      toast.error('Gagal export data');
    }
  };

  const handleMonthlyExport = async () => {
    setExportingMonthly(true);
    try {
      toast.loading('Menyiapkan rekap bulanan...');
      const res = await fetch(`/api/export/monthly?month=${monthlyMonth}`);
      const data = await res.json();
      toast.dismiss();
      if (!data.data || data.data.length === 0) {
        toast.info('Tidak ada data pada bulan tersebut');
        return;
      }
      exportToExcel(data.data, `Rekap_Lab_${monthlyMonth}`);
      toast.success(`${data.data.length} baris berhasil diexport`);
    } catch {
      toast.dismiss();
      toast.error('Gagal export rekap bulanan');
    } finally {
      setExportingMonthly(false);
    }
  };

  const SkeletonCard = () => (
    <div className="flex-1 min-w-[45%] rounded-2xl border border-slate-100 p-4">
      <div className="skeleton h-3 w-24 mb-3 rounded" />
      <div className="skeleton h-8 w-16 mb-2 rounded" />
      <div className="skeleton h-7 w-20 rounded-full" />
    </div>
  );

  // Komponen download popup per card
  const DownloadMenu = ({
    menuKey,
    options,
  }: {
    menuKey: string;
    options: { label: string; filterMode: string; color: string }[];
  }) => {
    const isOpen = openMenu === menuKey;
    return (
      <div className="relative">
        <button
          onClick={() => setOpenMenu(isOpen ? null : menuKey)}
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-teal-100 hover:text-teal-700 text-slate-500 transition-colors"
        >
          <Download size={12} />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
            <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-w-[170px]">
              <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Pilih Download
              </div>
              {options.map((opt) => (
                <button
                  key={opt.filterMode}
                  onClick={() => { handleDownload(menuKey.replace('micro_', ''), opt.filterMode); setOpenMenu(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 ${opt.color}`}
                >
                  <Download size={13} /> {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-400 font-medium">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="w-10 h-10 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={16} className={`text-teal-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter */}
      <div className="glass-panel p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-teal-500" />
          <h2 className="text-sm font-extrabold text-slate-700">Filter Periode</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Dari Tanggal</label>
            <input
              type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Sampai Tanggal</label>
            <input
              type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
        {/* Rekap Bulanan */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Rekap Semua Parameter</label>
          <div className="flex gap-2">
            <input
              type="month" value={monthlyMonth}
              onChange={e => setMonthlyMonth(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400"
            />
            <button
              onClick={handleMonthlyExport}
              disabled={exportingMonthly}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}
            >
              {exportingMonthly
                ? <RefreshCw size={13} className="animate-spin" />
                : <FileSpreadsheet size={13} />}
              Rekap Bulanan
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card-stat-teal p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <TestTube size={16} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white/80 uppercase tracking-wide">Hari Ini</span>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? <div className="skeleton h-8 w-16 rounded" /> : stats?.today ?? 0}
          </div>
          <div className="text-xs text-white/60 mt-1">Pasien diperiksa</div>
        </div>
        <div className="card-stat-blue p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white/80 uppercase tracking-wide">Periode Ini</span>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? <div className="skeleton h-8 w-16 rounded" /> : stats?.filtered ?? 0}
          </div>
          <div className="text-xs text-white/60 mt-1">Total pemeriksaan</div>
        </div>
      </div>

      {/* Chemistry Stats */}
      <div className="mb-3 flex items-center gap-2">
        <div className="section-badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
          <FlaskConical size={13} />
          <span>Kimia Klinik</span>
        </div>
      </div>
      <div className="glass-panel p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {loading ? (
            Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.chemistry).map(([label, count]) => (
              <div key={label}
                className="flex-1 min-w-[calc(50%-4px)] rounded-2xl border border-blue-100 bg-blue-50/50 p-3 flex flex-col gap-1.5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-default">
                <div className="text-[10px] font-bold text-blue-700/70 uppercase leading-tight">{label}</div>
                <div className="text-2xl font-extrabold text-blue-600">{count}</div>
                <div className="text-[10px] text-blue-400">pasien</div>
                <button
                  onClick={() => handleDownload(label, 'all_filled')}
                  className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                >
                  <Download size={11} /> Unduh
                </button>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Immunology Stats */}
      <div className="mb-3 flex items-center gap-2">
        <div className="section-badge" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
          <Dna size={13} />
          <span>Imunologi</span>
        </div>
      </div>
      <div className="glass-panel p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {loading ? (
            Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.immunology).map(([label, obj]) => {
              const hasAlert = obj.pos > 0;
              const isReactive = obj.type === 'reactive';
              const menuOptions = isReactive
                ? [
                    { label: 'Reaktif saja', filterMode: 'reaktif_only', color: 'text-red-600' },
                    { label: 'Non Reaktif saja', filterMode: 'non_reaktif_only', color: 'text-sky-600' },
                    { label: 'Semua data', filterMode: 'all_filled', color: 'text-slate-600' },
                  ]
                : [
                    { label: 'Positif saja', filterMode: 'positif_only', color: 'text-orange-600' },
                    { label: 'Negatif saja', filterMode: 'negatif_only', color: 'text-sky-600' },
                    { label: 'Semua data', filterMode: 'all_filled', color: 'text-slate-600' },
                  ];
              return (
                <div key={label}
                  className={`flex-1 min-w-[calc(50%-4px)] rounded-2xl border ${hasAlert ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'} p-3 flex flex-col gap-1.5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-default`}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={label} options={menuOptions} />
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    {isReactive ? (
                      <><span className="text-red-600">{obj.pos} Reaktif</span><span className="text-slate-400 text-xs"> / {obj.neg} Non</span></>
                    ) : (
                      <><span className="text-orange-600">{obj.pos} Positif</span><span className="text-slate-400 text-xs"> / {obj.neg} Negatif</span></>
                    )}
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

      {/* Microbiology Stats */}
      <div className="mb-3 flex items-center gap-2">
        <div className="section-badge" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}>
          <Microscope size={13} />
          <span>Mikrobiologi &amp; Parasitologi</span>
        </div>
      </div>
      <div className="glass-panel p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {loading ? (
            Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.microbiology).map(([label, obj]) => {
              const hasAlert = obj.pos > 0;
              const menuOptions = [
                { label: 'Positif saja', filterMode: 'positif_only', color: 'text-amber-600' },
                { label: 'Negatif saja', filterMode: 'negatif_only', color: 'text-sky-600' },
                { label: 'Semua data', filterMode: 'all_filled', color: 'text-slate-600' },
              ];
              return (
                <div key={label}
                  className={`flex-1 min-w-[calc(50%-4px)] rounded-2xl border ${hasAlert ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'} p-3 flex flex-col gap-1.5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-default`}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={`micro_${label}`} options={menuOptions} />
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    <span className="text-amber-700">{obj.pos} Positif</span>
                    <span className="text-slate-400 text-xs"> / {obj.neg} Negatif</span>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

      {/* History Table */}
      <div className="mb-3 flex items-center gap-2">
        <div className="section-badge" style={{ background: 'rgba(100,116,139,0.1)', color: '#475569' }}>
          <Activity size={13} />
          <span>Riwayat Pemeriksaan</span>
        </div>
      </div>
      <div className="glass-panel overflow-hidden mb-2">
        <HistoryTable data={history} loading={loading} onDelete={handleDelete} />
      </div>
    </div>
  );
}
