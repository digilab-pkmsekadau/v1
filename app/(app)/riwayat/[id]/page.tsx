'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Printer, Pencil, Save, X, AlertTriangle,
  User, Stethoscope, Calendar, CreditCard, Loader2
} from 'lucide-react';
import { isAbnormal, getNormalRangeText } from '@/lib/normal-ranges';
import { PARAM_OPTIONS } from '@/app/(app)/input/page';

// semua param flat
const ALL_PARAMS = PARAM_OPTIONS.flatMap(g => g.params.map(p => ({ ...p, group: g.group })));

// ─── Tipe data ───────────────────────────────────────────────────────────────
interface ExamDetail {
  id: string;
  no_urut: string;
  tgl_permintaan: string;
  dokter: string;
  petugas: string;
  status_biaya: string;
  created_at: string;
  patients: {
    nama: string;
    nik?: string;
    alamat?: string;
    tgl_lahir?: string;
  };
  [key: string]: unknown;
}

// ─── Komponen nilai lab ───────────────────────────────────────────────────────
function LabValue({
  paramKey, value, editMode, onChange,
}: {
  paramKey: string;
  value: string;
  editMode: boolean;
  onChange: (v: string) => void;
}) {
  const param = ALL_PARAMS.find(p => p.key === paramKey);
  const abnormal = isAbnormal(paramKey, value);
  const rangeText = getNormalRangeText(paramKey);

  if (editMode) {
    if (param?.type === 'select' && param.opts) {
      return (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-400">
          <option value="">— Pilih —</option>
          {param.opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input type={param?.type === 'number' ? 'number' : 'text'} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-400"
      />
    );
  }

  return (
    <div className={`text-sm font-semibold flex items-center gap-1 ${abnormal ? 'text-red-600' : 'text-slate-800'}`}>
      {abnormal && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
      <span>{value || '—'}</span>
      {abnormal && rangeText && (
        <span className="text-[10px] font-normal text-red-400 ml-1">({rangeText})</span>
      )}
    </div>
  );
}

// ─── Halaman utama ────────────────────────────────────────────────────────────
export default function RiwayatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/examinations/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data);
    } catch {
      toast.error('Gagal memuat detail pemeriksaan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const startEdit = () => {
    if (!data) return;
    // Extract all lab param values into editData
    const initial: Record<string, string> = {
      tgl_permintaan: data.tgl_permintaan ?? '',
      dokter: data.dokter ?? '',
      petugas: data.petugas ?? '',
      status_biaya: data.status_biaya ?? '',
    };
    ALL_PARAMS.forEach(p => {
      initial[p.key] = (data[p.key] as string) ?? '';
    });
    setEditData(initial);
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/examinations/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error();
      toast.success('Data berhasil diperbarui');
      setEditMode(false);
      fetchDetail();
    } catch {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={32} className="animate-spin text-teal-500" />
        <p className="text-sm text-slate-400">Memuat data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-slate-400 text-sm">Data tidak ditemukan.</p>
        <button onClick={() => router.back()} className="mt-3 text-teal-600 text-sm font-semibold">← Kembali</button>
      </div>
    );
  }

  const getVal = (key: string) => editMode ? (editData[key] ?? '') : ((data[key] as string) ?? '');

  // Hanya tampilkan grup yang ada nilainya
  const filledGroups = PARAM_OPTIONS.map(group => ({
    ...group,
    params: group.params.filter(p => {
      const val = editMode ? (editData[p.key] ?? '') : ((data[p.key] as string) ?? '');
      return editMode || val; // saat edit mode tampilkan semua
    }),
  })).filter(g => g.params.length > 0);

  const abnormalCount = ALL_PARAMS.filter(p => isAbnormal(p.key, data[p.key] as string)).length;

  return (
    <>
      {/* ── Print-only header ─────────────────────────────────── */}
      <div className="print:block hidden mb-4 text-center border-b pb-3">
        <h1 className="text-xl font-extrabold">DigiLab Puskesmas Sekadau</h1>
        <p className="text-sm text-gray-500">Hasil Pemeriksaan Laboratorium</p>
      </div>

      {/* ── Screen layout ─────────────────────────────────────── */}
      <div className="px-4 py-5 print:px-6 print:py-4 animate-slide-up">

        {/* Header / Toolbar */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 transition-colors text-sm font-semibold">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex items-center gap-2">
            {!editMode ? (
              <>
                <button onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                  <Printer size={14} /> Print
                </button>
                <button onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
                  <Pencil size={14} /> Edit
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(false)} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-600">
                  <X size={14} /> Batal
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Simpan
                </button>
              </>
            )}
          </div>
        </div>

        {/* Judul print */}
        <div className="mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-slate-800">
              Detail Pemeriksaan
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700">
              {data.no_urut}
            </span>
          </div>
          {abnormalCount > 0 && !editMode && (
            <div className="flex items-center gap-1.5 mt-1 text-red-500 text-xs font-semibold">
              <AlertTriangle size={13} />
              {abnormalCount} nilai di luar batas normal
            </div>
          )}
        </div>

        {/* Info Pasien */}
        <div className="glass-panel p-4 mb-4 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <User size={15} className="text-teal-600" />
            <span className="font-extrabold text-sm text-slate-700">Data Pasien</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Nama</div>
              <div className="font-semibold text-slate-800">{data.patients?.nama ?? '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">NIK</div>
              <div className="text-slate-600">{data.patients?.nik || '—'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Alamat</div>
              <div className="text-slate-600">{data.patients?.alamat || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tgl Lahir</div>
              <div className="text-slate-600">{data.patients?.tgl_lahir || '—'}</div>
            </div>
          </div>
        </div>

        {/* Info Kunjungan */}
        <div className="glass-panel p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} className="text-blue-600" />
            <span className="font-extrabold text-sm text-slate-700">Info Kunjungan</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
            {[
              { label: 'Tgl Permintaan', key: 'tgl_permintaan', type: 'date' },
              { label: 'Status Biaya', key: 'status_biaya', type: editMode ? 'select' : 'text', opts: ['Umum','BPJS','Gratis'] },
              { label: 'Dokter', key: 'dokter', type: 'text' },
              { label: 'Petugas', key: 'petugas', type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <div className="text-[10px] font-bold text-slate-400 uppercase">{field.label}</div>
                {editMode ? (
                  field.type === 'select' ? (
                    <select value={editData[field.key] ?? ''} onChange={e => setEditData(d => ({ ...d, [field.key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-400">
                      {(field.opts || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={field.type} value={editData[field.key] ?? ''}
                      onChange={e => setEditData(d => ({ ...d, [field.key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-400"
                    />
                  )
                ) : (
                  <div className="text-slate-700 font-medium">{(data[field.key] as string) || '—'}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hasil Lab per Kategori */}
        {filledGroups.length === 0 && !editMode ? (
          <div className="glass-panel p-6 text-center text-slate-400 text-sm">
            Belum ada hasil pemeriksaan lab yang diinput.
          </div>
        ) : (
          filledGroups.map(group => (
            <div key={group.group} className="glass-panel p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope size={15} className="text-purple-600" />
                <span className="font-extrabold text-sm text-slate-700">{group.group}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-3">
                {group.params.map(param => (
                  <div key={param.key}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight mb-0.5">
                      {param.label}
                      {param.unit ? <span className="normal-case font-normal"> ({param.unit})</span> : ''}
                    </div>
                    <LabValue
                      paramKey={param.key}
                      value={getVal(param.key)}
                      editMode={editMode}
                      onChange={v => setEditData(d => ({ ...d, [param.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        <div className="glass-panel p-3 text-center print:block">
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
            <CreditCard size={12} /> {data.status_biaya}
            <span>•</span>
            <span>Petugas: {data.petugas || '—'}</span>
            <span>•</span>
            <span>Dokter: {data.dokter || '—'}</span>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          nav, header, footer { display: none !important; }
          body { background: white !important; }
          .glass-panel { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>
    </>
  );
}
