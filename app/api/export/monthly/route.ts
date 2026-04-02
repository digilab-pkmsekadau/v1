import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatDateDisplay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Fix: hitung hari terakhir bulan dengan benar (bukan hardcode -31)
    const [year, mon] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate(); // hari terakhir bulan
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    const { data: examinations, error } = await db
      .from('examinations')
      .select('*, patients(nama, nik, alamat, tgl_lahir)')
      .gte('tgl_permintaan', startDate)
      .lte('tgl_permintaan', endDate)
      .order('tgl_permintaan', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (examinations || []).map(exam => {
      const patient = Array.isArray(exam.patients) ? exam.patients[0] : exam.patients;
      return {
        'No Urut': exam.no_urut || '-',
        'Tgl Pemeriksaan': formatDateDisplay(exam.tgl_permintaan),
        'Nama Pasien': (patient as { nama?: string })?.nama || '-',
        'NIK': (patient as { nik?: string })?.nik || '-',
        'Dokter': exam.dokter || '-',
        'Petugas': exam.petugas || '-',
        'Status Biaya': exam.status_biaya || '-',
        // Hematologi
        'RBC': exam.rbc || '', 'HGB': exam.hgb || '', 'HCT': exam.hct || '',
        'MCV': exam.mcv || '', 'MCH': exam.mch || '', 'MCHC': exam.mchc || '',
        'PLT': exam.plt || '', 'WBC': exam.wbc || '', 'LYM': exam.lym || '',
        'MON': exam.mon || '', 'GRA': exam.gra || '', 'LED': exam.led || '',
        'Gol. Darah': exam.goldar || '', 'BT': exam.bt || '', 'CT': exam.ct || '',
        // Imunologi & Serologi
        'HBsAg': exam.hbsag || '', 'Anti HIV': exam.hiv || '',
        'Syphilis': exam.syphilis || '', 'Anti HCV': exam.hcv || '',
        'Anti HBs': exam.anti_hbs || '', 'NS1': exam.ns1 || '',
        'Dengue IgG/IgM': exam.dengue_ig || '', 'Malaria Rapid': exam.malaria_rapid || '',
        'Widal': exam.widal || '',
        // Kimia Klinik
        'GDS': exam.gds || '', 'GDP': exam.gdp || '', 'GD2PP': exam.gd2pp || '',
        'Kolesterol': exam.kolesterol || '', 'Trigliserida': exam.trigliserida || '',
        'Asam Urat': exam.asam_urat || '',
        // Mikrobiologi
        'BTA': exam.bta || '', 'Gram': exam.gram || '', 'Malaria Slide': exam.malaria_slide || '',
        // Urinalisa
        'Urin Warna': exam.u_warna || '', 'Urin Jernih': exam.u_jernih || '',
        'BJ': exam.u_bj || '', 'Leukosit Urin': exam.u_leukosit || '',
        'Nitrit': exam.u_nitrit || '', 'pH': exam.u_ph || '',
        'Protein': exam.u_protein || '', 'Glukosa': exam.u_glukosa || '',
        'Keton': exam.u_keton || '', 'Urobilinogen': exam.u_urobilinogen || '',
        'Bilirubin': exam.u_bilirubin || '', 'Blood': exam.u_blood || '',
        'HCG': exam.u_hcg || '',
        // Sedimen Urin
        'Sed. Leukosit': exam.m_leukosit || '', 'Sed. Eritrosit': exam.m_eritrosit || '',
        'Sed. Epitel': exam.m_epitel || '',
      };
    });

    // Hitung statistik ringkas: kolom mana yang punya data (untuk preview di frontend)
    const paramCounts: Record<string, number> = {};
    const paramKeys = [
      'RBC','HGB','HCT','MCV','MCH','MCHC','PLT','WBC','LYM','MON','GRA','LED','Gol. Darah','BT','CT',
      'HBsAg','Anti HIV','Syphilis','Anti HCV','Anti HBs','NS1','Dengue IgG/IgM','Malaria Rapid','Widal',
      'GDS','GDP','GD2PP','Kolesterol','Trigliserida','Asam Urat',
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
