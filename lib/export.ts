import * as XLSX from 'xlsx';
import { ExportRow } from '@/types';

/**
 * Export array of ExportRow ke file Excel (.xlsx)
 * Untuk export per-parameter (9 kolom tetap)
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

/**
 * Export rekap bulanan dengan header DINAMIS
 * Support 40+ kolom parameter lab
 */
export function exportMonthlyToExcel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[],
  filename: string
): void {
  if (!data || data.length === 0) return;

  // Ambil semua kolom dari row pertama (urutan konsisten)
  const headers = Object.keys(data[0]);

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

  // Auto-width: minimal 10, maksimal 30 karakter
  worksheet['!cols'] = headers.map((h) => ({
    wch: Math.min(Math.max(h.length + 4, 10), 30),
  }));

  // Freeze baris pertama (header)
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Style header baris: bold (SheetJS community hanya support basic styling via cell)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddr]) continue;
    worksheet[cellAddr].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E8F5F3' } },
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap ${filename.slice(-7)}`);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
