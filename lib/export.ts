import * as XLSX from 'xlsx';
import { ExportRow } from '@/types';

/**
 * Export array of ExportRow ke file Excel (.xlsx)
 */
export function exportToExcel(data: ExportRow[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers: (keyof ExportRow)[] = [
    'No Urut',
    'Nama Pasien',
    'NIK',
    'Alamat',
    'Tgl Lahir',
    'Tgl Pemeriksaan',
    'Dokter Perujuk',
    'Petugas',
    'Hasil Pemeriksaan',
  ];

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

  // Set kolom width
  worksheet['!cols'] = [
    { wch: 10 },  // No Urut
    { wch: 25 },  // Nama Pasien
    { wch: 18 },  // NIK
    { wch: 30 },  // Alamat
    { wch: 12 },  // Tgl Lahir
    { wch: 15 },  // Tgl Pemeriksaan
    { wch: 22 },  // Dokter Perujuk
    { wch: 20 },  // Petugas
    { wch: 25 },  // Hasil Pemeriksaan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
