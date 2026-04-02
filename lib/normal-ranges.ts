// Batas nilai normal setiap parameter lab
// Format: { min?, max?, validValues? }
// Jika nilai di luar range → ditandai abnormal

export interface NormalRange {
  min?: number;
  max?: number;
  pria?: { min?: number; max?: number };
  wanita?: { min?: number; max?: number };
  validValues?: string[]; // untuk parameter kategorikal
  unit?: string;
}

export const NORMAL_RANGES: Record<string, NormalRange> = {
  // ── HEMATOLOGI ────────────────────────────────────────────────
  rbc:   { min: 4.0, max: 6.0, pria: { min: 4.5, max: 5.9 }, wanita: { min: 4.1, max: 5.1 }, unit: '10⁶/µl' },
  hgb:   { min: 12.0, max: 18.0, pria: { min: 13.0, max: 18.0 }, wanita: { min: 12.0, max: 16.0 }, unit: 'g/dL' },
  hct:   { min: 36, max: 54, pria: { min: 40, max: 54 }, wanita: { min: 36, max: 48 }, unit: '%' },
  mcv:   { min: 80,    max: 100,   unit: 'fL' },
  mch:   { min: 26,    max: 34,    unit: 'pg' },
  mchc:  { min: 31,    max: 37,    unit: 'g/dL' },
  plt:   { min: 150,   max: 400,   unit: '10³/µl' },
  wbc:   { min: 4.0,   max: 11.0,  unit: '10³/µl' },
  lym:   { min: 1.0,   max: 4.5,   unit: '10³/µl' },
  mon:   { min: 0.2,   max: 1.0,   unit: '10³/µl' },
  gra:   { min: 1.8,   max: 8.0,   unit: '10³/µl' },
  led:   { min: 0, max: 20, pria: { min: 0, max: 15 }, wanita: { min: 0, max: 20 }, unit: 'mm/jam' },

  // ── KIMIA KLINIK ─────────────────────────────────────────────
  gds:              { min: 70,  max: 200,  unit: 'mg/dL' },
  gdp:              { min: 70,  max: 126,  unit: 'mg/dL' },
  gd2pp:            { min: 70,  max: 200,  unit: 'mg/dL' },
  kolesterol:       { min: 0,   max: 200,  unit: 'mg/dL' },
  trigliserida:     { min: 0,   max: 150,  unit: 'mg/dL' },

  // Asam Urat — berbeda per gender
  asam_urat:        { min: 2.4, max: 7.0, pria: { min: 3.4, max: 7.0 }, wanita: { min: 2.4, max: 6.0 }, unit: 'mg/dL' },

  // Fungsi Hati
  sgot:             { min: 0,   max: 40,   unit: 'U/L' },
  sgpt:             { min: 0,   max: 41,   unit: 'U/L' },
  protein_total:    { min: 6.4, max: 8.3,  unit: 'g/dL' },
  albumin:          { min: 3.5, max: 5.2,  unit: 'g/dL' },
  bilirubin_total:  { min: 0,   max: 1.2,  unit: 'mg/dL' },

  // Fungsi Ginjal
  ureum:            { min: 10,  max: 50,   unit: 'mg/dL' },
  kreatinin:        { min: 0.5, max: 1.3, pria: { min: 0.7, max: 1.3 }, wanita: { min: 0.5, max: 1.1 }, unit: 'mg/dL' },

  // ── URINALISA ─────────────────────────────────────────────────
  u_ph:             { min: 4.5, max: 8.5,  unit: '' },

};

/**
 * Cek apakah nilai lab di luar batas normal
 * @param key nama kolom parameter
 * @param value nilai yang diinput (string, bisa ada satuan di belakang)
 * @returns true jika abnormal
 */
export function isAbnormal(key: string, value: string | undefined | null, gender?: 'L' | 'P' | string | null): boolean {
  if (!value) return false;
  const range = NORMAL_RANGES[key];
  if (!range) return false;

  const numeric = parseFloat(value);
  if (isNaN(numeric)) return false;

  let min = range.min;
  let max = range.max;

  if (gender === 'L' && range.pria) {
    min = range.pria.min ?? min;
    max = range.pria.max ?? max;
  } else if (gender === 'P' && range.wanita) {
    min = range.wanita.min ?? min;
    max = range.wanita.max ?? max;
  }

  if (min !== undefined && numeric < min) return true;
  if (max !== undefined && numeric > max) return true;
  return false;
}

export function getNormalRangeText(key: string, gender?: 'L' | 'P' | string | null): string {
  const range = NORMAL_RANGES[key];
  if (!range) return '';
  
  let min = range.min;
  let max = range.max;

  if (gender === 'L' && range.pria) {
    min = range.pria.min ?? min;
    max = range.pria.max ?? max;
  } else if (gender === 'P' && range.wanita) {
    min = range.wanita.min ?? min;
    max = range.wanita.max ?? max;
  }

  if (min !== undefined && max !== undefined) {
    return `${min} - ${max} ${range.unit ?? ''}`.trim();
  }
  return '';
}
