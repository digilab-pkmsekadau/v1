import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';
import { formatDateDisplay, getTodayWIB } from '@/lib/utils';
import { DashboardStats, HistoryRow } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || '';
    const endDate = searchParams.get('end') || '';
    const todayWIB = getTodayWIB();

    // Single table query - ambil semua kolom hasil lab sekaligus
    const { data: examinations, error: examError } = await db
      .from('examinations')
      .select(`
        id, no_urut, tgl_permintaan, dokter, petugas, status_biaya, created_at,
        patient:patients(nama, nik, alamat, tgl_lahir),
        gds, gdp, gd2pp, kolesterol, trigliserida, asam_urat,
        hbsag, hiv, syphilis, hcv, anti_hbs, ns1, dengue_ig, malaria_rapid, widal,
        bta, gram, malaria_slide
      `)
      .order('created_at', { ascending: false });

    if (examError) {
      return NextResponse.json({ error: examError.message }, { status: 500 });
    }

    const stats: DashboardStats = {
      today: 0,
      filtered: 0,
      chemistry: {
        'Gula Darah Sewaktu': 0,
        'Gula Darah Puasa': 0,
        'Gula Darah 2 Jam PP': 0,
        'Kolesterol': 0,
        'Trigliserida': 0,
        'Asam Urat': 0,
      },
      immunology: {
        'HBsAg': { type: 'reactive', pos: 0, neg: 0 },
        'Anti HIV': { type: 'reactive', pos: 0, neg: 0 },
        'Syphilis': { type: 'reactive', pos: 0, neg: 0 },
        'Anti HCV': { type: 'reactive', pos: 0, neg: 0 },
        'Anti HBs': { type: 'reactive', pos: 0, neg: 0 },
        'NS1 Ag Dengue': { type: 'positive', pos: 0, neg: 0 },
        'Dengue IgG & IgM': { type: 'positive', pos: 0, neg: 0 },
        'Malaria Rapid': { type: 'positive', pos: 0, neg: 0 },
        'Widal': { type: 'positive', pos: 0, neg: 0 },
      },
      microbiology: {
        'Pewarnaan BTA': { pos: 0, neg: 0 },
        'Pewarnaan Gram': { pos: 0, neg: 0 },
        'Malaria Slide': { pos: 0, neg: 0 },
      },
    };

    const history: HistoryRow[] = [];

    const isInRange = (tgl: string): boolean => {
      if (!startDate && !endDate) return true;
      if (startDate && tgl < startDate) return false;
      if (endDate && tgl > endDate) return false;
      return true;
    };

    const countImmuno = (value: string | null | undefined, key: string) => {
      if (!value?.trim()) return;
      const v = value.toLowerCase();
      const isNeg = v.includes('non') || v.includes('negatif');
      if (isNeg) stats.immunology[key].neg++;
      else stats.immunology[key].pos++;
    };

    const countMicro = (value: string | null | undefined, key: string) => {
      if (!value?.trim()) return;
      const v = value.toLowerCase();
      const isNeg = v.includes('negatif') || v.includes('non');
      if (isNeg) stats.microbiology[key].neg++;
      else stats.microbiology[key].pos++;
    };

    for (const exam of examinations || []) {
      const tgl = exam.tgl_permintaan;

      if (tgl === todayWIB) stats.today++;

      const patient = Array.isArray(exam.patient) ? exam.patient[0] : exam.patient;
      history.push({
        no: exam.no_urut,
        nama: patient?.nama || '-',
        tgl: formatDateDisplay(tgl),
        dokter: exam.dokter,
        biaya: exam.status_biaya,
        exam_id: exam.id,
      });

      if (!isInRange(tgl)) continue;
      stats.filtered++;

      // Chemistry - langsung dari kolom single table
      if (exam.gds) stats.chemistry['Gula Darah Sewaktu']++;
      if (exam.gdp) stats.chemistry['Gula Darah Puasa']++;
      if (exam.gd2pp) stats.chemistry['Gula Darah 2 Jam PP']++;
      if (exam.kolesterol) stats.chemistry['Kolesterol']++;
      if (exam.trigliserida) stats.chemistry['Trigliserida']++;
      if (exam.asam_urat) stats.chemistry['Asam Urat']++;

      // Immunology
      countImmuno(exam.hbsag, 'HBsAg');
      countImmuno(exam.hiv, 'Anti HIV');
      countImmuno(exam.syphilis, 'Syphilis');
      countImmuno(exam.hcv, 'Anti HCV');
      countImmuno(exam.anti_hbs, 'Anti HBs');
      countImmuno(exam.ns1, 'NS1 Ag Dengue');
      countImmuno(exam.dengue_ig, 'Dengue IgG & IgM');
      countImmuno(exam.malaria_rapid, 'Malaria Rapid');
      countImmuno(exam.widal, 'Widal');

      // Microbiology
      countMicro(exam.bta, 'Pewarnaan BTA');
      countMicro(exam.gram, 'Pewarnaan Gram');
      countMicro(exam.malaria_slide, 'Malaria Slide');
    }

    return NextResponse.json({ stats, history });
  } catch (err) {
    console.error('dashboard GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
