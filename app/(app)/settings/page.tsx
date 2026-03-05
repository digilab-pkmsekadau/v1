'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings, Users, Stethoscope, Save, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function SettingsPage() {
  const [dokterList, setDokterList] = useState('');
  const [petugasList, setPetugasList] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // Ganti password
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setDokterList((data.dokters || []).join(', '));
        setPetugasList((data.petugas || []).join(', '));
      });
  }, []);

  const handleSave = async (key: string, value: string, label: string) => {
    if (!value.trim()) { toast.error(`${label} tidak boleh kosong`); return; }
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

  const handleChangePassword = async () => {
    if (!newPass || !confirmPass) { toast.error('Isi kedua kolom password'); return; }
    if (newPass.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    if (newPass !== confirmPass) { toast.error('Konfirmasi password tidak cocok'); return; }
    setSaving('password');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      toast.success('Password berhasil diubah!');
      setNewPass(''); setConfirmPass('');
    } catch {
      toast.error('Gagal mengubah password');
    } finally {
      setSaving(null);
    }
  };

  const SaveButton = ({ keyName, label }: { keyName: string; label: string }) => (
    <button
      onClick={() => handleSave(keyName, keyName === 'LIST_DOKTER' ? dokterList : petugasList, label)}
      disabled={saving === keyName}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
    >
      {saving === keyName ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      Simpan
    </button>
  );

  return (
    <div className="px-4 py-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}>
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Pengaturan</h1>
          <p className="text-xs text-slate-400 font-medium">Konfigurasi aplikasi</p>
        </div>
      </div>

      {/* ── Ganti Password ────────────────────────────────────── */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-teal-600" />
          <h2 className="text-sm font-extrabold text-slate-700">Ganti Password</h2>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Password Baru (min. 6 karakter)</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={saving === 'password'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
          >
            {saving === 'password' ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            Ubah Password
          </button>
        </div>
      </div>

      {/* ── Daftar Dokter ─────────────────────────────────────── */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-700">Daftar Dokter</h2>
          </div>
          <SaveButton keyName="LIST_DOKTER" label="Daftar Dokter" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Pisahkan dengan koma (,)</label>
          <textarea
            value={dokterList}
            onChange={e => setDokterList(e.target.value)}
            rows={4}
            placeholder="dr. Nama Dokter 1, dr. Nama Dokter 2"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400 resize-none"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Preview: {dokterList.split(',').filter(Boolean).length} dokter
        </p>
      </div>

      {/* ── Daftar Petugas ────────────────────────────────────── */}
      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-purple-600" />
            <h2 className="text-sm font-extrabold text-slate-700">Daftar Petugas</h2>
          </div>
          <SaveButton keyName="LIST_PETUGAS" label="Daftar Petugas" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Pisahkan dengan koma (,)</label>
          <textarea
            value={petugasList}
            onChange={e => setPetugasList(e.target.value)}
            rows={3}
            placeholder="Nama Petugas 1, Nama Petugas 2"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-400 resize-none"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Preview: {petugasList.split(',').filter(Boolean).length} petugas
        </p>
      </div>

      {/* Info */}
      <div className="glass-panel p-4 bg-slate-50 border-slate-200">
        <p className="text-xs text-slate-500 text-center font-medium">DigiLab Puskesmas • Versi 1.0.0</p>
        <p className="text-xs text-slate-400 text-center mt-1">Powered by Next.js + Supabase</p>
      </div>
    </div>
  );
}
