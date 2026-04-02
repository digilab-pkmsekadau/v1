'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  User, Plus, Trash2, CheckCircle, RotateCcw, Loader2, Stethoscope, Search, ChevronDown
} from 'lucide-react';
import { FormInputData, ParamItem, StatusBiaya } from '@/types';
import { isAbnormal, getNormalRangeText } from '@/lib/normal-ranges';
import { AlertTriangle } from 'lucide-react';

// ─── Daftar semua parameter lab (dikelompokkan) ─────────────────────────────
export const PARAM_OPTIONS: { group: string; params: { key: string; label: string; type: 'number' | 'select' | 'text'; unit?: string; opts?: string[] }[] }[] = [
  {
    group: 'Hematologi',
    params: [
      { key: 'rbc',    label: 'RBC (Eritrosit)',     type: 'number', unit: '10⁶/µl' },
      { key: 'hgb',    label: 'HGB (Hemoglobin)',    type: 'number', unit: 'g/dl' },
      { key: 'hct',    label: 'HCT (Hematokrit)',    type: 'number', unit: '%' },
      { key: 'mcv',    label: 'MCV',                 type: 'number', unit: 'fL' },
      { key: 'mch',    label: 'MCH',                 type: 'number', unit: 'pg' },
      { key: 'mchc',   label: 'MCHC',                type: 'number', unit: 'g/dl' },
      { key: 'plt',    label: 'PLT (Trombosit)',     type: 'number', unit: '10³/µl' },
      { key: 'wbc',    label: 'WBC (Leukosit)',      type: 'number', unit: '10³/µl' },
      { key: 'lym',    label: 'LYM (Limfosit)',      type: 'number', unit: '%' },
      { key: 'mon',    label: 'MON (Monosit)',        type: 'number', unit: '%' },
      { key: 'gra',    label: 'GRA (Granulosit)',    type: 'number', unit: '%' },
      { key: 'led',    label: 'LED',                 type: 'number', unit: 'mm/Jam' },
      { key: 'goldar', label: 'Golongan Darah',      type: 'select', opts: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Belum Diketahui'] },
      { key: 'bt',     label: 'BT (Masa Perdarahan)',type: 'text' },
      { key: 'ct',     label: 'CT (Masa Pembekuan)', type: 'text' },
    ],
  },
  {
    group: 'Serologi / Imunologi',
    params: [
      { key: 'hbsag',         label: 'HBsAg (Hepatitis B)',  type: 'select', opts: ['Non Reaktif','Reaktif'] },
      { key: 'hiv',           label: 'Anti HIV',              type: 'select', opts: ['Non Reaktif','Reaktif'] },
      { key: 'syphilis',      label: 'Syphilis',              type: 'select', opts: ['Non Reaktif','Reaktif'] },
      { key: 'hcv',           label: 'Anti HCV (Hepatitis C)',type: 'select', opts: ['Non Reaktif','Reaktif'] },
      { key: 'anti_hbs',      label: 'Anti HBs',              type: 'select', opts: ['Non Reaktif','Reaktif'] },
      { key: 'ns1',           label: 'NS1 Ag Dengue',        type: 'select', opts: ['Negatif','Positif'] },
      { key: 'dengue_ig',     label: 'Dengue IgG/IgM',       type: 'select', opts: ['Negatif','Positif'] },
      { key: 'malaria_rapid', label: 'Malaria Rapid',        type: 'select', opts: ['Negatif','Positif'] },
      { key: 'widal',         label: 'Widal (Tifus)',        type: 'select', opts: ['Negatif','Positif'] },
    ],
  },
  {
    group: 'Kimia Darah',
    params: [
      { key: 'gds',          label: 'GDS (Gula Darah Sewaktu)', type: 'number', unit: 'mg/dl' },
      { key: 'gdp',          label: 'GDP (Gula Darah Puasa)',   type: 'number', unit: 'mg/dl' },
      { key: 'gd2pp',        label: 'GD2PP (Gula 2 Jam PP)',   type: 'number', unit: 'mg/dl' },
      { key: 'kolesterol',   label: 'Kolesterol',              type: 'number', unit: 'mg/dl' },
      { key: 'trigliserida', label: 'Trigliserida',            type: 'number', unit: 'mg/dl' },
      { key: 'asam_urat',    label: 'Asam Urat',              type: 'number', unit: 'mg/dl' },
    ],
  },
  {
    group: 'Mikrobiologi',
    params: [
      { key: 'bta',           label: 'BTA (TBC)',       type: 'select', opts: ['Negatif','Positif (+)','Positif (++)','Positif (+++)'] },
      { key: 'gram',          label: 'Pewarnaan Gram',  type: 'select', opts: ['Negatif','Positif'] },
      { key: 'malaria_slide', label: 'Malaria Slide',   type: 'select', opts: ['Negatif','P. falciparum','P. vivax','P. malariae'] },
    ],
  },
  {
    group: 'Urinalisis',
    params: [
      { key: 'u_warna',        label: 'Warna Urin',      type: 'select', opts: ['Kuning Muda','Kuning','Kuning Tua','Merah','Keruh'] },
      { key: 'u_jernih',       label: 'Kejernihan',      type: 'select', opts: ['Jernih','Agak Keruh','Keruh'] },
      { key: 'u_bj',           label: 'Berat Jenis (BJ)',type: 'number' },
      { key: 'u_leukosit',     label: 'Leukosit Urin',  type: 'number', unit: '/µl' },
      { key: 'u_nitrit',       label: 'Nitrit',          type: 'select', opts: ['Negatif','Positif'] },
      { key: 'u_ph',           label: 'pH Urin',         type: 'number' },
      { key: 'u_protein',      label: 'Protein',         type: 'select', opts: ['Negatif','Positif (+1)','Positif (+2)','Positif (+3)','Positif (+4)'] },
      { key: 'u_glukosa',      label: 'Glukosa',         type: 'select', opts: ['Negatif','Positif (+1)','Positif (+2)','Positif (+3)','Positif (+4)'] },
      { key: 'u_keton',        label: 'Keton',            type: 'select', opts: ['Negatif','Positif'] },
      { key: 'u_urobilinogen', label: 'Urobilinogen',    type: 'number', unit: 'mg/dl' },
      { key: 'u_bilirubin',    label: 'Bilirubin',       type: 'select', opts: ['Negatif','Positif'] },
      { key: 'u_blood',        label: 'Blood (Darah Samar)', type: 'select', opts: ['Negatif','Positif'] },
      { key: 'u_hcg',          label: 'HCG (Tes Kehamilan)', type: 'select', opts: ['Negatif','Positif'] },
      { key: 'm_leukosit',     label: 'Sedimen: Leukosit',   type: 'number', unit: '/LPB' },
      { key: 'm_eritrosit',    label: 'Sedimen: Eritrosit',  type: 'number', unit: '/LPB' },
      { key: 'm_epitel',       label: 'Sedimen: Epitel',     type: 'number', unit: '/LPK' },
    ],
  },
];

// Flatten untuk lookup
const ALL_PARAMS = PARAM_OPTIONS.flatMap(g => g.params);
const getParamInfo = (key: string) => ALL_PARAMS.find(p => p.key === key);

// ─── Searchable Parameter Dropdown ──────────────────────────────────────────
function SearchableParamSelect({
  value, onChange, usedKeys,
}: {
  value: string;
  onChange: (key: string) => void;
  usedKeys: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.removeEventListener('mousedown', handleOutside);
      setQuery('');
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, handleOutside]);

  const q = query.toLowerCase();
  const filtered = PARAM_OPTIONS.map(group => ({
    group: group.group,
    params: group.params.filter(p =>
      (!usedKeys.has(p.key) || p.key === value) &&
      (q === '' || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
    ),
  })).filter(g => g.params.length > 0);

  const selected = ALL_PARAMS.find(p => p.key === value);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2 text-sm bg-white transition-colors text-left
          ${open ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-200 hover:border-slate-300'}
          ${selected ? 'text-slate-700 font-medium' : 'text-slate-400'}`}
      >
        <span className="truncate">{selected ? selected.label : '— Pilih Parameter —'}</span>
        <ChevronDown size={14} className={`flex-shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          style={{ maxHeight: 320 }}>
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari parameter..."
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 252 }}>
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Tidak ditemukan</p>
            ) : (
              filtered.map(group => (
                <div key={group.group}>
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50">
                    {group.group}
                  </div>
                  {group.params.map(param => (
                    <button
                      key={param.key}
                      type="button"
                      onClick={() => { onChange(param.key); setOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${param.key === value
                          ? 'bg-teal-50 text-teal-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {param.label}
                      {param.unit && <span className="text-slate-400 text-xs ml-1">({param.unit})</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const makeId = () => Math.random().toString(36).slice(2);

const initialPatient = {
  nama_pasien: '', nik: '', jenis_kelamin: '', alamat: '', tgl_lahir: '', tgl_permintaan: '',
  dokter: '', petugas: '', status_biaya: 'Umum' as StatusBiaya,
};

export default function InputPage() {
  const [patient, setPatient] = useState(initialPatient);
  const [params, setParams] = useState<ParamItem[]>([]);
  const [dokters, setDokters] = useState<string[]>([]);
  const [petugasList, setPetugasList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successNo, setSuccessNo] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setPatient(prev => ({ ...prev, tgl_permintaan: today }));
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setDokters(data.dokters || []);
        setPetugasList(data.petugas || []);
      })
      .catch(() => toast.error('Gagal memuat data dokter/petugas'));
  }, []);

  const setField = (field: keyof typeof initialPatient, value: string) =>
    setPatient(prev => ({ ...prev, [field]: value }));

  // Tambah baris parameter baru
  const addParam = () => {
    setParams(prev => [...prev, { id: makeId(), paramKey: '', value: '' }]);
  };

  // Hapus baris
  const removeParam = (id: string) =>
    setParams(prev => prev.filter(p => p.id !== id));

  // Update paramKey atau value
  const updateParam = (id: string, field: 'paramKey' | 'value', val: string) =>
    setParams(prev => prev.map(p => {
      if (p.id !== id) return p;
      // Jika ganti paramKey, reset value
      if (field === 'paramKey') return { ...p, paramKey: val, value: '' };
      return { ...p, [field]: val };
    }));

  // Kunci para key yang sudah dipilih (cegah duplikat)
  const usedKeys = new Set(params.map(p => p.paramKey).filter(Boolean));

  const handleReset = () => {
    const today = new Date().toISOString().split('T')[0];
    setPatient({ ...initialPatient, tgl_permintaan: today });
    setParams([]);
    setSuccessNo(null);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast.info('Form direset');
  };

  const handleSubmit = async () => {
    if (!patient.nama_pasien.trim()) {
      toast.error('Nama pasien wajib diisi'); return;
    }
    if (!patient.jenis_kelamin) {
      toast.error('Jenis kelamin wajib dipilih'); return;
    }
    if (!patient.tgl_permintaan) {
      toast.error('Tanggal permintaan wajib diisi'); return;
    }
    if (!patient.dokter) {
      toast.error('Dokter perujuk wajib dipilih'); return;
    }
    if (!patient.petugas) {
      toast.error('Petugas pemeriksa wajib dipilih'); return;
    }
    const filledParams = params.filter(p => p.paramKey && p.value.trim());
    if (filledParams.length === 0) {
      toast.error('Minimal satu parameter pemeriksaan harus diisi'); return;
    }

    setLoading(true);
    try {
      const body: FormInputData = { ...patient, params: filledParams };
      const res = await fetch('/api/examinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Gagal menyimpan data'); return; }

      // ── Cek nilai kritis setelah simpan ──
      const abnormals = filledParams.filter(p => isAbnormal(p.paramKey, p.value, patient.jenis_kelamin));
      setSuccessNo(data.no_urut);
      handleReset();

      if (abnormals.length > 0) {
        const labels = abnormals.map(p => {
          const info = ALL_PARAMS.find(a => a.key === p.paramKey);
          return `${info?.label ?? p.paramKey}: ${p.value}${info?.unit ? ' ' + info.unit : ''}`;
        });
        toast.warning(
          `⚠️ NILAI KRITIS — ${patient.nama_pasien}\n${labels.join(', ')}`,
          { duration: 8000, description: 'Segera laporkan ke dokter perujuk.' }
        );
      } else {
        toast.success(`Data tersimpan! No Urut: ${data.no_urut}`);
      }
    } catch {
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const filledCount = params.filter(p => p.paramKey && p.value).length;
  const totalFields = 4; // required fields
  const filledRequired = [patient.nama_pasien, patient.tgl_permintaan, patient.dokter, patient.petugas].filter(Boolean).length;
  const progressPct = Math.round(((filledRequired + filledCount) / (totalFields + Math.max(params.length, 1))) * 100);

  return (
    <div className="px-4 py-5 animate-slide-up" ref={topRef}>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Input Pemeriksaan</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Isi identitas pasien lalu tambahkan parameter pemeriksaan</p>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              background: progressPct === 100
                ? 'linear-gradient(90deg, #0d9488, #14b8a6)'
                : 'linear-gradient(90deg, #2563eb, #3b82f6)',
            }}
          />
        </div>
      </div>

      {/* Success banner */}
      {successNo && (
        <div className="mb-4 p-4 rounded-2xl border border-teal-200/60 dark:border-teal-800/40 flex items-center gap-3 animate-stagger"
          style={{ background: 'linear-gradient(135deg, rgba(204, 251, 241, 0.6), rgba(153, 246, 228, 0.3))' }}
        >
          <CheckCircle size={20} className="text-teal-600 dark:text-teal-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-teal-800 dark:text-teal-300">Data tersimpan!</div>
            <div className="text-xs text-teal-600 dark:text-teal-400">No Urut: <span className="font-extrabold">{successNo}</span></div>
          </div>
        </div>
      )}

      {/* ── IDENTITAS PASIEN ─────────────────────────────────── */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.12), rgba(20,184,166,0.08))' }}
          >
            <User size={16} className="text-teal-600 dark:text-teal-400" />
          </div>
          <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Identitas Pasien</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nama Lengkap *</label>
            <input type="text" value={patient.nama_pasien}
              onChange={e => setField('nama_pasien', e.target.value)}
              placeholder="Nama pasien"
              className="input-premium" />
          </div>

          {/* NIK, Jenis Kelamin, Tgl Lahir */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">NIK</label>
              <input type="text" value={patient.nik}
                onChange={e => setField('nik', e.target.value)}
                placeholder="16 digit NIK"
                className="input-premium" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Jenis Kelamin *</label>
              <select value={patient.jenis_kelamin}
                onChange={e => setField('jenis_kelamin', e.target.value)}
                className="input-premium appearance-none bg-white/50 backdrop-blur"
              >
                <option value="" disabled>-- Pilih --</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tanggal Lahir</label>
              <input type="date" value={patient.tgl_lahir}
                onChange={e => setField('tgl_lahir', e.target.value)}
                className="input-premium" />
            </div>
          </div>

          {/* Alamat */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Alamat</label>
            <textarea value={patient.alamat}
              onChange={e => setField('alamat', e.target.value)}
              rows={2} placeholder="Alamat lengkap"
              className="input-premium resize-none" />
          </div>

          {/* Tgl Permintaan + Status Biaya */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tgl Permintaan *</label>
              <input type="date" value={patient.tgl_permintaan}
                onChange={e => setField('tgl_permintaan', e.target.value)}
                className="input-premium" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status Biaya</label>
              <select value={patient.status_biaya}
                onChange={e => setField('status_biaya', e.target.value)}
                className="input-premium">
                {['Umum', 'BPJS', 'Gratis'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Dokter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dokter Perujuk *</label>
            <select value={patient.dokter}
              onChange={e => setField('dokter', e.target.value)}
              className="input-premium">
              <option value="">— Pilih Dokter —</option>
              {dokters.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Petugas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Petugas Pemeriksa *</label>
            <select value={patient.petugas}
              onChange={e => setField('petugas', e.target.value)}
              className="input-premium">
              <option value="">— Pilih Petugas —</option>
              {petugasList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── PARAMETER LAB (DYNAMIC) ──────────────────────────── */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(59,130,246,0.08))' }}
          >
            <Stethoscope size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Parameter Lab</span>
          {params.length > 0 && (
            <span className="ml-auto text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-bold px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/40">
              {filledCount} terisi
            </span>
          )}
        </div>

        {/* Baris parameter */}
        {params.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            Belum ada parameter. Klik tombol di bawah untuk menambahkan.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {params.map((item) => {
            const info = getParamInfo(item.paramKey);
            return (
              <div key={item.id} className="animate-stagger border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-3.5 transition-all duration-200" style={{ background: 'var(--surface)' }}>
                {/* Row header: dropdown pilih param + tombol hapus */}
                <div className="flex items-center gap-2 mb-2">
                  <SearchableParamSelect
                    value={item.paramKey}
                    onChange={key => updateParam(item.id, 'paramKey', key)}
                    usedKeys={usedKeys}
                  />
                  <button
                    type="button"
                    onClick={() => removeParam(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 flex-shrink-0 active:scale-90"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Input nilai */}
                {item.paramKey && info && (() => {
                  const abnormal = item.value ? isAbnormal(item.paramKey, item.value) : false;
                  const rangeText = getNormalRangeText(item.paramKey);
                  return (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-400">
                          Nilai/Hasil{info.unit && <span className="text-slate-300"> ({info.unit})</span>}
                        </label>
                        {rangeText && (
                          <span className={`text-[10px] font-medium ${abnormal ? 'text-red-500' : 'text-slate-400'}`}>
                            {rangeText}
                          </span>
                        )}
                      </div>
                      {info.type === 'select' && info.opts ? (
                        <select
                          value={item.value}
                          onChange={e => updateParam(item.id, 'value', e.target.value)}
                          className="input-premium"
                        >
                          <option value="">— Pilih —</option>
                          {info.opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={info.type === 'number' ? 'number' : 'text'}
                          step="any"
                          value={item.value}
                          onChange={e => updateParam(item.id, 'value', e.target.value)}
                          placeholder={info.type === 'number' ? '0' : 'Isi hasil...'}
                          className={`input-premium ${abnormal ? '!border-red-300 dark:!border-red-800 !text-red-700 dark:!text-red-400 !bg-red-50 dark:!bg-red-950/30' : ''}`}
                        />
                      )}
                      {/* Inline abnormal warning */}
                      {abnormal && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <AlertTriangle size={11} className="text-red-500 flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-red-600">
                            Nilai di luar batas normal — segera laporkan ke dokter
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Tombol tambah parameter */}
        <button
          type="button"
          onClick={addParam}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-blue-200/60 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 active:scale-95"
        >
          <Plus size={16} />
          TAMBAH PARAMETER
        </button>
      </div>

      {/* ── ACTION BUTTONS ───────────────────────────────────── */}
      <div className="flex gap-3 pb-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', boxShadow: '0 8px 28px -4px rgba(13,149,136,0.35)' }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" />Menyimpan...</>
          ) : (
            <><Stethoscope size={16} />Simpan Data</>
          )}
        </button>
      </div>
    </div>
  );
}
