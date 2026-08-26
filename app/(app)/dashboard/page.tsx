'use client';

import { RefreshCw, TrendingUp, FlaskConical, Dna, Microscope, Download, TestTube, CalendarDays } from 'lucide-react';
import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { toast } from 'sonner';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { exportToExcel } from '@/lib/export';
import { getStartOfMonth, getTodayWIB } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import type { ExportRow } from '@/types';



const SkeletonCard = () => (
  <div className="flex-1 min-w-[45%] rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
    <div className="skeleton h-3 w-24 mb-3 rounded" />
    <div className="skeleton h-8 w-16 mb-2 rounded" />
    <div className="skeleton h-7 w-20 rounded-full" />
  </div>
);

function DownloadMenu({
  menuKey,
  options,
  openMenu,
  setOpenMenu,
  onDownload,
  startDate,
  endDate,
}: {
  menuKey: string;
  options: { label: string; filterMode: string; color: string }[];
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onDownload: (param: string, filterMode: string) => void;
  startDate: string;
  endDate: string;
}) {
  const isOpen = openMenu === menuKey;
  const paramName = menuKey.replace('micro_', '');
  return (
    <div className="relative">
      <button
        onClick={() => setOpenMenu(isOpen ? null : menuKey)}
        aria-label={`Unduh data ${paramName}`}
        className="clay-icon clay-icon-brand clay-icon-sm w-8 h-8 flex-shrink-0 cursor-pointer active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Download size={13} strokeWidth={2.4} className="text-white" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 rounded-2xl shadow-xl border overflow-hidden min-w-[190px]"
            style={{
              background: 'var(--surface)',
              backdropFilter: 'blur(20px)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Export: {paramName}
              </div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5 flex items-center gap-1">
                <CalendarDays size={11} /> {startDate} s/d {endDate}
              </div>
            </div>
            {options.map((opt) => (
              <button
                key={opt.filterMode}
                onClick={() => { onDownload(paramName, opt.filterMode); setOpenMenu(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 ${opt.color} cursor-pointer transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset`}
              >
                <Download size={13} /> {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const today = getTodayWIB();
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(today);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const dashboardRes = await fetch(`/api/dashboard?start=${startDate}&end=${endDate}`);
      if (!dashboardRes.ok) throw new Error();
      const dashboardData = await dashboardRes.json();
      setStats(dashboardData.stats);
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

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          aria-label="Muat ulang data dashboard"
          className="clay-icon clay-icon-brand w-11 h-11 cursor-pointer hover:scale-105 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RefreshCw size={17} strokeWidth={2.4} className={`text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter */}
      <div className="glass-panel p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="clay-icon clay-icon-brand clay-icon-sm w-7 h-7">
            <CalendarDays size={14} strokeWidth={2.4} className="text-white" />
          </span>
          <h2 className="font-display text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">Filter Periode</h2>
        </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start-date" className="label-caps text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Dari</label>
              <input
                id="start-date"
                type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="input-premium bg-white dark:bg-slate-900 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="label-caps text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Sampai</label>
              <input
                id="end-date"
                type="date" value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="input-premium bg-white dark:bg-slate-900 shadow-sm"
              />
            </div>
          </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-stat card-stat-primary p-5" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <TestTube size={17} className="text-white" />
            </div>
            <span className="label-caps text-[10px] text-white/75">Hari Ini</span>
          </div>
          <div className="font-mono-data text-4xl font-semibold text-white relative z-10 tracking-tight">
            {loading ? <div className="skeleton h-10 w-16 rounded" /> : (
              <span className="counter-animate">{stats?.today ?? 0}</span>
            )}
          </div>
          <div className="text-xs text-white/55 mt-1 relative z-10 font-medium">Pasien diperiksa</div>
        </div>

        <div className="card-stat card-stat-cyan p-5" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <TrendingUp size={17} className="text-white" />
            </div>
            <span className="label-caps text-[10px] text-white/75">Periode</span>
          </div>
          <div className="font-mono-data text-4xl font-semibold text-white relative z-10 tracking-tight">
            {loading ? <div className="skeleton h-10 w-16 rounded" /> : (
              <span className="counter-animate">{stats?.filtered ?? 0}</span>
            )}
          </div>
          <div className="text-xs text-white/55 mt-1 relative z-10 font-medium">Total pemeriksaan</div>
        </div>
      </div>

      {/* Chemistry Stats */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="clay-icon clay-icon-cat clay-icon-sm w-8 h-8" style={{ '--clay-a': '#14b8a6', '--clay-b': '#0d9488' } as CSSProperties}>
          <FlaskConical size={15} strokeWidth={2.3} className="text-white" />
        </span>
        <span className="font-display text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">Kimia Klinik</span>
      </div>
      <div className="glass-panel p-4 mb-6">
        <div className="flex flex-wrap gap-2.5">
          {loading ? (
            Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.chemistry).map(([label, count], i) => (
              <div key={label}
                className="cat-surface-kimia animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-2xl border p-3.5 flex flex-col gap-1.5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="label-caps text-[10px] font-bold leading-tight" style={{ color: 'var(--cat-kimia)' }}>{label}</div>
                <div className="font-mono-data text-2xl font-semibold tracking-tight" style={{ color: 'var(--cat-kimia)' }}>
                  <span className="counter-animate">{count}</span>
                </div>
                <div className="label-caps text-[10px]" style={{ color: 'color-mix(in srgb, var(--cat-kimia) 70%, transparent)' }}>pasien</div>
                <button
                  onClick={() => handleDownload(label, 'all_filled')}
                  aria-label={`Unduh data ${label}`}
                  className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-[11px] font-bold text-white cursor-pointer transition-all hover:opacity-90 active:scale-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{ background: 'var(--grad-kimia)' }}
                >
                  <Download size={11} /> Unduh
                </button>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Immunology Stats */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="clay-icon clay-icon-cat clay-icon-sm w-8 h-8" style={{ '--clay-a': '#a855f7', '--clay-b': '#7c3aed' } as CSSProperties}>
          <Dna size={15} strokeWidth={2.3} className="text-white" />
        </span>
        <span className="font-display text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">Imunologi</span>
      </div>
      <div className="glass-panel p-4 mb-6">
        <div className="flex flex-wrap gap-2.5">
          {loading ? (
            Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.immunology).map(([label, obj], i) => {
              const hasAlert = obj.pos > 0;
              const isReactive = obj.type === 'reactive';
              const menuOptions = isReactive
                ? [
                    { label: 'Reaktif saja', filterMode: 'reaktif_only', color: 'text-red-600 dark:text-red-400' },
                    { label: 'Non Reaktif saja', filterMode: 'non_reaktif_only', color: 'text-sky-600 dark:text-sky-400' },
                    { label: 'Semua data', filterMode: 'all_filled', color: 'text-slate-600 dark:text-slate-300' },
                  ]
                : [
                    { label: 'Positif saja', filterMode: 'positif_only', color: 'text-orange-600 dark:text-orange-400' },
                    { label: 'Negatif saja', filterMode: 'negatif_only', color: 'text-sky-600 dark:text-sky-400' },
                    { label: 'Semua data', filterMode: 'all_filled', color: 'text-slate-600 dark:text-slate-300' },
                  ];
              return (
                <div key={label}
                  className={`animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-2xl border ${hasAlert ? 'cat-surface-danger' : 'cat-surface-imuno'} p-3.5 flex flex-col gap-1.5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="label-caps text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={label} options={menuOptions} openMenu={openMenu} setOpenMenu={setOpenMenu} onDownload={handleDownload} startDate={startDate} endDate={endDate} />
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    {isReactive ? (
                      <><span className="text-red-600 dark:text-red-400"><span className="font-mono-data">{obj.pos}</span> Reaktif</span><span className="text-slate-400 dark:text-slate-500 text-xs"> / <span className="font-mono-data">{obj.neg}</span> Non</span></>
                    ) : (
                      <><span className="text-orange-600 dark:text-orange-400"><span className="font-mono-data">{obj.pos}</span> Positif</span><span className="text-slate-400 dark:text-slate-500 text-xs"> / <span className="font-mono-data">{obj.neg}</span> Negatif</span></>
                    )}
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

      {/* Microbiology Stats */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="clay-icon clay-icon-cat clay-icon-sm w-8 h-8" style={{ '--clay-a': '#f59e0b', '--clay-b': '#d97706' } as CSSProperties}>
          <Microscope size={15} strokeWidth={2.3} className="text-white" />
        </span>
        <span className="font-display text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">Mikrobiologi &amp; Parasitologi</span>
      </div>
      <div className="glass-panel p-4 mb-6">
        <div className="flex flex-wrap gap-2.5">
          {loading ? (
            Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.microbiology).map(([label, obj], i) => {
              const hasAlert = obj.pos > 0;
              const menuOptions = [
                { label: 'Positif saja', filterMode: 'positif_only', color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Negatif saja', filterMode: 'negatif_only', color: 'text-sky-600 dark:text-sky-400' },
                { label: 'Semua data', filterMode: 'all_filled', color: 'text-slate-600 dark:text-slate-300' },
              ];
              return (
                <div key={label}
                  className={`animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-2xl border ${hasAlert ? 'cat-surface-danger' : 'cat-surface-mikro'} p-3.5 flex flex-col gap-1.5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="label-caps text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={`micro_${label}`} options={menuOptions} openMenu={openMenu} setOpenMenu={setOpenMenu} onDownload={handleDownload} startDate={startDate} endDate={endDate} />
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    <span style={{ color: hasAlert ? 'var(--danger)' : 'var(--cat-mikro)' }}><span className="font-mono-data">{obj.pos}</span> Positif</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs"> / <span className="font-mono-data">{obj.neg}</span> Negatif</span>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

    </div>
  );
}
