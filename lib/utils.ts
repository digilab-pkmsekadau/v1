import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format tanggal ke format Indonesia: dd-MMM-yyyy (misal: 01-Jan-2026)
 */
export function formatDateDisplay(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';
  
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Dapatkan tanggal hari ini di WIB (Asia/Jakarta) dalam format yyyy-MM-dd
 */
export function getTodayWIB(): string {
  const now = new Date();
  // WIB = UTC+7
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
}

/**
 * Generate no urut berikutnya dari no_urut terakhir
 * Format: "P-XX" (P-01, P-02, ... P-99, P-100)
 */
export function generateNoUrut(lastNo: string | null): string {
  if (!lastNo) return 'P-01';
  
  const parts = lastNo.split('-');
  if (parts.length < 2) return 'P-01';
  
  const num = parseInt(parts[1], 10);
  if (isNaN(num)) return 'P-01';
  
  const next = num + 1;
  const padded = next.toString().padStart(2, '0');
  return `P-${padded}`;
}

/**
 * Tanggal awal bulan ini dalam format yyyy-MM-dd
 */
export function getStartOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
}
