'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, History, X } from 'lucide-react';

export interface PatientSuggestion {
  id: string;
  nama: string;
  nik: string | null;
  jenis_kelamin: string | null;
  alamat: string | null;
  tgl_lahir: string | null;
  last_status_biaya?: string | null;
}

interface Props {
  /** Field yang sedang diedit: 'nama' atau 'nik' */
  field: 'nama' | 'nik';
  /** Nilai input saat ini */
  value: string;
  /** Callback saat user mengetik */
  onChange: (val: string) => void;
  /** Callback saat user memilih pasien dari dropdown */
  onSelect: (patient: PatientSuggestion) => void;
  /** Placeholder input */
  placeholder?: string;
  /** className tambahan untuk input */
  className?: string;
  /** Atribut HTML lain pada <input> */
  inputMode?: 'text' | 'numeric' | 'decimal';
  pattern?: string;
}

/**
 * Autocomplete pasien — cari berdasarkan nama atau NIK.
 * Memunculkan dropdown saat user mengetik ≥ 2 karakter.
 */
export default function PatientAutocomplete({
  field, value, onChange, onSelect, placeholder, className, inputMode, pattern,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PatientSuggestion[]>([]);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lock pencarian saat user baru saja memilih item, supaya dropdown tidak muncul lagi
  const skipNextSearchRef = useRef(false);

  // Tutup dropdown saat klik di luar
  const handleOutside = useCallback((e: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, handleOutside]);

  // Debounced search
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setItems(json.data || []);
        setOpen(true);
        setHighlight(0);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const choose = (p: PatientSuggestion) => {
    skipNextSearchRef.current = true;
    onSelect(p);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const p = items[highlight];
      if (p) choose(p);
    }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  // Format tanggal lahir → "12 Mar 1990"
  const fmtDate = (s: string | null) => {
    if (!s) return '-';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return s; }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { if (items.length > 0 && value.trim().length >= 2) setOpen(true); }}
          placeholder={placeholder}
          inputMode={inputMode}
          pattern={pattern}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>

      {open && items.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden"
          style={{ maxHeight: 320 }}>
          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800">
            <History size={11} /> Riwayat Pasien — {items.length} hasil
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            {items.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => choose(p)}
                onMouseEnter={() => setHighlight(idx)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0
                  ${idx === highlight
                    ? 'bg-teal-50 dark:bg-teal-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-slate-700 dark:text-slate-200 truncate">
                    {field === 'nik' && p.nik ? (
                      <span><span className="text-teal-600 dark:text-teal-400">{p.nik}</span> · {p.nama}</span>
                    ) : (
                      p.nama
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                    {p.jenis_kelamin === 'L' ? '♂ L' : p.jenis_kelamin === 'P' ? '♀ P' : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {field !== 'nik' && p.nik && <span className="font-mono">{p.nik}</span>}
                  {p.tgl_lahir && <span>· {fmtDate(p.tgl_lahir)}</span>}
                  {p.alamat && <span className="truncate">· {p.alamat}</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>↑↓ navigasi · Enter pilih · Esc tutup</span>
            <button type="button" onClick={() => setOpen(false)} className="hover:text-slate-600">
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
