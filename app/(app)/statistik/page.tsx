'use client';

import { BarChart3, PieChart, Loader2 } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
} from 'recharts';
import { toast } from 'sonner';

import type { DashboardStats, MonthlyVisit } from '@/types';

const COLORS = ['#14b8a6', '#0891b2', '#7c3aed', '#e11d48', '#d97706', '#0284c7', '#059669', '#db2777', '#22d3ee', '#0d9488'];

type GroupKey = 'chemistry' | 'immunology' | 'microbiology';

const GROUPS: { key: GroupKey; label: string; a: string; b: string }[] = [
  { key: 'chemistry',    label: 'Kimia Klinik',                a: '#14b8a6', b: '#0d9488' },
  { key: 'immunology',   label: 'Imunologi',                   a: '#a855f7', b: '#7c3aed' },
  { key: 'microbiology', label: 'Mikrobiologi & Parasitologi', a: '#f59e0b', b: '#d97706' },
];

export default function StatistikPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyVisit[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupKey>('chemistry');

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, monRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/dashboard?monthly=true&year=' + new Date().getFullYear()),
        ]);
        if (!dashRes.ok) throw new Error();
        const dash = await dashRes.json();
        setStats(dash.stats);
        if (monRes.ok) {
          const mon = await monRes.json();
          setMonthlyData(mon.monthlyData || []);
        }
      } catch {
        toast.error('Gagal memuat data statistik');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeGroup = GROUPS.find(g => g.key === group)!;

  // Kimia = jumlah pemeriksaan per parameter; imunologi/mikrobiologi = pos+neg.
  const pieData = (() => {
    if (!stats) return [];
    if (group === 'chemistry') {
      return Object.entries(stats.chemistry)
        .filter(([, v]) => v > 0)
        .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
    }
    const src = group === 'immunology' ? stats.immunology : stats.microbiology;
    return Object.entries(src)
      .map(([name, v]) => ({ name, value: (v.pos ?? 0) + (v.neg ?? 0) }))
      .filter(d => d.value > 0)
      .map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));
  })();

  const totalChemistry = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="px-4 py-5 animate-slide-up">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Statistik</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Tren dan distribusi pemeriksaan lab</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin text-teal-500" />
        </div>
      ) : (
        <>
          {/* Bar Chart — Tren Bulanan */}
          <div className="mb-3 flex items-center gap-2.5">
            <span className="clay-icon clay-icon-cat clay-icon-sm w-8 h-8" style={{ '--clay-a': '#22d3ee', '--clay-b': '#0891b2' } as CSSProperties}>
              <BarChart3 size={15} strokeWidth={2.3} className="text-white" />
            </span>
            <span className="font-display text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">Tren Bulanan</span>
          </div>
          <div className="glass-panel p-5 mb-6">
            {monthlyData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">Tidak ada data</div>
            ) : (
              <>
                <p className="label-caps text-slate-500 dark:text-slate-400 mb-4">Jumlah Pemeriksaan per Bulan</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="100%" stopColor="#0d9488" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(20,184,166,0.06)' }}
                      contentStyle={{
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        boxShadow: '0 8px 24px -8px rgba(0,0,0,0.12)',
                      }}
                    />
                    <Bar dataKey="count" fill="url(#barTeal)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* Donut Chart — Distribusi per golongan pemeriksaan */}
          <div className="mb-3 flex items-center gap-2.5">
            <span className="clay-icon clay-icon-cat clay-icon-sm w-8 h-8" style={{ '--clay-a': activeGroup.a, '--clay-b': activeGroup.b } as CSSProperties}>
              <PieChart size={15} strokeWidth={2.3} className="text-white" />
            </span>
            <span className="font-display text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200">Distribusi Pemeriksaan</span>
          </div>
          <div className="glass-panel p-5 mb-6">
            <label htmlFor="golongan" className="label-caps text-slate-500 dark:text-slate-400 mb-2 block">Golongan Pemeriksaan</label>
            <select
              id="golongan"
              value={group}
              onChange={e => setGroup(e.target.value as GroupKey)}
              className="input-premium w-full mb-4"
            >
              {GROUPS.map(g => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>

            {pieData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">Belum ada data untuk golongan ini</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        boxShadow: '0 8px 24px -8px rgba(0,0,0,0.12)',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="label-caps text-slate-400">Total</span>
                  <span className="font-mono-data text-xl font-bold text-teal-600 dark:text-teal-400">{totalChemistry}</span>
                  <span className="label-caps text-slate-400">pemeriksaan</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
