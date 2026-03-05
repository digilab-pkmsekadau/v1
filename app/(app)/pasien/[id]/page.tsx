'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, User, Calendar, QrCode, TrendingUp, ClipboardList, Eye } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import dynamic from 'next/dynamic';
import { isAbnormal } from '@/lib/normal-ranges';

// QR Code - lazy loaded (client only)
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false });

// Parameter numerik yang bisa digrafik
const TREND_PARAMS: { key: string; label: string; color: string }[] = [
  { key: 'gds',         label: 'GDS',         color: '#0d9488' },
  { key: 'gdp',         label: 'GDP',         color: '#2563eb' },
  { key: 'gd2pp',       label: 'GD2PP',       color: '#7c3aed' },
  { key: 'kolesterol',  label: 'Kolesterol',  color: '#dc2626' },
  { key: 'trigliserida',label: 'Trigliserida',color: '#d97706' },
  { key: 'asam_urat',   label: 'Asam Urat',   color: '#059669' },
  { key: 'hgb',         label: 'HGB',         color: '#db2777' },
  { key: 'wbc',         label: 'WBC',         color: '#0891b2' },
  { key: 'plt',         label: 'PLT',         color: '#65a30d' },
  { key: 'sgot',        label: 'SGOT',        color: '#9333ea' },
  { key: 'sgpt',        label: 'SGPT',        color: '#ea580c' },
  { key: 'ureum',       label: 'Ureum',       color: '#0284c7' },
];

interface Patient {
  id: string; nama: string; nik?: string;
  alamat?: string; tgl_lahir?: string;
}
interface Examination { [key: string]: string | undefined; tgl_permintaan: string; id: string; no_urut: string; }

function parseNum(val?: string): number | null {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export default function PasienDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'riwayat' | 'trend' | 'qr'>('riwayat');
  const [selectedParams, setSelectedParams] = useState<string[]>(['gds', 'kolesterol']);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPatient(json.patient);
      setExams(json.examinations ?? []);
    } catch {
      toast.error('Gagal memuat data pasien');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build chart data — hanya param numerik yang ada nilainya
  const availableParams = TREND_PARAMS.filter(p =>
    exams.some(e => parseNum(e[p.key] as string) !== null)
  );

  const chartData = exams.map(e => {
    const row: Record<string, string | number> = {
      tgl: new Date(e.tgl_permintaan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    };
    TREND_PARAMS.forEach(p => {
      const n = parseNum(e[p.key] as string);
      if (n !== null) row[p.key] = n;
    });
    return row;
  });

  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/pasien/${id}`
    : '';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={32} className="animate-spin text-teal-500" />
        <p className="text-sm text-slate-400">Memuat data pasien...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-slate-400 text-sm">Pasien tidak ditemukan.</p>
        <button onClick={() => router.back()} className="mt-3 text-teal-600 text-sm font-semibold">← Kembali</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <ArrowLeft size={16} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-slate-800 leading-tight">{patient.nama}</h1>
          <p className="text-xs text-slate-400">{exams.length} kali pemeriksaan</p>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="glass-panel p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
            <span className="text-teal-700 font-extrabold text-lg">
              {patient.nama.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
            {patient.nik && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">NIK</div>
                <div className="text-slate-700 font-medium text-xs">{patient.nik}</div>
              </div>
            )}
            {patient.tgl_lahir && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tgl Lahir</div>
                <div className="text-slate-700 font-medium text-xs">{patient.tgl_lahir}</div>
              </div>
            )}
            {patient.alamat && (
              <div className="col-span-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Alamat</div>
                <div className="text-slate-600 text-xs">{patient.alamat}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'riwayat', label: 'Riwayat', icon: ClipboardList },
          { key: 'trend',   label: 'Grafik',   icon: TrendingUp },
          { key: 'qr',      label: 'QR Code',  icon: QrCode },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              tab === key
                ? 'text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            style={tab === key ? { background: 'linear-gradient(135deg, #0d9488, #0f766e)' } : {}}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* === TAB: RIWAYAT === */}
      {tab === 'riwayat' && (
        <div className="glass-panel overflow-hidden">
          {exams.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              Belum ada riwayat pemeriksaan
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {[...exams].reverse().map(exam => {
                const abnormals = Object.entries(exam).filter(([k, v]) =>
                  typeof v === 'string' && isAbnormal(k, v)
                );
                return (
                  <div key={exam.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-teal-50/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-teal-700">{exam.no_urut}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(exam.tgl_permintaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      {abnormals.length > 0 && (
                        <div className="mt-0.5 text-[11px] text-red-500 font-semibold">
                          ⚠️ {abnormals.length} nilai abnormal
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400">{exam.dokter} • {exam.status_biaya}</div>
                    </div>
                    <button
                      onClick={() => router.push(`/riwayat/${exam.id}`)}
                      className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center hover:bg-teal-100 transition-colors"
                    >
                      <Eye size={13} className="text-teal-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === TAB: GRAFIK TREND === */}
      {tab === 'trend' && (
        <div className="space-y-4">
          {availableParams.length === 0 ? (
            <div className="glass-panel py-10 text-center text-slate-400 text-sm">
              Tidak ada data numerik untuk digrafik
            </div>
          ) : (
            <>
              {/* Param selector */}
              <div className="glass-panel p-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Pilih Parameter
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableParams.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setSelectedParams(prev =>
                        prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key]
                      )}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                        selectedParams.includes(p.key)
                          ? 'text-white border-transparent'
                          : 'border-slate-200 text-slate-500 bg-white'
                      }`}
                      style={selectedParams.includes(p.key) ? { background: p.color, borderColor: p.color } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="glass-panel p-4">
                {exams.length < 2 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    Perlu minimal 2 kali pemeriksaan untuk melihat tren
                  </div>
                ) : selectedParams.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    Pilih minimal 1 parameter di atas
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-600 mb-3">Tren Nilai Lab</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="tgl" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        {TREND_PARAMS.filter(p => selectedParams.includes(p.key)).map(p => (
                          <Line
                            key={p.key}
                            type="monotone"
                            dataKey={p.key}
                            name={p.label}
                            stroke={p.color}
                            strokeWidth={2}
                            dot={{ r: 4, fill: p.color }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* === TAB: QR CODE === */}
      {tab === 'qr' && (
        <div className="glass-panel p-6 flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <QRCodeSVG
              value={qrUrl || `patient:${id}`}
              size={200}
              level="M"
              fgColor="#0f172a"
              bgColor="#ffffff"
            />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 text-sm">{patient.nama}</p>
            {patient.nik && <p className="text-xs text-slate-400 mt-0.5">NIK: {patient.nik}</p>}
            <p className="text-[11px] text-slate-400 mt-2 max-w-[220px] leading-relaxed">
              Scan QR code ini untuk membuka riwayat pemeriksaan pasien secara cepat
            </p>
          </div>
          <button
            onClick={() => {
              const svg = document.querySelector('svg');
              if (!svg) return;
              const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `QR-${patient.nama.replace(/\s+/g, '-')}.svg`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
          >
            <QrCode size={14} />
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
}
