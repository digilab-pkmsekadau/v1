// ─── Daftar semua parameter lab (dikelompokkan) ─────────────────────────────
// Dipindah ke modul terpisah agar bisa dipakai di berbagai halaman tanpa
// melanggar aturan Next.js App Router yang melarang export non-reserved dari `page.tsx`.

export interface ParamOption {
  key: string;
  label: string;
  type: 'number' | 'select' | 'text';
  unit?: string;
  opts?: string[];
}

export interface ParamGroup {
  group: string;
  params: ParamOption[];
}

export const PARAM_OPTIONS: ParamGroup[] = [
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
      { key: 'napza',         label: 'NAPZA',                type: 'select', opts: ['Negatif','Positif'] },
    ],
  },
  {
    group: 'Kimia Darah',
    params: [
      { key: 'gds',          label: 'GDS (Gula Darah Sewaktu)', type: 'number', unit: 'mg/dl' },
      { key: 'gdp',          label: 'GDP (Gula Darah Puasa)',   type: 'number', unit: 'mg/dl' },
      { key: 'gd2pp',        label: 'GD2PP (Gula 2 Jam PP)',   type: 'number', unit: 'mg/dl' },
      { key: 'kolesterol',   label: 'Kolesterol',              type: 'number', unit: 'mg/dl' },
      { key: 'ldl',          label: 'LDL',                     type: 'number', unit: 'mg/dl' },
      { key: 'hdl',          label: 'HDL',                     type: 'number', unit: 'mg/dl' },
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
export const ALL_PARAMS = PARAM_OPTIONS.flatMap(g => g.params);
export const getParamInfo = (key: string) => ALL_PARAMS.find(p => p.key === key);
