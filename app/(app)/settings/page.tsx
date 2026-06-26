'use client';

import { Settings, Users, Stethoscope, Save, Loader2, Shield, Tag, Trash2, AlertTriangle, Download, DatabaseBackup, Upload, Image, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useConfirm } from '@/components/ui/ConfirmDialog';

function SaveButton({ keyName, label, value, saving, onSave }: { keyName: string; label: string; value: string; saving: string | null; onSave: (key: string, value: string, label: string) => void }) {
  return (
    <button
      onClick={() => onSave(keyName, value, label)}
      disabled={saving === keyName}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
      style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', boxShadow: '0 4px 16px -4px rgba(13,148,136,0.35)' }}
    >
      {saving === keyName ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      Simpan
    </button>
  );
}

function TagPills({ text, color }: { text: string; color: string }) {
  const items = text.split(',').map(s => s.trim()).filter(Boolean);
  if (items.length === 0) return <span className="text-xs text-slate-400 dark:text-slate-500 italic">Belum ada data</span>;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map((item, i) => (
        <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${color}`}>
          <Tag size={10} />
          {item}
        </span>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [dokterList, setDokterList] = useState('');
  const [petugasList, setPetugasList] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  
  const [deleteYear, setDeleteYear] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [doctorSignature, setDoctorSignature] = useState('');
  const [techSignature, setTechSignature] = useState('');
  const [printTemplate, setPrintTemplate] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setDokterList((data.dokters || []).join(', '));
        setPetugasList((data.petugas || []).join(', '));
        setLogoUrl(data.logo_url || '');
        setDoctorSignature(data.doctor_signature || '');
        setTechSignature(data.tech_signature || '');
        setPrintTemplate(data.print_template || '');
      })
      .catch(() => {
        toast.error('Gagal memuat konfigurasi');
      });
  }, []);

  const handleSave = async (key: string, value: string, label: string) => {
    if (!value.trim() && key !== 'logo_url' && key !== 'doctor_signature' && key !== 'tech_signature' && key !== 'print_template') { 
      toast.error(`${label} tidak boleh kosong`); return; 
    }
    setSaving(key);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: value.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${label} berhasil disimpan`);
    } catch {
      toast.error(`Gagal menyimpan ${label}`);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteYear = async () => {
    if (!deleteYear) {
      toast.error('Pilih tahun terlebih dahulu');
      return;
    }
    const ok = await confirm({
      title: `Hapus Data ${deleteYear}?`,
      message: `PERINGATAN! Anda akan menghapus SEMUA data pemeriksaan di tahun ${deleteYear}. Data yang dihapus tidak dapat dikembalikan.`,
      confirmLabel: 'Ya, Hapus Data',
      variant: 'danger',
      icon: 'trash',
      verificationText: `HAPUS-${deleteYear}`,
    });
    if (!ok) return;

    setSaving('delete_year');
    try {
      const res = await fetch('/api/examinations/yearly', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: deleteYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Berhasil menghapus seluruh data tahun ${deleteYear}`);
      setDeleteYear('');
    } catch {
      toast.error(`Gagal menghapus data tahun ${deleteYear}`);
    } finally {
      setSaving(null);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat backup');
      }
      // Unduh file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_digilab_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Backup berhasil diunduh!');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="px-4 py-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
          <Settings size={19} className="text-white relative z-10" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Pengaturan</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Konfigurasi aplikasi</p>
        </div>
      </div>



      {/* ── Daftar Dokter ─────────────────────────────────────── */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(59,130,246,0.08))' }}
            >
              <Stethoscope size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Daftar Dokter</h2>
          </div>
          <SaveButton keyName="LIST_DOKTER" label="Daftar Dokter" value={dokterList} saving={saving} onSave={handleSave} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pisahkan dengan koma (,)</label>
          <textarea
            value={dokterList}
            onChange={e => setDokterList(e.target.value)}
            rows={4}
            placeholder="dr. Nama Dokter 1, dr. Nama Dokter 2"
            className="input-premium resize-none"
          />
        </div>
        <TagPills text={dokterList} color="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40" />
      </div>

      {/* ── Daftar Petugas ────────────────────────────────────── */}
      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.08))' }}
            >
              <Users size={15} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Daftar Petugas</h2>
          </div>
          <SaveButton keyName="LIST_PETUGAS" label="Daftar Petugas" value={petugasList} saving={saving} onSave={handleSave} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pisahkan dengan koma (,)</label>
          <textarea
            value={petugasList}
            onChange={e => setPetugasList(e.target.value)}
            rows={3}
            placeholder="Nama Petugas 1, Nama Petugas 2"
            className="input-premium resize-none"
          />
        </div>
        <TagPills text={petugasList} color="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40" />
      </div>

      {/* ── Audit Log ─────────────────────────────────────────── */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(147,51,234,0.08))' }}
            >
              <Shield size={15} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Audit Log</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Riwayat perubahan data sistem</p>
            </div>
          </div>
          <a
            href="/settings/audit"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 4px 16px -4px rgba(124,58,237,0.35)' }}
          >
            Lihat Log →
          </a>
        </div>
      </div>
      {/* ── Backup Database ────────────────────────────────────── */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.14), rgba(16,185,129,0.08))' }}
            >
              <DatabaseBackup size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Backup Database</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Unduh seluruh data pasien &amp; pemeriksaan (.JSON)
              </p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 16px -4px rgba(5,150,105,0.35)' }}
          >
            {backingUp ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {backingUp ? 'Memproses...' : 'Unduh Backup'}
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Semua Pasien', desc: 'Data identitas & NIK' },
            { label: 'Semua Pemeriksaan', desc: 'Semua hasil lab' },
            { label: 'Konfigurasi', desc: 'Daftar Dokter & Petugas' },
          ].map(item => (
            <div key={item.label}
              className="p-3 rounded-xl text-center"
              style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.06), rgba(16,185,129,0.03))', border: '1px solid rgba(5,150,105,0.12)' }}
            >
              <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">{item.label}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Manajemen Data Tahunan ────────────────────────────── */}
      <div className="glass-panel p-5 mt-6 mb-6 border border-red-200/50 dark:border-red-900/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-red-50/30 dark:bg-red-950/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-red-700 dark:text-red-400">Manajemen Data</h2>
              <p className="text-[11px] text-red-500/80 font-medium tracking-wide">Hapus massal data riwayat pemeriksaan</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-end gap-3 p-4 rounded-xl border border-red-100 dark:border-red-900/40 bg-white/50 dark:bg-slate-900/50">
            <div className="flex-1 w-full relative">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Tahun yang Dihapus</label>
              <select
                value={deleteYear}
                onChange={e => setDeleteYear(e.target.value)}
                className="input-premium appearance-none"
              >
                <option value="" disabled>-- Pilih Tahun --</option>
                {Array.from({ length: 15 }, (_, i) => String(2020 + i)).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleDeleteYear}
              disabled={saving === 'delete_year'}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-[11px] rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 16px -4px rgba(239,68,68,0.35)' }}
            >
              {saving === 'delete_year' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Hapus Data
            </button>
          </div>
        </div>
      </div>

      {/* ── Kustomisasi Kop Surat ──────────────────────────────── */}
      <div className="glass-panel p-5 mt-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(234,179,8,0.08))' }}
          >
            <FileText size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Kustomisasi Kop Surat</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Konfigurasi tampilan cetak hasil lab</p>
          </div>
        </div>

        {/* Logo Puskesmas */}
        <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
            Logo Puskesmas
          </label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Puskesmas" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs">Belum ada</div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="URL gambar logo (http/https)"
                className="input-premium mb-2"
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors">
                  <Upload size={12} />
                  Upload (placeholder)
                </label>
                {logoUrl && (
                  <button
                    onClick={() => { setLogoUrl(''); handleSave('logo_url', '', 'Logo'); }}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tanda Tangan Dokter */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
            Tanda Tangan Dokter (Nama/License)
          </label>
          <input
            type="text"
            value={doctorSignature}
            onChange={e => setDoctorSignature(e.target.value)}
            placeholder="Nama Dokter / Nomor SIP"
            className="input-premium"
          />
        </div>

        {/* Tanda Tangan Petugas */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
            Tanda Tangan Petugas Laboratorium
          </label>
          <input
            type="text"
            value={techSignature}
            onChange={e => setTechSignature(e.target.value)}
            placeholder="Nama Petugas"
            className="input-premium"
          />
        </div>

        {/* Template Cetak */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
            Template Cetak (Custom Header)
          </label>
          <textarea
            value={printTemplate}
            onChange={e => setPrintTemplate(e.target.value)}
            rows={3}
            placeholder="Header khusus untuk cetak (opsional)"
            className="input-premium resize-none"
          />
          <button
            onClick={() => handleSave('print_template', printTemplate, 'Template Cetak')}
            disabled={saving === 'print_template'}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 16px -4px rgba(245,158,11,0.35)' }}
          >
            {saving === 'print_template' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan Template
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="glass-panel p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-semibold">DigiLab Puskesmas • Versi 1.0.0</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1">Powered by Next.js + Supabase</p>
      </div>
    </div>
  );
}
