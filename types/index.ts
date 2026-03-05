export type StatusBiaya = "Umum" | "BPJS" | "Gratis";

export interface Patient {
  id: string;
  nama: string;
  nik?: string;
  alamat?: string;
  tgl_lahir?: string;
  created_at?: string;
}

export interface Examination {
  id: string;
  no_urut: string;
  patient_id: string;
  tgl_permintaan: string;
  dokter: string;
  petugas: string;
  status_biaya: StatusBiaya;
  created_at: string;
  patient?: Patient;
  // Lab results (single table)
  rbc?: string; hgb?: string; hct?: string; mcv?: string; mch?: string;
  mchc?: string; plt?: string; wbc?: string; lym?: string; mon?: string;
  gra?: string; led?: string; goldar?: string; bt?: string; ct?: string;
  hbsag?: string; hiv?: string; syphilis?: string; hcv?: string;
  anti_hbs?: string; ns1?: string; dengue_ig?: string; malaria_rapid?: string;
  widal?: string; gds?: string; gdp?: string; gd2pp?: string;
  kolesterol?: string; trigliserida?: string; asam_urat?: string;
  bta?: string; gram?: string; malaria_slide?: string;
  u_warna?: string; u_jernih?: string; u_bj?: string; u_leukosit?: string;
  u_nitrit?: string; u_ph?: string; u_protein?: string; u_glukosa?: string;
  u_keton?: string; u_urobilinogen?: string; u_bilirubin?: string;
  u_blood?: string; u_hcg?: string; m_leukosit?: string;
  m_eritrosit?: string; m_epitel?: string;
}

export interface DashboardStats {
  today: number;
  filtered: number;
  chemistry: Record<string, number>;
  immunology: Record<
    string,
    { type: "reactive" | "positive"; pos: number; neg: number }
  >;
  microbiology: Record<string, { pos: number; neg: number }>;
}

export interface HistoryRow {
  no: string;
  nama: string;
  tgl: string;
  dokter: string;
  biaya: string;
  exam_id: string;
}

export interface ExportRow {
  "No Urut": string;
  "Nama Pasien": string;
  NIK: string;
  Alamat: string;
  "Tgl Lahir": string;
  "Tgl Pemeriksaan": string;
  "Dokter Perujuk": string;
  Petugas: string;
  "Hasil Pemeriksaan": string;
}

// Parameter item untuk dynamic list di form input
export interface ParamItem {
  id: string;       // unique id untuk React key
  paramKey: string; // key kolom di DB, misal: "rbc", "hgb", "kolesterol"
  value: string;    // nilai yang diisi petugas
}

// Form input data (patient info + dynamic params)
export interface FormInputData {
  // Patient info
  nama_pasien: string;
  nik?: string;
  alamat?: string;
  tgl_lahir?: string;
  tgl_permintaan: string;
  dokter: string;
  petugas: string;
  status_biaya: StatusBiaya;
  // Dynamic parameter list
  params: ParamItem[];
}
