import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ALL_PARAMS } from '@/lib/param-options';
import { requireAuth } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';
import { formatDateDisplay, getTodayWIB } from '@/lib/utils';
import type { DashboardStats, HistoryRow } from '@/types';

async function getMonthlyStats(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    // Ambil semua baris secara paginasi agar tidak terpotong batas default 1000 baris Supabase
    const PAGE_SIZE = 1000;
    const examinations: { tgl_permintaan: string | null }[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error } = await db
        .from('examinations')
        .select('tgl_permintaan')
        .gte('tgl_permintaan', `${year}-01-01`)
        .lte('tgl_permintaan', `${year}-12-31`)
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('DB error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
      }

      if (!page || page.length === 0) break;
      examinations.push(...page);
      if (page.length < PAGE_SIZE) break;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyData: Record<string, number> = {};
    
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = 0;
    }
    
    for (const exam of examinations || []) {
      const month = parseInt(exam.tgl_permintaan?.substring(5, 7) || '0');
      if (month >= 1 && month <= 12) {
        monthlyData[month]++;
      }
    }
    
    const result = Object.entries(monthlyData).map(([month, count]) => ({
      month: monthNames[parseInt(month) - 1],
      count,
    }));
    
    return NextResponse.json({ monthlyData: result, year });
  } catch (err) {
    console.error('monthly stats error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const monthly = request.nextUrl.searchParams.get('monthly');
  
  if (monthly === 'true') {
    return getMonthlyStats(request);
  }
  
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || '';
    const endDate = searchParams.get('end') || '';
    const todayWIB = getTodayWIB();

    // Paginasi agar agregat statistik tidak terpotong batas default 1000 baris Supabase
    const PAGE_SIZE = 1000;
    type ExamRow = {
      id: string; no_urut: string; tgl_permintaan: string; dokter: string; status_biaya: string;
      patient?: { nama?: string } | { nama?: string }[] | null;
      [col: string]: unknown;
    };
    const examinations: ExamRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error: examError } = await db
        .from('examinations')
        .select(`
          id, no_urut, tgl_permintaan, dokter, petugas, status_biaya, created_at,
          patient:patients(nama, nik, alamat, tgl_lahir),
          gds, gdp, gd2pp, kolesterol, ldl, hdl, trigliserida, asam_urat,
          hbsag, hiv, syphilis, hcv, anti_hbs, ns1, dengue_ig, malaria_rapid, widal, napza,
          bta, gram, malaria_slide
        `)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (examError) {
        console.error('DB error:', examError);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
      }

      if (!page || page.length === 0) break;
      examinations.push(...(page as unknown as ExamRow[]));
      if (page.length < PAGE_SIZE) break;
    }

    // Key stats = label form (single source dgn export). Dulu label hardcode
    // beda dgn PARAM_OPTIONS ("GDS (Gula...)" vs "Gula Darah...") — join pecah.
    const labelOf = (key: string) => ALL_PARAMS.find(p => p.key === key)?.label ?? key;
    const chemKeys = ['gds', 'gdp', 'gd2pp', 'kolesterol', 'ldl', 'hdl', 'trigliserida', 'asam_urat'];
    const imKeys: [string, 'reactive' | 'positive'][] = [
      ['hbsag', 'reactive'], ['hiv', 'reactive'], ['syphilis', 'reactive'], ['hcv', 'reactive'],
      ['anti_hbs', 'reactive'], ['ns1', 'positive'], ['dengue_ig', 'positive'],
      ['malaria_rapid', 'positive'], ['widal', 'positive'], ['napza', 'positive'],
    ];
    const micKeys = ['bta', 'gram', 'malaria_slide'];
    const stats: DashboardStats = {
      today: 0,
      filtered: 0,
      chemistry: Object.fromEntries(chemKeys.map(k => [labelOf(k), 0])),
      immunology: Object.fromEntries(imKeys.map(([k, t]) => [labelOf(k), { type: t, pos: 0, neg: 0 }])),
      microbiology: Object.fromEntries(micKeys.map(k => [labelOf(k), { pos: 0, neg: 0 }])),
    };

    const history: HistoryRow[] = [];

    const isInRange = (tgl: string): boolean => {
      if (!startDate && !endDate) return true;
      if (startDate && tgl < startDate) return false;
      if (endDate && tgl > endDate) return false;
      return true;
    };

    const countImmuno = (value: unknown, key: string) => {
      if (typeof value !== 'string' || !value.trim()) return;
      const v = value.toLowerCase();
      // Non/negatif eksplisit -> neg; malaria_slide positif berupa spesies
      // ("P. falciparum") tanpa kata positif -> selain neg = pos.
      const isNeg = v.includes('non') || v.includes('negatif') || v === '-' || v === 'tidak ada';
      const label = labelOf(key);
      if (isNeg) stats.immunology[label].neg++;
      else stats.immunology[label].pos++;
    };

    const countMicro = (value: unknown, key: string) => {
      if (typeof value !== 'string' || !value.trim()) return;
      const v = value.toLowerCase();
      const isNeg = v.includes('negatif') || v.includes('non') || v === '-' || v === 'tidak ada';
      const label = labelOf(key);
      if (isNeg) stats.microbiology[label].neg++;
      else stats.microbiology[label].pos++;
    };

    for (const exam of examinations || []) {
      const tgl = exam.tgl_permintaan;
      if (tgl === todayWIB) stats.today++;

      if (!isInRange(tgl)) continue;
      stats.filtered++;

      const patient = Array.isArray(exam.patient) ? exam.patient[0] : exam.patient;
      history.push({
        no: exam.no_urut,
        nama: patient?.nama || '-',
        tgl: formatDateDisplay(tgl),
        dokter: exam.dokter,
        biaya: exam.status_biaya,
        exam_id: exam.id,
      });

      if (exam.gds) stats.chemistry[labelOf('gds')]++;
      if (exam.gdp) stats.chemistry[labelOf('gdp')]++;
      if (exam.gd2pp) stats.chemistry[labelOf('gd2pp')]++;
      if (exam.kolesterol) stats.chemistry[labelOf('kolesterol')]++;
      if (exam.ldl) stats.chemistry[labelOf('ldl')]++;
      if (exam.hdl) stats.chemistry[labelOf('hdl')]++;
      if (exam.trigliserida) stats.chemistry[labelOf('trigliserida')]++;
      if (exam.asam_urat) stats.chemistry[labelOf('asam_urat')]++;

      countImmuno(exam.hbsag, 'hbsag');
      countImmuno(exam.hiv, 'hiv');
      countImmuno(exam.syphilis, 'syphilis');
      countImmuno(exam.hcv, 'hcv');
      countImmuno(exam.anti_hbs, 'anti_hbs');
      countImmuno(exam.ns1, 'ns1');
      countImmuno(exam.dengue_ig, 'dengue_ig');
      countImmuno(exam.malaria_rapid, 'malaria_rapid');
      countImmuno(exam.widal, 'widal');
      countImmuno(exam.napza, 'napza');

      countMicro(exam.bta, 'bta');
      countMicro(exam.gram, 'gram');
      countMicro(exam.malaria_slide, 'malaria_slide');
    }

    return NextResponse.json({ stats, history });
  } catch (err) {
    console.error('dashboard GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
