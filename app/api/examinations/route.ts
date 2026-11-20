import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { writeAudit } from '@/lib/audit';
import { ALL_PARAMS, PARAM_UNITS } from '@/lib/param-options';
import { getAuthedUser, requireAuth } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';
import { appendUnit, generateNoUrut } from '@/lib/utils';
import type { ParamItem } from '@/types';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const examinationSchema = z.object({
  nama_pasien: z.string().trim().min(1, 'Nama pasien wajib diisi').max(200),
  nik: z.string().trim().max(20).optional(),
  jenis_kelamin: z.enum(['L', 'P'], { message: 'Jenis kelamin wajib L/P' }),
  alamat: z.string().max(500).optional(),
  tgl_lahir: z.string().regex(DATE_RE, 'Tanggal lahir format YYYY-MM-DD').max(20).optional().or(z.literal('')),
  tgl_permintaan: z.string().regex(DATE_RE, 'Tanggal permintaan format YYYY-MM-DD'),
  dokter: z.string().trim().min(1, 'Dokter wajib diisi').max(200),
  petugas: z.string().trim().min(1, 'Petugas wajib diisi').max(200),
  status_biaya: z.enum(['Umum', 'BPJS', 'Gratis']),
  patient_id: z.string().uuid().optional(),
  params: z.array(z.object({
    id: z.string(),
    paramKey: z.string().max(100).refine(k => k in PARAM_UNITS, 'Parameter tidak dikenal'),
    value: z.string().max(500),
  })).default([]).superRefine((arr, ctx) => {
    arr.forEach((item, i) => {
      const info = ALL_PARAMS.find(p => p.key === item.paramKey);
      if (info?.type === 'number' && item.value.trim()) {
        const raw = item.value.trim();
        // "13,0" (ID) -> 13.0; "1.200" (ribuan ID) -> 1200; "13.0" (EN) -> 13.0.
        const n = raw.includes(',')
          ? Number(raw.replace(/\./g, '').replace(',', '.'))
          : Number(raw);
        if (Number.isNaN(n)) {
          ctx.addIssue({ code: 'custom', message: `${info.label} harus angka`, path: [i, 'value'] });
        }
      }
      if (info?.type === 'select' && info.opts && item.value.trim() && !info.opts.includes(item.value.trim())) {
        ctx.addIssue({ code: 'custom', message: `${info.label} nilai tidak valid`, path: [i, 'value'] });
      }
    });
  }),
});


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
    // Strip unit dulu: nilai edit bisa bawa unit lama ("90 mg/dl") — tanpa ini
    // tiap simpan menumpuk jadi "90 mg/dl mg/dl".
    const labCols: Record<string, string> = {};
    for (const item of (params || []) as ParamItem[]) {
      const { paramKey, value } = item;
      if (!paramKey || !value?.trim()) continue;
      if (!PARAM_UNITS.hasOwnProperty(paramKey)) continue;
      labCols[paramKey] = appendUnit(value, PARAM_UNITS[paramKey]);
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
