'use client';

import { RefreshCw, TrendingUp, FlaskConical, Dna, Microscope, Download, TestTube, ChevronRight, CalendarDays, BarChart3, PieChart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'sonner';

import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { exportToExcel } from '@/lib/export';
import { getStartOfMonth, getTodayWIB } from '@/lib/utils';
import type { DashboardStats, HistoryRow, MonthlyVisit } from '@/types';
import type { ExportRow } from '@/types';


const COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#dc2626', '#f97316', '#84cc16', '#d97706', '#059669', '#db2777', '#0891b2'];

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
        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/60 dark:bg-white/5 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-400 text-slate-400 dark:text-slate-500 transition-all duration-200 active:scale-90 border border-slate-100 dark:border-slate-700/50"
      >
        <Download size={12} />
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
              <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Export: {paramName}
              </div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                📅 {startDate} s/d {endDate}
              </div>
            </div>
            {options.map((opt) => (
              <button
                key={opt.filterMode}
                onClick={() => { onDownload(paramName, opt.filterMode); setOpenMenu(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 ${opt.color} transition-colors active:scale-95`}
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
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const confirm = useConfirm();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, monthlyRes] = await Promise.all([
        fetch(`/api/dashboard?start=${startDate}&end=${endDate}`),
        fetch(`/api/dashboard?monthly=true&year=${new Date().getFullYear()}`)
      ]);
      if (!dashboardRes.ok) throw new Error();
      const dashboardData = await dashboardRes.json();
      setStats(dashboardData.stats);
      setHistory(dashboardData.history);
      if (monthlyRes.ok) {
        const monthlyJson = await monthlyRes.json();
        setMonthlyData(monthlyJson.monthlyData || []);
      }
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

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <RefreshCw size={16} className={`text-teal-600 dark:text-teal-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter */}
      <div className="glass-panel p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={14} className="text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Filter Periode</h2>
        </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Dari</label>
              <input
                type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="input-premium bg-white dark:bg-slate-900 shadow-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Sampai</label>
              <input
                type="date" value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="input-premium bg-white dark:bg-slate-900 shadow-sm"
              />
            </div>
          </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-stat-teal p-5" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <TestTube size={17} className="text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/75 uppercase tracking-widest">Hari Ini</span>
          </div>
          <div className="text-4xl font-black text-white relative z-10 tracking-tight">
            {loading ? <div className="skeleton h-10 w-16 rounded" /> : (
              <span className="counter-animate">{stats?.today ?? 0}</span>
            )}
          </div>
          <div className="text-xs text-white/55 mt-1 relative z-10 font-medium">Pasien diperiksa</div>
        </div>

        <div className="card-stat-blue p-5" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <TrendingUp size={17} className="text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/75 uppercase tracking-widest">Periode</span>
          </div>
          <div className="text-4xl font-black text-white relative z-10 tracking-tight">
            {loading ? <div className="skeleton h-10 w-16 rounded" /> : (
              <span className="counter-animate">{stats?.filtered ?? 0}</span>
            )}
          </div>
          <div className="text-xs text-white/55 mt-1 relative z-10 font-medium">Total pemeriksaan</div>
        </div>
      </div>

      {/* Chemistry Stats */}
      <div className="mb-3 flex items-center gap-2">
        <div className="section-badge" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
          <FlaskConical size={13} />
          <span>Kimia Klinik</span>
        </div>
      </div>
      <div className="glass-panel p-4 mb-6">
        <div className="flex flex-wrap gap-2.5">
          {loading ? (
            Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            Object.entries(stats.chemistry).map(([label, count], i) => (
              <div key={label}
                className="animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-2xl border border-blue-100/80 dark:border-blue-900/30 p-3.5 flex flex-col gap-1.5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8), rgba(219, 234, 254, 0.4))',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div className="text-[10px] font-bold text-blue-700/70 dark:text-blue-400/80 uppercase leading-tight">{label}</div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  <span className="counter-animate">{count}</span>
                </div>
                <div className="text-[10px] text-blue-400/80 dark:text-blue-500/60 font-medium">pasien</div>
                <button
                  onClick={() => handleDownload(label, 'all_filled')}
                  className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95 hover:shadow-md"
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
        <div className="section-badge" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
          <Dna size={13} />
          <span>Imunologi</span>
        </div>
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
                  className={`animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-2xl border ${hasAlert ? 'border-red-200/80 dark:border-red-900/30' : 'border-slate-200/60 dark:border-slate-700/30'} p-3.5 flex flex-col gap-1.5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default`}
                  style={{
                    background: hasAlert
                      ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.8), rgba(254, 226, 226, 0.4))'
                      : 'var(--surface)',
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={label} options={menuOptions} openMenu={openMenu} setOpenMenu={setOpenMenu} onDownload={handleDownload} startDate={startDate} endDate={endDate} />
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    {isReactive ? (
                      <><span className="text-red-600 dark:text-red-400">{obj.pos} Reaktif</span><span className="text-slate-400 dark:text-slate-500 text-xs"> / {obj.neg} Non</span></>
                    ) : (
                      <><span className="text-orange-600 dark:text-orange-400">{obj.pos} Positif</span><span className="text-slate-400 dark:text-slate-500 text-xs"> / {obj.neg} Negatif</span></>
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
        <div className="section-badge" style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706' }}>
          <Microscope size={13} />
          <span>Mikrobiologi &amp; Parasitologi</span>
        </div>
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
                  className={`animate-stagger flex-1 min-w-[calc(50%-6px)] rounded-2xl border ${hasAlert ? 'border-amber-200/80 dark:border-amber-900/30' : 'border-slate-200/60 dark:border-slate-700/30'} p-3.5 flex flex-col gap-1.5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default`}
                  style={{
                    background: hasAlert
                      ? 'linear-gradient(135deg, rgba(255, 251, 235, 0.8), rgba(254, 243, 199, 0.4))'
                      : 'var(--surface)',
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight flex-1">{label}</div>
                    <DownloadMenu menuKey={`micro_${label}`} options={menuOptions} openMenu={openMenu} setOpenMenu={setOpenMenu} onDownload={handleDownload} startDate={startDate} endDate={endDate} />
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    <span className="text-amber-700 dark:text-amber-400">{obj.pos} Positif</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs"> / {obj.neg} Negatif</span>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="mb-3 flex items-center gap-2">
        <div className="section-badge" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
          <BarChart3 size={13} />
          <span>Tren Bulanan</span>
        </div>
      </div>
      <div className="glass-panel p-4 mb-6">
        {loading ? (
          <div className="h-[200px] skeleton rounded" />
        ) : monthlyData.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">Tidak ada data</div>
        ) : (
          <>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Jumlah Pemeriksaan per Bulan</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Chemistry Distribution Pie Chart */}
      {stats && Object.values(stats.chemistry).some(v => v > 0) && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <div className="section-badge" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
              <PieChart size={13} />
              <span>Distribusi Kimia Klinik</span>
            </div>
          </div>
          <div className="glass-panel p-4 mb-6">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Parameter Pemeriksaan</p>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={Object.entries(stats.chemistry)
                    .filter(([, v]) => v > 0)
                    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {Object.entries(stats.chemistry)
                    .filter(([, v]) => v > 0)
                    .map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* View All History Table CTA */}
      <Link
        href="/riwayat"
        className="glass-panel p-4 mb-4 flex items-center justify-between group transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99]"
        style={{ borderStyle: 'dashed', borderWidth: '1.5px' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(37,99,235,0.06))' }}
          >
            <TrendingUp size={18} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Riwayat Pemeriksaan</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Lihat dan kelola hasil input data pasien</div>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-300" />
      </Link>
    </div>
  );
}
