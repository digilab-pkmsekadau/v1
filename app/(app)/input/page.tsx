'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, User, CheckCircle, RotateCcw, Loader2, Stethoscope, ChevronDown, Camera } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import PatientAutocomplete, { type PatientSuggestion } from '@/components/input/PatientAutocomplete';
import { isAbnormal, getNormalRangeText, isPositivePregnancy } from '@/lib/normal-ranges';
import { PARAM_OPTIONS, ALL_PARAMS } from '@/lib/param-options';
import { getTodayWIB } from '@/lib/utils';
import type { FormInputData, ParamItem, StatusBiaya } from '@/types';

// Daftar semua parameter lab (dikelompokkan)
// Konstanta dipindah ke `lib/param-options.ts`. Lihat impor di atas.

// Searchable Parameter Dropdown

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



export default function InputPage() {
  const { handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nama_pasien: '', nik: '', jenis_kelamin: '', alamat: '', tgl_lahir: '', tgl_permintaan: '',
      dokter: '', petugas: '', status_biaya: 'Umum'
    }
  });

  const patient = watch();
  // Nilai semua parameter: key -> value. Kosong = tidak disimpan (diabaikan saat submit).
  const [values, setValues] = useState<Record<string, string>>({});
  const [openGroups, setOpenGroups] = useState<string[]>(['Hematologi']);
  const [dokters, setDokters] = useState<string[]>([]);
  const [petugasList, setPetugasList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successNo, setSuccessNo] = useState<string | null>(null);
  const [matchedPatientId, setMatchedPatientId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<PatientSuggestion[]>([]);
  const [dupDismissed, setDupDismissed] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cek duplikat: nama mirip + tgl_lahir sama. Jalan saat ketikan berhenti 500ms,
  // hanya bila belum menaut ke pasien (matchedPatientId kosong) dan NIK kosong
  // (NIK terisi = sudah pasti orangnya via Prioritas 2, tak perlu tanya).
  useEffect(() => {
    setDupDismissed(false);
    const nama = (patient.nama_pasien ?? '').trim();
    const tgl = (patient.tgl_lahir ?? '').trim();
    const nik = (patient.nik ?? '').trim();
    if (matchedPatientId || nik || nama.length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      setDuplicates([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?duplicates=1&nama=${encodeURIComponent(nama)}&tgl_lahir=${tgl}`);
        if (!res.ok) return;
        const json = await res.json();
        setDuplicates((json.data ?? []).filter((d: PatientSuggestion) => d.id !== matchedPatientId));
      } catch { /* abaikan, simpan tetap jalan */ }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.nama_pasien, patient.tgl_lahir, patient.nik, matchedPatientId]);

  useEffect(() => {
    setValue('tgl_permintaan', getTodayWIB());
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setDokters(data.dokters || []);
        setPetugasList(data.petugas || []);
      })
      .catch(() => toast.error('Gagal memuat data dokter/petugas'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (field: keyof PatientFormData, value: string) => {
    setValue(field, value as unknown as PatientFormData[typeof field], { shouldValidate: true });
  };

  // Saat user pilih pasien dari dropdown autocomplete → auto-isi semua field identitas
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

  const setParamValue = (paramKey: string, val: string) =>
    setValues(prev => (val ? { ...prev, [paramKey]: val } : (({ [paramKey]: _, ...rest }) => rest)(prev)));

  const toggleGroup = (group: string) =>
    setOpenGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);

  const filledCount = Object.keys(values).length;

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
          // dilepas manual — kalau tidak, hasil bisa masuk ke riwayat pasien lain.
          if (key === 'nama_pasien' || key === 'nik') setMatchedPatientId(null);
        }
      }

      // Merge param AI: hanya isi key yang masih kosong.
      const incoming: Record<string, string> = {};
      if (Array.isArray(data.params)) {
        for (const x of data.params as { paramKey?: string; value?: string }[]) {
          if (x.paramKey && x.value && !values[x.paramKey]) incoming[x.paramKey] = x.value;
        }
      }
      if (Object.keys(incoming).length > 0) {
        setValues(prev => ({ ...prev, ...incoming }));
        const groups = PARAM_OPTIONS.filter(g => g.params.some(p => incoming[p.key])).map(g => g.group);
        setOpenGroups(prev => [...new Set([...prev, ...groups])]);
      }

      const added = Object.keys(incoming).length;
      toast.success(added > 0 ? `AI menambah ${added} parameter` : 'AI tidak menemukan nilai baru', {
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
    reset({
      nama_pasien: '', nik: '', jenis_kelamin: '', alamat: '', tgl_lahir: '',
      tgl_permintaan: getTodayWIB(), dokter: '', petugas: '', status_biaya: 'Umum'
    });
    setValues({});
    setSuccessNo(null);
    setMatchedPatientId(null);
    setDuplicates([]);
    setDupDismissed(false);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast.info('Form direset');
  };

  const onSubmitForm = async (data: PatientFormData) => {
    const filledParams: ParamItem[] = Object.entries(values)
      .filter(([, v]) => v.trim())
      .map(([paramKey, value], i) => ({ id: `p${i}`, paramKey, value }));
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

      const abnormals = filledParams.filter(p => isAbnormal(p.paramKey, p.value, patient.jenis_kelamin));
      setSuccessNo(responseData.no_urut);
      reset({ nama_pasien: '', nik: '', jenis_kelamin: '', alamat: '', tgl_lahir: '', tgl_permintaan: getTodayWIB(), dokter: '', petugas: '', status_biaya: 'Umum' });
      setValues({});
      setMatchedPatientId(null);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });

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
        toast.success(`Data tersimpan! No Urut: ${responseData.no_urut}`);
      }
    } catch {
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const filledRequired = [patient.nama_pasien, patient.jenis_kelamin, patient.tgl_permintaan, patient.dokter, patient.petugas].filter(Boolean).length;
  // Progress jujur: 5 identitas + param terisi. Tidak pernah 100 palsu.
  const progressPct = Math.min(99, Math.round(((filledRequired + filledCount) / (5 + Math.max(filledCount, 1))) * 100));

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 animate-slide-up" ref={topRef}>
      <div className="mb-5">
        <h1 className="text-2xl font-black text-black dark:text-white tracking-tight uppercase">Input Pemeriksaan</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1">Isi identitas pasien, lalu isi hasil pemeriksaan yang ada</p>
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
        className="brutal-btn mb-4 w-full py-3 text-sm bg-indigo-400 hover:bg-indigo-300 disabled:opacity-60"
        
      >
        {ocrLoading
          ? <><Loader2 size={16} className="animate-spin" /> Membaca foto…</>
          : <><Camera size={16} /> Isi dari Foto Hasil Lab</>}
      </button>

      {/* Success banner */}
      {successNo && (
        <div className="brutal-card mb-4 p-4 flex items-center gap-3 animate-stagger bg-emerald-400"
          
        >
          <CheckCircle size={20} className="text-teal-600 dark:text-teal-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-teal-800 dark:text-teal-300">Data tersimpan!</div>
            <div className="text-xs text-teal-600 dark:text-teal-400">No Urut: <span className="font-extrabold">{successNo}</span></div>
          </div>
        </div>
      )}
      {/* Peringatan duplikat: nama mirip + tgl lahir sama. Petugas pilih gabung atau baru. */}
      {!dupDismissed && duplicates.length > 0 && !matchedPatientId && (
        <div className="brutal-card mb-4 p-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30" role="alert">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-black text-amber-800 dark:text-amber-300">Mungkin pasien ini sudah terdaftar</p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-3">
            Nama mirip dan tanggal lahir sama. Gabung ke riwayat lama bila orang yang sama, atau abaikan bila orang berbeda.
          </p>
          <div className="flex flex-col gap-2">
            {duplicates.map(d => (
              <div key={d.id} className="flex items-center gap-2 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{d.nama}</div>
                  <div className="text-[11px] text-slate-500">
                    {d.tgl_lahir ? new Date(d.tgl_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    {typeof d.last_exam_count === 'number' && d.last_exam_count > 0 ? ` • ${d.last_exam_count}x periksa` : ' • belum pernah periksa'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { handleSelectPatient(d); setDuplicates([]); }}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-black uppercase text-white bg-teal-700 border-2 border-black dark:border-white"
                >
                  Gabung
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDupDismissed(true)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2 self-start"
            >
              Bukan mereka — ini pasien baru
            </button>
          </div>
        </div>
      )}

      {/* Identitas pasien */}
      <div className="brutal-card p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="brutal-icon-sm bg-teal-700 border-black dark:border-white"
            
          >
            <User size={16} className="text-white" />
          </div>
          <span className="font-black text-sm text-black dark:text-white uppercase">Identitas Pasien</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nama-pasien" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <span>Nama Lengkap *</span>
              {matchedPatientId && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 normal-case tracking-normal flex items-center gap-1">
                  <CheckCircle2 size={11} /> Pasien terdaftar
                </span>
              )}
            </label>
            <PatientAutocomplete
              id="nama-pasien"
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
              <label htmlFor="nik-pasien" className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">NIK</label>
              <PatientAutocomplete
                id="nik-pasien"
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
              <label htmlFor="jk-pasien" className={`text-[11px] font-bold uppercase tracking-widest flex justify-between ${errors.jenis_kelamin ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}><span>Jenis Kelamin *</span>{errors.jenis_kelamin && <span className="text-[10px] text-red-500 normal-case tracking-normal">{errors.jenis_kelamin.message}</span>}</label>
              <div className="relative">
                <select id="jk-pasien" value={patient.jenis_kelamin || ""}
                  onChange={e => setField('jenis_kelamin', e.target.value)}
                  className="brutal-input appearance-none pr-10"
                >
                  <option value="" disabled>-- Pilih --</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tgl-lahir" className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Tanggal Lahir</label>
              <input id="tgl-lahir" type="date" value={patient.tgl_lahir}
                onChange={e => setField('tgl_lahir', e.target.value)}
                className="brutal-input" />
            </div>
          </div>

          {/* Alamat */}
          <div className="flex flex-col gap-1">
            <label htmlFor="alamat-pasien" className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Alamat</label>
            <textarea id="alamat-pasien" value={patient.alamat}
              onChange={e => setField('alamat', e.target.value)}
              rows={2} placeholder="Alamat lengkap"
              className="brutal-input resize-none" />
          </div>

          {/* Tgl Permintaan + Status Biaya */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="tgl-permintaan" className={`text-[11px] font-bold uppercase tracking-widest flex justify-between ${errors.tgl_permintaan ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}><span>Tgl Permintaan *</span>{errors.tgl_permintaan && <span className="text-[10px] text-red-500 normal-case tracking-normal">{errors.tgl_permintaan.message}</span>}</label>
              <input id="tgl-permintaan" type="date" value={patient.tgl_permintaan}
                onChange={e => setField('tgl_permintaan', e.target.value)}
                className="brutal-input" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status-biaya" className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status Biaya</label>
              <select id="status-biaya" value={patient.status_biaya}
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
              <option value="">— Pilih Dokter —</option>
              {dokters.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Petugas */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-widest flex justify-between ${errors.petugas ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}><span>Petugas Pemeriksa *</span>{errors.petugas && <span className="text-[10px] text-red-500 normal-case tracking-normal">{errors.petugas.message}</span>}</label>
            <select value={patient.petugas}
              onChange={e => setField('petugas', e.target.value)}
              className="brutal-input">
              <option value="">— Pilih Petugas —</option>
              {petugasList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Parameter lab */}
      <div className="brutal-card p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="brutal-icon-sm bg-teal-700 border-black dark:border-white"
            
          >
            <Stethoscope size={16} className="text-white" />
          </div>
          <span className="font-black text-sm text-black dark:text-white uppercase">Parameter Lab</span>
          {filledCount > 0 && (
            <span className="ml-auto text-xs bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-bold px-2.5 py-1 rounded-full border border-teal-100 dark:border-teal-900/40">
              {filledCount} terisi — kosong tidak disimpan
            </span>
          )}
        </div>

        {/* Semua 52 parameter, dikelompokkan. Kosong = diabaikan saat simpan. */}
        <div className="flex flex-col gap-3">
          {PARAM_OPTIONS.map(group => {
            const groupFilled = group.params.filter(p => values[p.key]?.trim()).length;
            const isOpen = openGroups.includes(group.group);
            return (
              <div key={group.group} className="rounded-xl border-2 border-black dark:border-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.group)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-2 px-3.5 py-3 bg-gray-50 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <ChevronDown size={15} className={`text-teal-700 dark:text-teal-400 transition-transform duration-150 ${isOpen ? '' : '-rotate-90'}`} aria-hidden="true" />
                  <span className="font-black text-xs text-black dark:text-white uppercase tracking-wide text-left flex-1">{group.group}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${groupFilled > 0 ? 'bg-teal-700 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'}`}>
                    {groupFilled > 0 ? `${groupFilled} terisi` : `${group.params.length} parameter`}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-3 flex flex-col gap-3 bg-white dark:bg-zinc-900">
                    {group.params.map(param => {
                      const val = values[param.key] ?? '';
                      const abnormal = val ? isAbnormal(param.key, val, patient.jenis_kelamin) : false;
                      const positive = val ? isPositivePregnancy(param.key, val) : false;
                      const rangeText = getNormalRangeText(param.key, patient.jenis_kelamin);
                      return (
                        <div key={param.key} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <label htmlFor={`param-${param.key}`} className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {param.label}
                              {param.unit && <span className="text-slate-400 font-medium"> ({param.unit})</span>}
                            </label>
                            {rangeText && (
                              <span className={`text-[10px] font-medium flex-shrink-0 ${abnormal ? 'text-red-500' : 'text-slate-400'}`}>
                                {rangeText}
                              </span>
                            )}
                          </div>
                          {param.type === 'select' && param.opts ? (
                            <select
                              id={`param-${param.key}`}
                              value={val}
                              onChange={e => setParamValue(param.key, e.target.value)}
                              className={`brutal-input ${abnormal ? '!border-red-400 !bg-red-50 dark:!bg-red-950/30' : ''} ${positive ? '!border-emerald-400 !bg-emerald-50 dark:!bg-emerald-950/30' : ''}`}
                            >
                              <option value="">— Pilih —</option>
                              {param.opts.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              id={`param-${param.key}`}
                              type="text"
                              inputMode={param.type === 'number' ? 'decimal' : 'text'}
                              value={val}
                              onChange={e => setParamValue(param.key, e.target.value)}
                              placeholder={param.type === 'number' ? '0' : 'Isi hasil...'}
                              className={`brutal-input ${abnormal ? '!border-red-400 !bg-red-50 dark:!bg-red-950/30' : ''} ${positive ? '!border-emerald-400 !bg-emerald-50 dark:!bg-emerald-950/30' : ''}`}
                            />
                          )}
                          {abnormal && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <AlertTriangle size={11} className="text-red-500 flex-shrink-0" />
                              <span className="text-[11px] font-semibold text-red-600">
                                Nilai di luar batas normal — segera laporkan ke dokter
                              </span>
                            </div>
                          )}
                          {positive && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                              <span className="text-[11px] font-semibold text-emerald-600">
                                Hasil positif — kehamilan terdeteksi
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tombol aksi */}
      <div className="flex flex-col gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:gap-3 sm:pb-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="brutal-btn min-h-12 w-full py-3 sm:flex-1 disabled:opacity-50"
          
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmitForm)}
          disabled={loading}
          className="brutal-btn brutal-btn-action min-h-12 w-full py-3 sm:flex-[2] disabled:bg-gray-300 disabled:text-gray-800 disabled:cursor-not-allowed disabled:border-gray-800"
          
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

