'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  User, Plus, Trash2, CheckCircle, RotateCcw, Loader2, Stethoscope, Search, ChevronDown, Camera
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import PatientAutocomplete, { type PatientSuggestion } from '@/components/input/PatientAutocomplete';
import { isAbnormal, getNormalRangeText, isPositivePregnancy } from '@/lib/normal-ranges';
import { PARAM_OPTIONS, ALL_PARAMS, getParamInfo } from '@/lib/param-options';
import type { FormInputData, ParamItem, StatusBiaya } from '@/types';

// â”€â”€â”€ Daftar semua parameter lab (dikelompokkan) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Konstanta dipindah ke `lib/param-options.ts`. Lihat impor di atas.

// â”€â”€â”€ Searchable Parameter Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Define Zod schema
const patientSchema = z.object({
  nama_pasien: z.string().min(1, 'Nama pasien wajib diisi'),
  nik: z.string().optional(),
  jenis_kelamin: z.string().min(1, 'Jenis kelamin wajib dipilih'),
  alamat: z.string().optional(),
  tgl_lahir: z.string().optional(),
  tgl_permintaan: z.string().min(1, 'Tanggal permintaan wajib diisi'),
  dokter: z.string().min(1, 'Dokter perujuk wajib dipilih'),
  petugas: z.string().min(1, 'Petugas pemeriksa wajib dipilih'),
  status_biaya: z.enum(['Umum', 'BPJS', 'Gratis']),
});

type PatientFormData = z.infer<typeof patientSchema>;

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
        <span className="truncate">{selected ? selected.label : 'â€” Pilih Parameter â€”'}</span>
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
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold">âœ•</button>
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
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nama_pasien: '', nik: '', jenis_kelamin: '', alamat: '', tgl_lahir: '', tgl_permintaan: '',
      dokter: '', petugas: '', status_biaya: 'Umum'
    }
  });

  const patient = watch();
  const [params, setParams] = useState<ParamItem[]>([]);
  const [dokters, setDokters] = useState<string[]>([]);
  const [petugasList, setPetugasList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successNo, setSuccessNo] = useState<string | null>(null);
  const [matchedPatientId, setMatchedPatientId] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setValue('tgl_permintaan', today);
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setDokters(data.dokters || []);
        setPetugasList(data.petugas || []);
      })
      .catch(() => toast.error('Gagal memuat data dokter/petugas'));
  }, []);

  const setField = (field: keyof PatientFormData, value: string) => {
    setValue(field, value as any, { shouldValidate: true });
  };

  // Saat user pilih pasien dari dropdown autocomplete â†’ auto-isi semua field identitas
  const handleSelectPatient = (p: PatientSuggestion) => {
    setValue('nama_pasien', p.nama || '', { shouldValidate: true });
    setValue('nik', p.nik || '', { shouldValidate: true });
    setValue('jenis_kelamin', p.jenis_kelamin || '', { shouldValidate: true });
    setValue('alamat', p.alamat || '');
    setValue('tgl_lahir', p.tgl_lahir || '');
    setValue('status_biaya', (p.last_status_biaya as StatusBiaya) || 'Umum');
    setMatchedPatientId(p.id);
    toast.success(`Pasien ditemukan: ${p.nama}`, {
      description: 'Data identitas terisi otomatis. Silakan isi pemeriksaan terbaru.',
    });
  };

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

  // Kompres + ubah file gambar jadi data URL (batasi sisi terpanjang 1600px, JPEG 80%)
  // supaya payload OCR kecil, cepat, dan hemat kuota AI.
  const fileToCompressedDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result as string; };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      img.onload = () => {
        const MAX = 1600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas tidak didukung'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      reader.readAsDataURL(file);
    });

  const handlePhotoOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    setOcrLoading(true);
    try {
      const image = await fileToCompressedDataUrl(file);
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'AI gagal membaca foto'); return; }

      const p = data.patient ?? {};
      const identityKeys: (keyof PatientFormData)[] = [
        'nama_pasien', 'nik', 'jenis_kelamin', 'alamat', 'tgl_lahir', 'tgl_permintaan', 'dokter', 'status_biaya',
      ];
      // Hanya isi field yang masih kosong; jangan timpa data yang sudah diketik petugas.
      for (const key of identityKeys) {
        const current = patient[key];
        const isEmpty = typeof current !== 'string' || !current.trim();
        if (isEmpty && typeof p[key] === 'string' && p[key].trim()) {
          setValue(key, p[key] as PatientFormData[typeof key], { shouldValidate: true });
          // setValue tidak lewat onChange, jadi tautan ke pasien terpilih harus
          // dilepas manual â€” kalau tidak, hasil bisa masuk ke riwayat pasien lain.
          if (key === 'nama_pasien' || key === 'nik') setMatchedPatientId(null);
        }
      }

      // Merge param AI ke baris yang sudah ada; jangan buang param yang sudah diisi manual.
      const existingKeys = new Set(params.map(x => x.paramKey));
      const aiParams: ParamItem[] = Array.isArray(data.params)
        ? data.params
            .filter((x: { paramKey?: string; value?: string }) => x.paramKey && x.value && !existingKeys.has(x.paramKey))
            .map((x: { paramKey: string; value: string }) => ({ id: makeId(), paramKey: x.paramKey, value: x.value }))
        : [];
      if (aiParams.length > 0) setParams(prev => [...prev, ...aiParams]);

      toast.success(`AI menambah ${aiParams.length} parameter`, {
        description: 'Periksa & koreksi bila ada yang salah baca sebelum menyimpan.',
      });
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      toast.error('Gagal memproses foto');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleReset = () => {
    const today = new Date().toISOString().split('T')[0];
    reset({
      nama_pasien: '', nik: '', jenis_kelamin: '', alamat: '', tgl_lahir: '',
      tgl_permintaan: today, dokter: '', petugas: '', status_biaya: 'Umum'
    });
    setParams([]);
    setSuccessNo(null);
    setMatchedPatientId(null);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast.info('Form direset');
  };

  const onSubmitForm = async (data: PatientFormData) => {
    const filledParams = params.filter(p => p.paramKey && p.value.trim());
    if (filledParams.length === 0) {
      toast.error('Minimal satu parameter pemeriksaan harus diisi'); return;
    }

    setLoading(true);
    try {
      const body: FormInputData = {
        ...data,
        patient_id: matchedPatientId ?? undefined,
        params: filledParams,
      } as FormInputData;
      const res = await fetch('/api/examinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const responseData = await res.json();
      if (!res.ok) { toast.error(responseData.error || 'Gagal menyimpan data'); return; }

      // â”€â”€ Cek nilai kritis setelah simpan â”€â”€
      const abnormals = filledParams.filter(p => isAbnormal(p.paramKey, p.value, patient.jenis_kelamin));
      setSuccessNo(responseData.no_urut);
      handleReset();

      if (abnormals.length > 0) {
        const labels = abnormals.map(p => {
          const info = ALL_PARAMS.find(a => a.key === p.paramKey);
          return `${info?.label ?? p.paramKey}: ${p.value}${info?.unit ? ' ' + info.unit : ''}`;
        });
        toast.warning(
          `âš ï¸ NILAI KRITIS â€” ${patient.nama_pasien}\n${labels.join(', ')}`,
          { duration: 8000, description: 'Segera laporkan ke dokter perujuk.' }
        );
      } else {
        toast.success(`Data tersimpan! No Urut: ${responseData.no_urut}`);
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
        <h1 className="text-2xl font-black text-black dark:text-white tracking-tight uppercase">Input Pemeriksaan</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1">Isi identitas pasien lalu tambahkan parameter pemeriksaan</p>
        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-zinc-800 border-2 border-black dark:border-white overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              background: progressPct === 100 ? '#f97316' : '#fbbf24',
            }}
          />
        </div>
      </div>

      {/* Isi dari Foto (OCR AI) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoOcr}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={ocrLoading}
        className="mb-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-black dark:border-white text-sm font-black text-black dark:text-white disabled:opacity-60 transition-all bg-indigo-400 hover:bg-indigo-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        
      >
        {ocrLoading
          ? <><Loader2 size={16} className="animate-spin" /> Membaca foto…</>
          : <><Camera size={16} /> Isi dari Foto Hasil Lab</>}
      </button>

      {/* Success banner */}
      {successNo && (
        <div className="mb-4 p-4 rounded-xl border-2 border-black dark:border-white flex items-center gap-3 animate-stagger bg-emerald-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
          
        >
          <CheckCircle size={20} className="text-teal-600 dark:text-teal-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-teal-800 dark:text-teal-300">Data tersimpan!</div>
            <div className="text-xs text-teal-600 dark:text-teal-400">No Urut: <span className="font-extrabold">{successNo}</span></div>
          </div>
        </div>
      )}

      {/* â”€â”€ IDENTITAS PASIEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="brutal-card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="brutal-icon-sm bg-orange-500 border-black dark:border-white"
            
          >
            <User size={16} className="text-teal-600 dark:text-teal-400" />
          </div>
          <span className="font-black text-sm text-black dark:text-white uppercase">Identitas Pasien</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <span>Nama Lengkap *</span>
              {matchedPatientId && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 normal-case tracking-normal flex items-center gap-1">
                  <CheckCircle2 size={11} /> Pasien terdaftar
                </span>
              )}
            </label>
            <PatientAutocomplete
              field="nama"
              value={patient.nama_pasien}
              onChange={(v) => { setField('nama_pasien', v); setMatchedPatientId(null); }}
              onSelect={handleSelectPatient}
              placeholder="Nama pasien (ketik untuk cari riwayat)"
              className="brutal-input"
            />
          </div>

          {/* NIK, Jenis Kelamin, Tgl Lahir */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">NIK</label>
              <PatientAutocomplete
                field="nik"
                value={patient.nik || ''}
                onChange={(v) => { setField('nik', v); setMatchedPatientId(null); }}
                onSelect={handleSelectPatient}
                placeholder="16 digit NIK"
                inputMode="numeric"
                pattern="[0-9]*"
                className="brutal-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={`text-[11px] font-bold uppercase tracking-widest flex justify-between ${errors.jenis_kelamin ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}><span>Jenis Kelamin *</span>{errors.jenis_kelamin && <span className="text-[10px] text-red-500 normal-case tracking-normal">{errors.jenis_kelamin.message}</span>}</label>
              <select value={patient.jenis_kelamin || ""}
                onChange={e => setField('jenis_kelamin', e.target.value)}
                className="brutal-input appearance-none"
              >
                <option value="" disabled>-- Pilih --</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Tanggal Lahir</label>
              <input type="date" value={patient.tgl_lahir}
                onChange={e => setField('tgl_lahir', e.target.value)}
                className="brutal-input" />
            </div>
          </div>

          {/* Alamat */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Alamat</label>
            <textarea value={patient.alamat}
              onChange={e => setField('alamat', e.target.value)}
              rows={2} placeholder="Alamat lengkap"
              className="brutal-input resize-none" />
          </div>

          {/* Tgl Permintaan + Status Biaya */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] font-bold uppercase tracking-widest flex justify-between ${errors.tgl_permintaan ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}><span>Tgl Permintaan *</span>{errors.tgl_permintaan && <span className="text-[10px] text-red-500 normal-case tracking-normal">{errors.tgl_permintaan.message}</span>}</label>
              <input type="date" value={patient.tgl_permintaan}
                onChange={e => setField('tgl_permintaan', e.target.value)}
                className="brutal-input" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status Biaya</label>
              <select value={patient.status_biaya}
                onChange={e => setField('status_biaya', e.target.value)}
                className="brutal-input">
                {['Umum', 'BPJS', 'Gratis'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Dokter */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-widest flex justify-between ${errors.dokter ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}><span>Dokter Perujuk *</span>{errors.dokter && <span className="text-[10px] text-red-500 normal-case tracking-normal">{errors.dokter.message}</span>}</label>
            <select value={patient.dokter}
              onChange={e => setField('dokter', e.target.value)}
              className="brutal-input">
              <option value="">â€” Pilih Dokter â€”</option>
              {dokters.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Petugas */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-widest flex justify-between ${errors.petugas ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}><span>Petugas Pemeriksa *</span>{errors.petugas && <span className="text-[10px] text-red-500 normal-case tracking-normal">{errors.petugas.message}</span>}</label>
            <select value={patient.petugas}
              onChange={e => setField('petugas', e.target.value)}
              className="brutal-input">
              <option value="">â€” Pilih Petugas â€”</option>
              {petugasList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* â”€â”€ PARAMETER LAB (DYNAMIC) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="brutal-card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="brutal-icon-sm bg-orange-500 border-black dark:border-white"
            
          >
            <Stethoscope size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-black text-sm text-black dark:text-white uppercase">Parameter Lab</span>
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
              <div key={item.id} className="animate-stagger border-2 border-black dark:border-white rounded-xl p-3.5 transition-all duration-150 bg-white dark:bg-zinc-900" >
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
                  const abnormal = item.value ? isAbnormal(item.paramKey, item.value, patient.jenis_kelamin) : false;
                  const positive = item.value ? isPositivePregnancy(item.paramKey, item.value) : false;
                  const rangeText = getNormalRangeText(item.paramKey, patient.jenis_kelamin);
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
                          className={`input-premium ${abnormal ? '!border-red-300 dark:!border-red-800 !text-red-700 dark:!text-red-400 !bg-red-50 dark:!bg-red-950/30' : ''} ${positive ? '!border-emerald-300 dark:!border-emerald-800 !text-emerald-700 dark:!text-emerald-400 !bg-emerald-50 dark:!bg-emerald-950/30' : ''}`}
                        >
                          <option value="">â€” Pilih â€”</option>
                          {info.opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          inputMode={info.type === 'number' ? 'decimal' : 'text'}
                          value={item.value}
                          onChange={e => updateParam(item.id, 'value', e.target.value)}
                          placeholder={info.type === 'number' ? '0' : 'Isi hasil...'}
                          className={`input-premium ${abnormal ? '!border-red-300 dark:!border-red-800 !text-red-700 dark:!text-red-400 !bg-red-50 dark:!bg-red-950/30' : ''} ${positive ? '!border-emerald-300 dark:!border-emerald-800 !text-emerald-700 dark:!text-emerald-400 !bg-emerald-50 dark:!bg-emerald-950/30' : ''}`}
                        />
                      )}
                      {/* Inline abnormal warning */}
                      {abnormal && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <AlertTriangle size={11} className="text-red-500 flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-red-600">
                            Nilai di luar batas normal â€” segera laporkan ke dokter
                          </span>
                        </div>
                      )}
                      {/* Inline pregnancy positive */}
                      {positive && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Hasil positif â€” kehamilan terdeteksi
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
          className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-black dark:border-white text-black dark:text-white text-sm font-black uppercase hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-150"
        >
          <Plus size={16} />
          TAMBAH PARAMETER
        </button>
      </div>

      {/* â”€â”€ ACTION BUTTONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex gap-3 pb-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase transition-all duration-150 disabled:opacity-50 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmitForm)}
          disabled={loading}
          className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase text-white transition-all duration-150 disabled:opacity-50 border-2 border-black dark:border-white bg-orange-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          
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

