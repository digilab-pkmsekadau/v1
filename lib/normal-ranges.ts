// Batas nilai normal setiap parameter lab
// Format: { min?, max?, validValues? }
// Jika nilai di luar range → ditandai abnormal

export interface NormalRange {
  min?: number;
  max?: number;
  validValues?: string[]; // untuk parameter kategorikal
  unit?: string;
}

export const NORMAL_RANGES: Record<string, NormalRange> = {
  // ── HEMATOLOGI ────────────────────────────────────────────────
  rbc:   { min: 4.0,   max: 6.0,   unit: '10⁶/µl' },
  hgb:   { min: 12.0,  max: 18.0,  unit: 'g/dL' },
  hct:   { min: 36,    max: 54,    unit: '%' },
  mcv:   { min: 80,    max: 100,   unit: 'fL' },
  mch:   { min: 26,    max: 34,    unit: 'pg' },
  mchc:  { min: 31,    max: 37,    unit: 'g/dL' },
  plt:   { min: 150,   max: 400,   unit: '10³/µl' },
  wbc:   { min: 4.0,   max: 11.0,  unit: '10³/µl' },
  lym:   { min: 1.0,   max: 4.5,   unit: '10³/µl' },
  mon:   { min: 0.2,   max: 1.0,   unit: '10³/µl' },
  gra:   { min: 1.8,   max: 8.0,   unit: '10³/µl' },
  led:   { min: 0,     max: 20,    unit: 'mm/jam' },

  // ── KIMIA KLINIK ─────────────────────────────────────────────
  gds:              { min: 70,  max: 200,  unit: 'mg/dL' },
  gdp:              { min: 70,  max: 126,  unit: 'mg/dL' },
  gd2pp:            { min: 70,  max: 200,  unit: 'mg/dL' },
  kolesterol:       { min: 0,   max: 200,  unit: 'mg/dL' },
  trigliserida:     { min: 0,   max: 150,  unit: 'mg/dL' },

  // Asam Urat — berbeda per gender
  asam_urat_pria:   { min: 3.4, max: 7.0,  unit: 'mg/dL' },
  asam_urat_wanita: { min: 2.4, max: 6.0,  unit: 'mg/dL' },
  asam_urat:        { min: 2.4, max: 7.0,  unit: 'mg/dL' }, // fallback jika gender tidak diketahui

  // Fungsi Hati
  sgot:             { min: 0,   max: 40,   unit: 'U/L' },
  sgpt:             { min: 0,   max: 41,   unit: 'U/L' },
  protein_total:    { min: 6.4, max: 8.3,  unit: 'g/dL' },
  albumin:          { min: 3.5, max: 5.2,  unit: 'g/dL' },
  bilirubin_total:  { min: 0,   max: 1.2,  unit: 'mg/dL' },

  // Fungsi Ginjal
  ureum:            { min: 10,  max: 50,   unit: 'mg/dL' },
  kreatinin_pria:   { min: 0.7, max: 1.3,  unit: 'mg/dL' },
  kreatinin_wanita: { min: 0.5, max: 1.1,  unit: 'mg/dL' },
  kreatinin:        { min: 0.5, max: 1.3,  unit: 'mg/dL' }, // fallback jika gender tidak diketahui

  // ── URINALISA ─────────────────────────────────────────────────
  u_ph:             { min: 4.5, max: 8.5,  unit: '' },

};

/**
 * Cek apakah nilai lab di luar batas normal
 * @param key nama kolom parameter
 * @param value nilai yang diinput (string, bisa ada satuan di belakang)
 * @returns true jika abnormal
 */
export function isAbnormal(key: string, value: string | undefined | null): boolean {
  if (!value) return false;
  const range = NORMAL_RANGES[key];
  if (!range) return false;

  // Ambil angka pertama dari string (misal "14.5 g/dL" → 14.5)
  const numeric = parseFloat(value);
  if (isNaN(numeric)) return false;

  if (range.min !== undefined && numeric < range.min) return true;
  if (range.max !== undefined && numeric > range.max) return true;
  return false;
}

export function getNormalRangeText(key: string): string {
  const range = NORMAL_RANGES[key];
  if (!range) return '';
  if (range.min !== undefined && range.max !== undefined) {
    return `Normal: ${range.min}–${range.max} ${range.unit ?? ''}`.trim();
  }
  return '';
}
