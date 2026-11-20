﻿'use client';

import { Settings, Users, Stethoscope, Save, Loader2, Shield, Tag, Trash2, AlertTriangle, Download, DatabaseBackup, Upload, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useConfirm } from '@/components/ui/ConfirmDialog';

function SaveButton({ keyName, label, value, saving, onSave }: { keyName: string; label: string; value: string; saving: string | null; onSave: (key: string, value: string, label: string) => void }) {
  return (
    <button
      onClick={() => onSave(keyName, value, label)}
      disabled={saving === keyName}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-slate-900 border-2 border-black dark:border-white bg-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all"
      
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
  const [restoring, setRestoring] = useState(false);
  const [restorePreview, setRestorePreview] = useState<{ patients: { baru: number; ada: number }; examinations: { baru: number; ada: number } } | null>(null);
  const restoreFileRef = useRef<File | null>(null);
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

  const handleRestoreFile = async (file: File) => {
    setRestoring(true);
    setRestorePreview(null);
    try {
      const json = JSON.parse(await file.text());
      const payload = json.data ? json : { data: json };
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: true, ...payload }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'File tidak valid');
      restoreFileRef.current = file;
      setRestorePreview(out);
      toast.info(`Simulasi: ${out.patients.baru} pasien baru, ${out.examinations.baru} pemeriksaan baru`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca file');
    } finally {
      setRestoring(false);
    }
  };

  const handleRestoreExec = async () => {
    const file = restoreFileRef.current;
    if (!file) return;
    const ok = await confirm({
      title: 'Restore Backup?',
      message: `Menulis ${restorePreview?.patients.baru ?? 0} pasien + ${restorePreview?.examinations.baru ?? 0} pemeriksaan baru (data lama ber-id sama DITIMPA). Ketik RESTORE untuk lanjut.`,
      confirmLabel: 'Ya, Restore',
      variant: 'danger',
      icon: 'warning',
      verificationText: 'RESTORE',
    });
    if (!ok) return;
    setRestoring(true);
    try {
      const json = JSON.parse(await file.text());
      const payload = json.data ? json : { data: json };
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: false, ...payload }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Restore gagal');
      toast.success(`Restore selesai: ${out.restoredPatients} pasien, ${out.restoredExams} pemeriksaan`);
      setRestorePreview(null);
      restoreFileRef.current = null;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Restore gagal');
    } finally {
      setRestoring(false);
    }
  };
  return (
    <div className="px-4 py-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="brutal-icon-lg bg-teal-700 border-black dark:border-white"
          >
          <Settings size={19} className="text-white relative z-10" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white tracking-tight uppercase">Pengaturan</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">Konfigurasi aplikasi</p>
        </div>
      </div>



      {/* Daftar dokter */}
      <div className="brutal-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="brutal-icon-sm bg-indigo-400 border-black dark:border-white"
              
            >
              <Stethoscope size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-sm font-black text-black dark:text-white uppercase">Daftar Dokter</h2>
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
            className="brutal-input resize-none"
          />
        </div>
        <TagPills text={dokterList} color="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40" />
      </div>

      {/* Daftar petugas */}
      <div className="brutal-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="brutal-icon-sm bg-indigo-400 border-black dark:border-white"
              
            >
              <Users size={15} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-sm font-black text-black dark:text-white uppercase">Daftar Petugas</h2>
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
            className="brutal-input resize-none"
          />
        </div>
        <TagPills text={petugasList} color="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40" />
      </div>

      {/* Audit log */}
      <div className="brutal-card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="brutal-icon-sm bg-indigo-400 border-black dark:border-white"
              
            >
              <Shield size={15} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-black dark:text-white uppercase">Audit Log</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Riwayat perubahan data sistem</p>
            </div>
          </div>
          <a
            href="/settings/audit"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase text-white border-2 border-black dark:border-white bg-indigo-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            
          >
            Lihat Log →
          </a>
        </div>
      </div>
      {/* Backup database */}
      <div className="brutal-card p-5 mb-4">
        <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
          <div className="flex items-center gap-3">
            <div className="brutal-icon-sm bg-indigo-400 border-black dark:border-white"
              
            >
              <DatabaseBackup size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-black dark:text-white uppercase">Backup Database</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Unduh seluruh data pasien &amp; pemeriksaan (.JSON)
              </p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-white border-2 border-black dark:border-white bg-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all"
            
          >
            {backingUp ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {backingUp ? 'Memproses...' : 'Unduh Backup'}
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 gap-2 mt-4 min-[420px]:grid-cols-3">
          {[
            { label: 'Semua Pasien', desc: 'Data identitas & NIK' },
            { label: 'Semua Pemeriksaan', desc: 'Semua hasil lab' },
            { label: 'Konfigurasi', desc: 'Daftar Dokter & Petugas' },
          ].map(item => (
            <div key={item.label}
              className="p-3 rounded-xl text-center border-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
            >
              <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">{item.label}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Restore — admin only, diawali simulasi */}
        <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            Restore dari File Backup (.JSON)
          </div>
          <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center">
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase border-2 border-black dark:border-white bg-white dark:bg-zinc-800 hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
              <Upload size={14} />
              {restoring ? 'Memproses...' : 'Pilih File (simulasi)'}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                disabled={restoring}
                onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleRestoreFile(f); }}
              />
            </label>
            {restorePreview && (
              <button
                onClick={handleRestoreExec}
                disabled={restoring}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase text-white border-2 border-black dark:border-white bg-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition-all"
              >
                Eksekusi Restore ({restorePreview.patients.baru} baru)
              </button>
            )}
          </div>
          {restorePreview && (
            <p className="text-[11px] text-slate-500 mt-2 font-semibold">
              Simulasi: {restorePreview.patients.baru} pasien baru + {restorePreview.examinations.baru} pemeriksaan baru.
              {' '}Data ber-id sama DITIMPA. Ketik RESTORE untuk konfirmasi.
            </p>
          )}
        </div>
      </div>

      {/* Manajemen data tahunan */}
      <div className="brutal-card p-5 mt-6 mb-6 relative border-2 border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/20">
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-[11px] rounded-xl text-sm font-black uppercase text-white border-2 border-black dark:border-white bg-rose-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all whitespace-nowrap"
              
            >
              {saving === 'delete_year' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Hapus Data
            </button>
          </div>
        </div>
      </div>

      {/* Kustomisasi kop surat */}
      <div className="brutal-card p-5 mt-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="brutal-icon-sm bg-indigo-400 border-black dark:border-white"
            
          >
            <FileText size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-black dark:text-white uppercase">Kustomisasi Kop Surat</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Konfigurasi tampilan cetak hasil lab</p>
          </div>
        </div>

        {/* Logo Puskesmas */}
        <div className="mb-4 p-4 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-zinc-900">
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
                className="brutal-input mb-2"
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
            className="brutal-input"
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
            className="brutal-input"
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
            className="brutal-input resize-none"
          />
          <button
            onClick={() => handleSave('print_template', printTemplate, 'Template Cetak')}
            disabled={saving === 'print_template'}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase text-white border-2 border-black dark:border-white bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all"
            
          >
            {saving === 'print_template' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan Template
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="brutal-card p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-semibold">DigiLab Puskesmas • Versi 1.0.0</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1">Powered by Next.js + Supabase</p>
      </div>
    </div>
  );
}

