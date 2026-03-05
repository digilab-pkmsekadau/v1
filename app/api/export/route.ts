import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ExportRow } from '@/types';
import { formatDateDisplay } from '@/lib/utils';

// Map label dashboard → kolom di tabel examinations
const PARAM_COLUMN: Record<string, string> = {
  'HBsAg': 'hbsag', 'Anti HIV': 'hiv', 'Syphilis': 'syphilis',
  'Anti HCV': 'hcv', 'Anti HBs': 'anti_hbs', 'NS1 Ag Dengue': 'ns1',
  'Dengue IgG & IgM': 'dengue_ig', 'Malaria Rapid': 'malaria_rapid', 'Widal': 'widal',
  'Pewarnaan BTA': 'bta', 'Pewarnaan Gram': 'gram', 'Malaria Slide': 'malaria_slide',
  'Gula Darah Sewaktu': 'gds', 'Gula Darah Puasa': 'gdp', 'Gula Darah 2 Jam PP': 'gd2pp',
  'Kolesterol': 'kolesterol', 'Trigliserida': 'trigliserida', 'Asam Urat': 'asam_urat',
};

export async function GET(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param') || '';
    const filterMode = searchParams.get('filter') || 'all_filled';
    const startDate = searchParams.get('start') || '2000-01-01';
    const endDate = searchParams.get('end') || '2099-12-31';

    const column = PARAM_COLUMN[param];
    if (!column) {
      return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 });
    }

    // Ambil semua kolom (termasuk kolom param dinamis)
    const { data: examinations, error } = await db
      .from('examinations')
      .select('*')
      .gte('tgl_permintaan', startDate)
      .lte('tgl_permintaan', endDate)
      .not(column, 'is', null)
      .order('tgl_permintaan', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result: ExportRow[] = [];

    for (const exam of examinations || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const examAny = exam as any;
      const val: string = examAny[column] || '';
      if (!val.trim()) continue;

      const valLower = val.toLowerCase();
      const isNeg = valLower.includes('non') || valLower.includes('negatif');
      const isPos = !isNeg;

      let shouldExport = false;
      if (filterMode === 'all_filled') shouldExport = true;
      else if (filterMode === 'reaktif_only' && isPos && valLower.includes('reaktif')) shouldExport = true;
      else if (filterMode === 'non_reaktif_only' && isNeg) shouldExport = true;
      else if (filterMode === 'positif_only' && isPos) shouldExport = true;
      else if (filterMode === 'negatif_only' && isNeg) shouldExport = true;

      if (!shouldExport) continue;

      // Ambil data pasien terpisah
      const { data: patient } = await db
        .from('patients')
        .select('nama, nik, alamat, tgl_lahir')
        .eq('id', examAny.patient_id)
        .single();

      result.push({
        'No Urut': examAny.no_urut,
        'Nama Pasien': patient?.nama || '-',
        'NIK': patient?.nik || '-',
        'Alamat': patient?.alamat || '-',
        'Tgl Lahir': patient?.tgl_lahir ? formatDateDisplay(patient.tgl_lahir) : '-',
        'Tgl Pemeriksaan': formatDateDisplay(examAny.tgl_permintaan),
        'Dokter Perujuk': examAny.dokter,
        'Petugas': examAny.petugas,
        'Hasil Pemeriksaan': val,
      });
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('export GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
