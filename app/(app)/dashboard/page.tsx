'use client';

import { RefreshCw, TrendingUp, FlaskConical, Dna, Microscope, Download, TestTube, CalendarDays } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { exportToExcel } from '@/lib/export';
import { getStartOfMonth, getTodayWIB } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import type { ExportRow } from '@/types';

const SkeletonCard = () => (
  <div className="brutal-card flex-1 min-w-[45%] p-4">
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
        className="brutal-icon-sm bg-orange-500 border-black dark:border-white hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
      >
        <Download size={13} strokeWidth={2.5} className="text-white" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
          <div className="brutal-card absolute right-0 top-full mt-2 z-50 overflow-hidden min-w-[190px]"
          >
            <div className="px-3 py-2.5 border-b-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-800">
              <div className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                Export: {paramName}
              </div>
              <div className="text-[10px] text-orange-600 dark:text-orange-400 font-bold mt-0.5 flex items-center gap-1">
                <CalendarDays size={11} /> {startDate} s/d {endDate}
              </div>
            </div>
            {options.map((opt) => (
              <button
                key={opt.filterMode}
                onClick={() => { onDownload(paramName, opt.filterMode); setOpenMenu(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold hover:bg-orange-100 dark:hover:bg-zinc-800 ${opt.color} cursor-pointer transition-colors border-b border-gray-200 dark:border-zinc-700 last:border-b-0`}
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
          <h1 className="font-black text-2xl text-black dark:text-white tracking-tight uppercase">Dashboard</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          aria-label="Muat ulang data dashboard"
          className="brutal-icon-lg bg-orange-500 border-black dark:border-white hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px]"
        >
          <RefreshCw size={18} strokeWidth={2.5} className={`text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter */}
      <div className="brutal-card p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="brutal-icon-sm bg-amber-400 border-black dark:border-white">
            <CalendarDays size={14} strokeWidth={2.5} className="text-black" />
          </span>
          <h2 className="font-black text-sm tracking-wide text-black dark:text-white uppercase">Filter Periode</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start-date" className="label-caps text-[10px] font-black text-gray-500 dark:text-gray-400 mb-1.5 block">Dari</label>
            <input
              id="start-date"
              type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="brutal-input"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="label-caps text-[10px] font-black text-gray-500 dark:text-gray-400 mb-1.5 block">Sampai</label>
            <input
              id="end-date"
              type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="brutal-input"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="brutal-card p-4 bg-orange-500! border-black dark:border-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 border-2 border-white flex items-center justify-center">
              <TestTube size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="label-caps text-[10px] text-white/80 font-black">Hari Ini</span>
          </div>
          <div className="font-mono-data text-4xl font-black text-white tracking-tight">
            {loading ? <div className="skeleton h-10 w-16 rounded" /> : (
              <span className="counter-animate">{stats?.today ?? 0}</span>
            )}
          </div>
          <div className="text-xs text-white/70 mt-1 font-bold">Pasien diperiksa</div>
        </div>

        <div className="brutal-card p-4 bg-emerald-500! border-black dark:border-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 border-2 border-white flex items-center justify-center">
              <TrendingUp size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="label-caps text-[10px] text-white/80 font-black">Periode</span>
          </div>
          <div className="font-mono-data text-4xl font-black text-white tracking-tight">
            {loading ? <div className="skeleton h-10 w-16 rounded" /> : (
              <span className="counter-animate">{stats?.filtered ?? 0}</span>
            )}
          </div>
          <div className="text-xs text-white/70 mt-1 font-bold">Total pemeriksaan</div>
        </div>
      </div>

      {/* Chemistry Stats */}
      <div className="section-header">
        <span className="brutal-icon-sm bg-orange-500 border-black dark:border-white">
          <FlaskConical size={15} strokeWidth={2.5} className="text-white" />
        </span>
        <span className="section-title text-black dark:text-white">Kimia Klinik</span>
      </div>
      <div className="brutal-card p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          {loading ? (
            Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.chemistry).map(([label, count], i) => (
              <div key={label}
                className="cat-surface-kimia animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-xl border-2 p-3.5 flex flex-col gap-1.5 hover:-translate-y-0.5 transition-all duration-150 cursor-default"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="label-caps text-[10px] font-black leading-tight text-orange-700 dark:text-orange-400">{label}</div>
                <div className="font-mono-data text-2xl font-black tracking-tight text-orange-600 dark:text-orange-400">
                  <span className="counter-animate">{count}</span>
                </div>
                <div className="label-caps text-[10px] text-orange-500 dark:text-orange-300">pasien</div>
                <button
                  onClick={() => handleDownload(label, 'all_filled')}
                  aria-label={`Unduh data ${label}`}
                  className="brutal-btn-primary flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-[11px] font-black text-white cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <Download size={11} /> Unduh
                </button>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Immunology Stats */}
      <div className="section-header">
        <span className="brutal-icon-sm bg-indigo-400 border-black dark:border-white">
          <Dna size={15} strokeWidth={2.5} className="text-black" />
        </span>
        <span className="section-title text-black dark:text-white">Imunologi</span>
      </div>
      <div className="brutal-card p-4 mb-6">
        <div className="flex flex-wrap gap-3">
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
                    { label: 'Semua data', filterMode: 'all_filled', color: 'text-gray-600 dark:text-gray-300' },
                  ]
                : [
                    { label: 'Positif saja', filterMode: 'positif_only', color: 'text-orange-600 dark:text-orange-400' },
                    { label: 'Negatif saja', filterMode: 'negatif_only', color: 'text-sky-600 dark:text-sky-400' },
                    { label: 'Semua data', filterMode: 'all_filled', color: 'text-gray-600 dark:text-gray-300' },
                  ];
              return (
                <div key={label}
                  className={`animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-xl border-2 ${hasAlert ? 'cat-surface-danger' : 'cat-surface-imuno'} p-3.5 flex flex-col gap-1.5 hover:-translate-y-0.5 transition-all duration-150 cursor-default`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="label-caps text-[10px] font-black text-gray-600 dark:text-gray-300 leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={label} options={menuOptions} openMenu={openMenu} setOpenMenu={setOpenMenu} onDownload={handleDownload} startDate={startDate} endDate={endDate} />
                  </div>
                  <div className="text-sm font-black leading-tight">
                    {isReactive ? (
                      <><span className="text-red-600 dark:text-red-400"><span className="font-mono-data">{obj.pos}</span> Reaktif</span><span className="text-gray-400 dark:text-gray-500 text-xs"> / <span className="font-mono-data">{obj.neg}</span> Non</span></>
                    ) : (
                      <><span className="text-orange-600 dark:text-orange-400"><span className="font-mono-data">{obj.pos}</span> Positif</span><span className="text-gray-400 dark:text-gray-500 text-xs"> / <span className="font-mono-data">{obj.neg}</span> Negatif</span></>
                    )}
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

      {/* Microbiology Stats */}
      <div className="section-header">
        <span className="brutal-icon-sm bg-amber-400 border-black dark:border-white">
          <Microscope size={15} strokeWidth={2.5} className="text-black" />
        </span>
        <span className="section-title text-black dark:text-white">Mikrobiologi &amp; Parasitologi</span>
      </div>
      <div className="brutal-card p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.microbiology).map(([label, obj], i) => {
              const hasAlert = obj.pos > 0;
              const menuOptions = [
                { label: 'Positif saja', filterMode: 'positif_only', color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Negatif saja', filterMode: 'negatif_only', color: 'text-sky-600 dark:text-sky-400' },
                { label: 'Semua data', filterMode: 'all_filled', color: 'text-gray-600 dark:text-gray-300' },
              ];
              return (
                <div key={label}
                  className={`animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-xl border-2 ${hasAlert ? 'cat-surface-danger' : 'cat-surface-mikro'} p-3.5 flex flex-col gap-1.5 hover:-translate-y-0.5 transition-all duration-150 cursor-default`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="label-caps text-[10px] font-black text-gray-600 dark:text-gray-300 leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={`micro_${label}`} options={menuOptions} openMenu={openMenu} setOpenMenu={setOpenMenu} onDownload={handleDownload} startDate={startDate} endDate={endDate} />
                  </div>
                  <div className="text-sm font-black leading-tight">
                    <span className={hasAlert ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}><span className="font-mono-data">{obj.pos}</span> Positif</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs"> / <span className="font-mono-data">{obj.neg}</span> Negatif</span>
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
