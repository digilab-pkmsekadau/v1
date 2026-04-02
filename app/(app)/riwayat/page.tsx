'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Activity, FileSpreadsheet, ClipboardList, CalendarDays,
  ChevronDown, BarChart2, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { HistoryRow } from '@/types';
import { getStartOfMonth, getTodayWIB } from '@/lib/utils';
import { exportToExcel, exportMonthlyToExcel } from '@/lib/export';
import HistoryTable from '@/components/dashboard/HistoryTable';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface MonthlyPreview {
  total: number;
  month: string;
  startDate: string;
  endDate: string;
  paramCounts: Record<string, number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
}

export default function RiwayatPage() {
  const today = getTodayWIB();
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(today);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyMonth, setMonthlyMonth] = useState(today.slice(0, 7));
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportingMonthly, setExportingMonthly] = useState(false);
  const [monthlyPreview, setMonthlyPreview] = useState<MonthlyPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const confirm = useConfirm();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?start=${startDate}&end=${endDate}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data.history);
    } catch {
      toast.error('Gagal memuat data riwayat');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Reset preview saat bulan berubah
  useEffect(() => {
    setMonthlyPreview(null);
    setShowPreview(false);
  }, [monthlyMonth]);

  useKeyboardShortcuts({ onRefresh: fetchHistory });

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
      fetchHistory();
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  // Preview dulu sebelum download — fetch data tapi belum download
  const handlePreviewMonthly = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/export/monthly?month=${monthlyMonth}`);
      const json = await res.json();
      if (!json.data || json.data.length === 0) {
        toast.info('Tidak ada data pada bulan tersebut');
        return;
      }
      setMonthlyPreview(json);
      setShowPreview(true);
    } catch {
      toast.error('Gagal memuat preview data');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Download langsung dari data yang sudah di-preview (tanpa fetch ulang)
  const handleMonthlyExport = async () => {
    let dataToExport = monthlyPreview?.data;

    // Jika belum preview, fetch dulu
    if (!dataToExport) {
      setExportingMonthly(true);
      try {
        const res = await fetch(`/api/export/monthly?month=${monthlyMonth}`);
        const json = await res.json();
        if (!json.data || json.data.length === 0) {
          toast.info('Tidak ada data pada bulan tersebut');
          return;
        }
        dataToExport = json.data;
      } catch {
        toast.error('Gagal export rekap bulanan');
        return;
      } finally {
        setExportingMonthly(false);
      }
    }

    setExportingMonthly(true);
    try {
      // Gunakan exportMonthlyToExcel yang support dynamic headers
      exportMonthlyToExcel(dataToExport!, `Rekap_Lab_${monthlyMonth}`);
      toast.success(`${dataToExport!.length} baris berhasil diexport ke Excel`);
    } catch {
      toast.error('Gagal membuat file Excel');
    } finally {
      setExportingMonthly(false);
    }
  };

  // Format label bulan Indo
  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
            <ClipboardList size={20} className="text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Riwayat & Rekap</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Kelola riwayat pemeriksaan dan ekspor laporan</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <RefreshCw size={16} className={`text-teal-600 dark:text-teal-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter */}
      <div className="glass-panel p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={14} className="text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Filter Periode</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-premium" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-premium" />
          </div>
        </div>
      </div>

      {/* Rekap Bulanan — dengan Preview */}
      <div className="glass-panel p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet size={14} className="text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Rekap Semua Parameter (Excel)</h2>
        </div>

        {/* Pilih bulan */}
        <div className="flex gap-2 mb-3">
          <input
            type="month" value={monthlyMonth}
            onChange={e => setMonthlyMonth(e.target.value)}
            className="input-premium flex-1"
          />
          <button
            onClick={handlePreviewMonthly}
            disabled={loadingPreview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 whitespace-nowrap hover:scale-[1.02] active:scale-95"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            {loadingPreview
              ? <RefreshCw size={14} className="animate-spin" />
              : <BarChart2 size={14} />}
            Preview
          </button>
        </div>

        {/* Preview card — muncul setelah klik Preview */}
        {showPreview && monthlyPreview && (
          <div className="animate-stagger rounded-2xl border overflow-hidden mb-3"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            {/* Summary header */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, rgba(13,148,136,0.05), rgba(20,184,166,0.03))' }}
            >
              <div>
                <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  {formatMonthLabel(monthlyPreview.month ?? monthlyMonth)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {monthlyPreview.startDate} s/d {monthlyPreview.endDate}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-teal-600 dark:text-teal-400 counter-animate">
                  {monthlyPreview.total}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  Pasien
                </div>
              </div>
            </div>

            {/* Parameter yang terisi */}
            <div className="px-4 py-3">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                Parameter yang terisi ({Object.keys(monthlyPreview.paramCounts).length} dari 50)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(monthlyPreview.paramCounts).map(([param, count]) => (
                  <div key={param}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: 'rgba(13,148,136,0.08)', color: '#0f766e' }}
                  >
                    <CheckCircle2 size={10} />
                    {param}
                    <span className="text-teal-400 dark:text-teal-500 ml-0.5">({count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Download button */}
            <div className="px-4 pb-4">
              <button
                onClick={handleMonthlyExport}
                disabled={exportingMonthly}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:scale-[1.01] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  boxShadow: '0 6px 24px -4px rgba(13,148,136,0.3)',
                }}
              >
                {exportingMonthly
                  ? <RefreshCw size={15} className="animate-spin" />
                  : <FileSpreadsheet size={15} />}
                Download Excel — {monthlyPreview.total} baris
              </button>
            </div>
          </div>
        )}

        {/* Tombol download langsung (tanpa preview) */}
        {!showPreview && (
          <button
            onClick={handleMonthlyExport}
            disabled={exportingMonthly}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:scale-[1.01] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              boxShadow: '0 6px 24px -4px rgba(13,148,136,0.3)',
            }}
          >
            {exportingMonthly
              ? <RefreshCw size={15} className="animate-spin" />
              : <FileSpreadsheet size={15} />}
            Ekspor Rekap Bulanan
          </button>
        )}

        {/* Toggle preview */}
        {showPreview && (
          <button
            onClick={() => setShowPreview(false)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronDown size={12} className="rotate-180" /> Sembunyikan detail
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="mb-3 flex items-center gap-2">
        <div className="section-badge" style={{ background: 'rgba(100,116,139,0.06)', color: '#475569' }}>
          <Activity size={13} />
          <span>Riwayat Pemeriksaan</span>
        </div>
        {!loading && history.length > 0 && (
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            {history.length} data
          </span>
        )}
      </div>
      <div className="glass-panel overflow-hidden mb-6">
        <HistoryTable data={history} loading={loading} onDelete={handleDelete} />
      </div>
    </div>
  );
}
