'use client';

import { BarChart3, PieChart } from 'lucide-react';
import { useEffect, useState } from 'react';

import AnimatedLoader from '@/components/ui/AnimatedLoader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
} from 'recharts';
import { toast } from 'sonner';

import type { DashboardStats, MonthlyVisit } from '@/types';

const COLORS = ['#14b8a6', '#0891b2', '#7c3aed', '#e11d48', '#d97706', '#0284c7', '#059669', '#db2777', '#22d3ee', '#0d9488'];

type GroupKey = 'chemistry' | 'hematology' | 'immunology' | 'microbiology' | 'urinalysis';

const GROUPS: { key: GroupKey; label: string; a: string; b: string }[] = [
  { key: 'chemistry',    label: 'Kimia Klinik',                a: '#14b8a6', b: '#0d9488' },
  { key: 'hematology',   label: 'Hematologi',                  a: '#fb7185', b: '#e11d48' },
  { key: 'immunology',   label: 'Imunologi',                   a: '#a855f7', b: '#7c3aed' },
  { key: 'microbiology', label: 'Mikrobiologi & Parasitologi', a: '#f59e0b', b: '#d97706' },
  { key: 'urinalysis',   label: 'Urinalisis',                  a: '#38bdf8', b: '#0284c7' },
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

  // Kimia + hematologi = jumlah terisi per parameter; imunologi/mikro/urin = pos+neg.
  // ponytail: key stats = label form; label export monthly beda skema, jangan join.
  const pieData = (() => {
    if (!stats) return [];
    if (group === 'chemistry' || group === 'hematology') {
      return Object.entries(stats[group])
        .filter(([, v]) => v > 0)
        .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
    }
    const src = group === 'immunology' ? stats.immunology : group === 'microbiology' ? stats.microbiology : stats.urinalysis;
    return Object.entries(src)
      .map(([name, v]) => ({ name, value: (v.pos ?? 0) + (v.neg ?? 0) }))
      .filter(d => d.value > 0)
      .map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));
  })();

  const totalValues = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="px-4 py-5 animate-slide-up">
      <div className="mb-5">
        <h1 className="font-black text-2xl text-black dark:text-white tracking-tight uppercase">Statistik</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1">Tren dan distribusi pemeriksaan lab</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <AnimatedLoader label="Memuat statistik..." />
          <p className="text-sm text-slate-500 font-semibold">Memuat statistik...</p>
        </div>
      ) : (
        <>
          {/* Bar Chart — Tren Bulanan */}
          <div className="mb-3 flex items-center gap-2.5">
            <div className="brutal-icon-sm bg-cyan-400 border-black dark:border-white">
              <BarChart3 size={15} strokeWidth={2.3} className="text-cyan-700 dark:text-cyan-300" />
            </div>
            <span className="font-black text-sm tracking-wide text-black dark:text-white uppercase">Tren Bulanan</span>
          </div>
          <div className="brutal-card p-5 mb-6">
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
                        borderRadius: 12,
                        border: '2px solid black',
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
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
            <div className="brutal-icon-sm border-black dark:border-white" style={{ background: activeGroup.a }}>
              <PieChart size={15} strokeWidth={2.3} className="text-white" />
            </div>
            <span className="font-black text-sm tracking-wide text-black dark:text-white uppercase">Distribusi Pemeriksaan</span>
          </div>
          <div className="brutal-card p-5 mb-6">
            <label htmlFor="golongan" className="label-caps text-slate-500 dark:text-slate-400 mb-2 block">Golongan Pemeriksaan</label>
            <select
              id="golongan"
              value={group}
              onChange={e => setGroup(e.target.value as GroupKey)}
              className="brutal-input w-full mb-4"
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
                        borderRadius: 12,
                        border: '2px solid black',
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="label-caps text-slate-400">Total</span>
                  <span className="font-mono-data text-xl font-bold text-teal-600 dark:text-teal-400">{totalValues}</span>
                  <span className="label-caps text-slate-400">nilai terisi</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}


