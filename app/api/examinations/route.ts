import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { writeAudit } from '@/lib/audit';
import { getAuthedUser, requireAuth } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';
import { generateNoUrut } from '@/lib/utils';
import type { ParamItem } from '@/types';

export const dynamic = 'force-dynamic';

const examinationSchema = z.object({
  nama_pasien: z.string().trim().min(1, 'Nama pasien wajib diisi').max(200),
  nik: z.string().trim().max(20).optional(),
  jenis_kelamin: z.string().max(10).optional(),
  alamat: z.string().max(500).optional(),
  tgl_lahir: z.string().max(20).optional(),
  tgl_permintaan: z.string().min(1, 'Tanggal permintaan wajib diisi').max(20),
  dokter: z.string().max(200).optional().default(''),
  petugas: z.string().max(200).optional().default(''),
  status_biaya: z.enum(['Umum', 'BPJS', 'Gratis']),
  patient_id: z.string().uuid().optional(),
  params: z.array(z.object({
    id: z.string(),
    paramKey: z.string().max(100),
    value: z.string().max(500),
  })).default([]),
});

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
  ldl:           { col: 'ldl',          unit: 'mg/dl' },
  hdl:           { col: 'hdl',          unit: 'mg/dl' },
  trigliserida:  { col: 'trigliserida', unit: 'mg/dl' },
  asam_urat:     { col: 'asam_urat',    unit: 'mg/dl' },
  napza:         { col: 'napza' },
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
    const denied = await requireAuth();
    if (denied) return denied;
    const db = createServerClient();
    const { data, error } = await db
      .from('examinations')
      .select(`
        id, no_urut, tgl_permintaan, dokter, petugas, status_biaya, created_at,
        patient:patients(id, nama, nik, jenis_kelamin, alamat, tgl_lahir)
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('DB error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('examinations GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth();
    if (denied) return denied;
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = createServerClient();
    const parsed = examinationSchema.safeParse(await request.json());
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message ?? 'Data tidak valid' }, { status: 400 });
    }

    const { nama_pasien, nik, jenis_kelamin, alamat, tgl_lahir, tgl_permintaan,
            dokter, petugas, status_biaya, patient_id, params } = parsed.data;

    // 1. Cari/buat patient
    let patientId: string | null = null;
    const nikClean = nik?.trim() || null;

    // Prioritas 1: pasien yang dipilih petugas dari autocomplete. Ini satu-satunya
    // jalan menyatukan pemeriksaan ulang pasien TANPA NIK ke riwayat yang sama;
    // tanpa ini nama yang sama selalu jadi baris pasien baru.
    if (patient_id) {
      const { data: chosen } = await db
        .from('patients').select('id, jenis_kelamin').eq('id', patient_id).maybeSingle();
      if (chosen) {
        patientId = chosen.id;
        if (jenis_kelamin && !chosen.jenis_kelamin) {
          await db.from('patients').update({ jenis_kelamin }).eq('id', patientId);
        }
        // NIK baru dari pasien yang tadinya belum punya: lengkapi, jangan timpa.
        if (nikClean) {
          await db.from('patients').update({ nik: nikClean }).eq('id', patientId).is('nik', null);
        }
      }
    }

    // Prioritas 2: cocokkan lewat NIK.
    if (!patientId && nikClean) {
      const { data: existing } = await db
        .from('patients').select('id, jenis_kelamin').eq('nik', nikClean).maybeSingle();
      if (existing) {
        patientId = existing.id;
        // Hanya isi kalau masih kosong. Menimpa jenis_kelamin pasien lain akan
        // mengubah hasil deteksi abnormal di lib/normal-ranges.ts.
        if (jenis_kelamin && !existing.jenis_kelamin) {
          await db.from('patients').update({ jenis_kelamin }).eq('id', patientId);
        }
      }
    }

    // Prioritas 3: pasien baru. Nama yang sama TIDAK digabung otomatis — di Sekadau
    // satu nama bisa milik beberapa orang, jadi penggabungan harus dipilih petugas.
    if (!patientId) {
      const { data: newP, error: pErr } = await db
        .from('patients')
        .insert({ nama: nama_pasien.trim(), nik: nikClean, jenis_kelamin: jenis_kelamin || null, alamat: alamat?.trim() || null, tgl_lahir: tgl_lahir || null })
        .select('id').single();
      if (pErr || !newP) {
        console.error('patients insert error:', pErr);
        return NextResponse.json({ error: 'Gagal simpan pasien' }, { status: 500 });
      }
      patientId = newP.id;
    }
    // 2. Konversi dynamic params → object kolom (validasi key via allowlist PARAM_MAP).
    const labCols: Record<string, string> = {};
    for (const item of (params || []) as ParamItem[]) {
      const { paramKey, value } = item;
      if (!paramKey || !value?.trim()) continue;
      const mapping = PARAM_MAP[paramKey];
      if (!mapping) continue;
      labCols[mapping.col] = mapping.unit ? `${value.trim()} ${mapping.unit}` : value.trim();
    }
    // 3-4. Insert dengan retry: dua submit bareng bisa baca no_urut terakhir yang
    // sama. UNIQUE(no_urut) di DB jadi penentu; 23505 = kalah race, coba nomor berikut.
    // ponytail: retry 3x cukup untuk tool internal; ceiling: RPC/sequence per hari.
    let exam: { id: string } | null = null;
    let noUrut = '';
    let lastNo: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0 || lastNo === null) {
        // Max harus NUMERIK: order string menaruh 'P-999' di atas 'P-1000'
        // ('9' > '1'), sehingga max salah dan insert selalu 23505.
        // ponytail: scan satu kolom pendek, cukup untuk tool internal;
        // ceiling: RPC max(nomor) / sequence bila tabel puluhan ribu baris.
        const { data: allNo } = await db.from('examinations').select('no_urut');
        let maxNum = 0;
        for (const r of (allNo ?? []) as { no_urut: string }[]) {
          const m = /^P-(\d+)$/.exec(r.no_urut ?? '');
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        }
        lastNo = `P-${String(maxNum).padStart(2, '0')}`;
      }
      noUrut = generateNoUrut(lastNo);
      lastNo = noUrut;
      const { data, error: examErr } = await db
        .from('examinations')
        .insert({
          no_urut: noUrut,
          patient_id: patientId,
          tgl_permintaan,
          dokter: dokter?.trim() || null,
          petugas: petugas?.trim() || null,
          status_biaya: status_biaya || 'Umum',
          ...labCols,
        })
        .select('id').single();
      if (!examErr && data) { exam = data; break; }
      if (examErr?.code !== '23505' || attempt === 2) {
        console.error('examinations insert error:', examErr);
        return NextResponse.json({ error: 'Gagal simpan pemeriksaan' }, { status: 500 });
      }
    }
    if (!exam) {
      return NextResponse.json({ error: 'Gagal simpan pemeriksaan' }, { status: 500 });
    }

    await writeAudit(user.email, {
      action: 'CREATE',
      entity: 'examination',
      entity_id: exam.id,
      description: `Input pemeriksaan no_urut ${noUrut} untuk ${nama_pasien.trim()}`,
    });

    return NextResponse.json({ success: true, no_urut: noUrut });
  } catch (err) {
    console.error('examinations POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
