import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatDateDisplay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

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
        'RBC': exam.rbc || '', 'HGB': exam.hgb || '', 'HCT': exam.hct || '',
        'MCV': exam.mcv || '', 'MCH': exam.mch || '', 'MCHC': exam.mchc || '',
        'PLT': exam.plt || '', 'WBC': exam.wbc || '', 'LYM': exam.lym || '',
        'MON': exam.mon || '', 'GRA': exam.gra || '', 'LED': exam.led || '',
        'Gol. Darah': exam.goldar || '', 'BT': exam.bt || '', 'CT': exam.ct || '',
        'HBsAg': exam.hbsag || '', 'Anti HIV': exam.hiv || '',
        'Syphilis': exam.syphilis || '', 'Anti HCV': exam.hcv || '',
        'Anti HBs': exam.anti_hbs || '', 'NS1': exam.ns1 || '',
        'Dengue IgG/IgM': exam.dengue_ig || '', 'Malaria Rapid': exam.malaria_rapid || '',
        'Widal': exam.widal || '',
        'GDS': exam.gds || '', 'GDP': exam.gdp || '', 'GD2PP': exam.gd2pp || '',
        'Kolesterol': exam.kolesterol || '', 'Trigliserida': exam.trigliserida || '',
        'Asam Urat': exam.asam_urat || '',
        'BTA': exam.bta || '', 'Gram': exam.gram || '', 'Malaria Slide': exam.malaria_slide || '',
        'Urin Warna': exam.u_warna || '', 'Urin Jernih': exam.u_jernih || '',
        'BJ': exam.u_bj || '', 'Leukosit Urin': exam.u_leukosit || '',
        'Nitrit': exam.u_nitrit || '', 'pH': exam.u_ph || '',
        'Protein': exam.u_protein || '', 'Glukosa': exam.u_glukosa || '',
        'Keton': exam.u_keton || '', 'Urobilinogen': exam.u_urobilinogen || '',
        'Bilirubin': exam.u_bilirubin || '', 'Blood': exam.u_blood || '',
        'HCG': exam.u_hcg || '',
        'Sed. Leukosit': exam.m_leukosit || '', 'Sed. Eritrosit': exam.m_eritrosit || '',
        'Sed. Epitel': exam.m_epitel || '',
      };
    });

    return NextResponse.json({ data: rows, month, total: rows.length });
  } catch (err) {
    console.error('monthly export error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
