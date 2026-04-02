import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateNoUrut, formatDateDisplay } from '@/lib/utils';
import { FormInputData, ParamItem } from '@/types';

export const dynamic = 'force-dynamic';

// Mapping: paramKey → { dbCol, unit? }
const PARAM_MAP: Record<string, { col: string; unit?: string }> = {
  // Hematologi
  rbc:           { col: 'rbc',   unit: '10^6/µl' },
  hgb:           { col: 'hgb',   unit: 'g/dl' },
  hct:           { col: 'hct',   unit: '%' },
  mcv:           { col: 'mcv',   unit: 'fL' },
  mch:           { col: 'mch',   unit: 'pg' },
  mchc:          { col: 'mchc',  unit: 'g/dl' },
  plt:           { col: 'plt',   unit: '10^3/µl' },
  wbc:           { col: 'wbc',   unit: '10^3/µl' },
  lym:           { col: 'lym',   unit: '%' },
  mon:           { col: 'mon',   unit: '%' },
  gra:           { col: 'gra',   unit: '%' },
  led:           { col: 'led',   unit: 'mm/Jam' },
  goldar:        { col: 'goldar' },
  bt:            { col: 'bt' },
  ct:            { col: 'ct' },
  // Serologi/Imunologi
  hbsag:         { col: 'hbsag' },
  hiv:           { col: 'hiv' },
  syphilis:      { col: 'syphilis' },
  hcv:           { col: 'hcv' },
  anti_hbs:      { col: 'anti_hbs' },
  ns1:           { col: 'ns1' },
  dengue_ig:     { col: 'dengue_ig' },
  malaria_rapid: { col: 'malaria_rapid' },
  widal:         { col: 'widal' },
  // Kimia Darah
  gds:           { col: 'gds',          unit: 'mg/dl' },
  gdp:           { col: 'gdp',          unit: 'mg/dl' },
  gd2pp:         { col: 'gd2pp',        unit: 'mg/dl' },
  kolesterol:    { col: 'kolesterol',   unit: 'mg/dl' },
  trigliserida:  { col: 'trigliserida', unit: 'mg/dl' },
  asam_urat:     { col: 'asam_urat',    unit: 'mg/dl' },
  // Mikrobiologi
  bta:           { col: 'bta' },
  gram:          { col: 'gram' },
  malaria_slide: { col: 'malaria_slide' },
  // Urinalisis
  u_warna:         { col: 'u_warna' },
  u_jernih:        { col: 'u_jernih' },
  u_bj:            { col: 'u_bj' },
  u_leukosit:      { col: 'u_leukosit',     unit: '/µl' },
  u_nitrit:        { col: 'u_nitrit' },
  u_ph:            { col: 'u_ph' },
  u_protein:       { col: 'u_protein' },
  u_glukosa:       { col: 'u_glukosa' },
  u_keton:         { col: 'u_keton' },
  u_urobilinogen:  { col: 'u_urobilinogen', unit: 'mg/dl' },
  u_bilirubin:     { col: 'u_bilirubin' },
  u_blood:         { col: 'u_blood' },
  u_hcg:           { col: 'u_hcg' },
  m_leukosit:      { col: 'm_leukosit',     unit: '/LPB' },
  m_eritrosit:     { col: 'm_eritrosit',    unit: '/LPB' },
  m_epitel:        { col: 'm_epitel',       unit: '/LPK' },
};

export async function GET() {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from('examinations')
      .select(`
        id, no_urut, tgl_permintaan, dokter, petugas, status_biaya, created_at,
        patient:patients(id, nama, nik, jenis_kelamin, alamat, tgl_lahir)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('examinations GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = createServerClient();
    const body: FormInputData = await request.json();

    const { nama_pasien, nik, jenis_kelamin, alamat, tgl_lahir, tgl_permintaan,
            dokter, petugas, status_biaya, params } = body;

    if (!nama_pasien?.trim()) {
      return NextResponse.json({ error: 'Nama pasien wajib diisi' }, { status: 400 });
    }
    if (!tgl_permintaan) {
      return NextResponse.json({ error: 'Tanggal permintaan wajib diisi' }, { status: 400 });
    }

    // 1. Cari/buat patient
    let patientId: string;
    const nikClean = nik?.trim() || null;

    if (nikClean) {
      const { data: existing } = await db
        .from('patients').select('id').eq('nik', nikClean).maybeSingle();
      if (existing) {
        patientId = existing.id;
        if (jenis_kelamin) {
          await db.from('patients').update({ jenis_kelamin }).eq('id', patientId);
        }
      } else {
        const { data: newP, error: pErr } = await db
          .from('patients')
          .insert({ nama: nama_pasien.trim(), nik: nikClean, jenis_kelamin: jenis_kelamin || null, alamat: alamat?.trim() || null, tgl_lahir: tgl_lahir || null })
          .select('id').single();
        if (pErr || !newP) return NextResponse.json({ error: 'Gagal simpan pasien: ' + pErr?.message }, { status: 500 });
        patientId = newP.id;
      }
    } else {
      const { data: newP, error: pErr } = await db
        .from('patients')
        .insert({ nama: nama_pasien.trim(), nik: null, jenis_kelamin: jenis_kelamin || null, alamat: alamat?.trim() || null, tgl_lahir: tgl_lahir || null })
        .select('id').single();
      if (pErr || !newP) return NextResponse.json({ error: 'Gagal simpan pasien: ' + pErr?.message }, { status: 500 });
      patientId = newP.id;
    }

    // 2. Generate no_urut
    const { data: lastExam } = await db
      .from('examinations').select('no_urut')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    const noUrut = generateNoUrut(lastExam?.no_urut ?? null);

    // 3. Konversi dynamic params → object kolom
    const labCols: Record<string, string> = {};
    for (const item of (params || []) as ParamItem[]) {
      const { paramKey, value } = item;
      if (!paramKey || !value?.trim()) continue;
      const mapping = PARAM_MAP[paramKey];
      if (!mapping) continue;
      const finalVal = mapping.unit
        ? `${value.trim()} ${mapping.unit}`
        : value.trim();
      labCols[mapping.col] = finalVal;
    }

    // 4. Insert examination (single table)
    const { data: exam, error: examErr } = await db
      .from('examinations')
      .insert({
        no_urut: noUrut,
        patient_id: patientId,
        tgl_permintaan,
        dokter: dokter.trim(),
        petugas: petugas.trim(),
        status_biaya: status_biaya || 'Umum',
        ...labCols,
      })
      .select('id').single();

    if (examErr || !exam) {
      return NextResponse.json({ error: 'Gagal simpan pemeriksaan: ' + examErr?.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, no_urut: noUrut });
  } catch (err) {
    console.error('examinations POST error:', err);
    return NextResponse.json({ error: 'Server error: ' + String(err) }, { status: 500 });
  }
}
