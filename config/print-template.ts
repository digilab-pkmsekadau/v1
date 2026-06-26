// config/print-template.ts
// Konfigurasi template kop surat untuk cetak hasil lab

export interface PrintTemplateConfig {
  organizationName: string;
  department: string;
  unitName: string;
  address: string;
  defaultDoctorName: string;
  defaultTechnicianName: string;
  showFooter: boolean;
  footerText: string;
}

export const DEFAULT_PRINT_TEMPLATE: PrintTemplateConfig = {
  organizationName: 'Pemerintah Kabupaten Sekadau',
  department: 'Dinas Kesehatan, Pengendalian Penduduk dan KB',
  unitName: 'UPTD Puskesmas Sekadau',
  address: 'Jl. Merdeka Timur, Kec. Sekadau Hilir, Kab. Sekadau, Kalimantan Barat',
  defaultDoctorName: '..................................',
  defaultTechnicianName: '..................................',
  showFooter: true,
  footerText: 'Sekadau, [TANGGAL] • Petugas Laboratorium',
};
