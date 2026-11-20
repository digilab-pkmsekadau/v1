import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';
import { formatDateDisplay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Format bulan tidak valid (YYYY-MM)' }, { status: 400 });
    }

    const [year, mon] = month.split('-').map(Number);
    if (isNaN(year) || isNaN(mon) || mon < 1 || mon > 12) {
      return NextResponse.json({ error: 'Bulan tidak valid' }, { status: 400 });
    }
    const startDate = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate(); // hari terakhir bulan
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    // Paginasi: rekap bulanan wajib lengkap, jangan terpotong cap 1000 baris.
    const PAGE_SIZE = 1000;
    const examinations: Record<string, unknown>[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error: pageError } = await db
        .from('examinations')
        .select('*, patients(nama, nik, alamat, tgl_lahir)')
        .gte('tgl_permintaan', startDate)
        .lte('tgl_permintaan', endDate)
        .order('tgl_permintaan', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (pageError) {
        console.error('DB error:', pageError);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
      }
      if (!page || page.length === 0) break;
      examinations.push(...(page as unknown as Record<string, unknown>[]));
      if (page.length < PAGE_SIZE) break;
    }


    const str = (v: unknown): string => (typeof v === 'string' ? v : '');
    const rows = (examinations || []).map(exam => {
      const patient = Array.isArray(exam.patients) ? exam.patients[0] : exam.patients;
      return {
        'No Urut': str(exam.no_urut) || '-',
        'Tgl Pemeriksaan': formatDateDisplay(typeof exam.tgl_permintaan === 'string' ? exam.tgl_permintaan : null),
        'Nama Pasien': (patient as { nama?: string })?.nama || '-',
        'NIK': (patient as { nik?: string })?.nik || '-',
        'Dokter': str(exam.dokter) || '-',
        'Petugas': str(exam.petugas) || '-',
        'Status Biaya': str(exam.status_biaya) || '-',
        // Hematologi
        'RBC': str(exam.rbc), 'HGB': str(exam.hgb), 'HCT': str(exam.hct),
        'MCV': str(exam.mcv), 'MCH': str(exam.mch), 'MCHC': str(exam.mchc),
        'PLT': str(exam.plt), 'WBC': str(exam.wbc), 'LYM': str(exam.lym),
        'MON': str(exam.mon), 'GRA': str(exam.gra), 'LED': str(exam.led),
        'Gol. Darah': str(exam.goldar), 'BT': str(exam.bt), 'CT': str(exam.ct),
        // Imunologi & Serologi
        'HBsAg': str(exam.hbsag), 'Anti HIV': str(exam.hiv),
        'Syphilis': str(exam.syphilis), 'Anti HCV': str(exam.hcv),
        'Anti HBs': str(exam.anti_hbs), 'NS1 Ag Dengue': str(exam.ns1),
        'Dengue IgG & IgM': str(exam.dengue_ig), 'Malaria Rapid': str(exam.malaria_rapid),
        'Widal': str(exam.widal), 'NAPZA': str(exam.napza),
        // Kimia Klinik
        'GDS': str(exam.gds), 'GDP': str(exam.gdp), 'GD2PP': str(exam.gd2pp),
        'Kolesterol': str(exam.kolesterol), 'LDL': str(exam.ldl), 'HDL': str(exam.hdl),
        'Trigliserida': str(exam.trigliserida),
        'Asam Urat': str(exam.asam_urat),
        // Mikrobiologi
        'BTA': str(exam.bta), 'Gram': str(exam.gram), 'Malaria Slide': str(exam.malaria_slide),
        // Urinalisa
        'Urin Warna': str(exam.u_warna), 'Urin Jernih': str(exam.u_jernih),
        'BJ': str(exam.u_bj), 'Leukosit Urin': str(exam.u_leukosit),
        'Nitrit': str(exam.u_nitrit), 'pH': str(exam.u_ph),
        'Protein': str(exam.u_protein), 'Glukosa': str(exam.u_glukosa),
        'Keton': str(exam.u_keton), 'Urobilinogen': str(exam.u_urobilinogen),
        'Bilirubin': str(exam.u_bilirubin), 'Blood': str(exam.u_blood),
        'HCG': str(exam.u_hcg),
        // Sedimen Urin
        'Sed. Leukosit': str(exam.m_leukosit), 'Sed. Eritrosit': str(exam.m_eritrosit),
        'Sed. Epitel': str(exam.m_epitel),
      };
    });

    // Hitung statistik ringkas: kolom mana yang punya data (untuk preview di frontend)
    const paramCounts: Record<string, number> = {};
    const paramKeys = [
      'RBC','HGB','HCT','MCV','MCH','MCHC','PLT','WBC','LYM','MON','GRA','LED','Gol. Darah','BT','CT',
      'HBsAg','Anti HIV','Syphilis','Anti HCV','Anti HBs','NS1 Ag Dengue','Dengue IgG & IgM','Malaria Rapid','Widal','NAPZA',
      'GDS','GDP','GD2PP','Kolesterol','LDL','HDL','Trigliserida','Asam Urat',
      'BTA','Gram','Malaria Slide',
      'Urin Warna','Urin Jernih','BJ','Leukosit Urin','Nitrit','pH','Protein','Glukosa','Keton','Urobilinogen','Bilirubin','Blood','HCG',
      'Sed. Leukosit','Sed. Eritrosit','Sed. Epitel',
    ];
    for (const key of paramKeys) {
      const count = rows.filter(r => r[key as keyof typeof r] && r[key as keyof typeof r] !== '').length;
      if (count > 0) paramCounts[key] = count;
    }

    return NextResponse.json({
      data: rows,
      month,
      total: rows.length,
      startDate,
      endDate,
      paramCounts, // untuk preview di UI
    });
  } catch (err) {
    console.error('monthly export error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
