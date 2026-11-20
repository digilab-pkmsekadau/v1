import { NextResponse } from 'next/server';
import { z } from 'zod';

import { writeAudit } from '@/lib/audit';
import { getAuthedUser, requireAdmin } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

const restoreSchema = z.object({
  dry_run: z.boolean().optional().default(true),
  data: z.object({
    patients: z.array(z.record(z.string(), z.unknown())).default([]),
    examinations: z.array(z.record(z.string(), z.unknown())).default([]),
    config: z.array(z.record(z.string(), z.unknown())).default([]),
  }),
});

export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const db = createServerClient();

    // Ambil SEMUA baris secara paginasi — backup wajib lengkap, jangan terpotong
    // batas default 1000 baris Supabase (kalau terpotong, data hilang senyap).
    async function fetchAll(table: string) {
      const PAGE_SIZE = 1000;
      const rows: Record<string, unknown>[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await db
          .from(table)
          .select('*')
          .order('created_at', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);
        if (error) return { error };
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < PAGE_SIZE) break;
      }
      return { data: rows };
    }

    const [patientsResult, examinationsResult] = await Promise.all([
      fetchAll('patients'),
      fetchAll('examinations'),
    ]);
    const configResult = await db.from('config').select('*');

    if (patientsResult.error) {
      console.error('backup patients error:', patientsResult.error);
      return NextResponse.json({ error: 'Gagal mengambil data pasien' }, { status: 500 });
    }
    if (examinationsResult.error) {
      console.error('backup examinations error:', examinationsResult.error);
      return NextResponse.json({ error: 'Gagal mengambil data pemeriksaan' }, { status: 500 });
    }

    const backup = {
      meta: {
        digilab_version: '1.0.0',
        backup_at: new Date().toISOString(),
        generated_by: 'DigiLab Puskesmas Sekadau',
        total_patients: patientsResult.data?.length ?? 0,
        total_examinations: examinationsResult.data?.length ?? 0,
      },
      data: {
        patients: patientsResult.data ?? [],
        examinations: examinationsResult.data ?? [],
        config: configResult.data ?? [],
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `backup_digilab_${dateStr}.json`;
    const user = await getAuthedUser();
    await writeAudit(user?.email, {
      action: 'EXPORT',
      entity: 'backup',
      description: `Unduh backup: ${backup.meta.total_patients} pasien, ${backup.meta.total_examinations} pemeriksaan`,
    });
    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('backup GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// POST /api/backup — restore dari file backup (admin only).
// Default dry_run: hanya hitung (ada/baru) tanpa tulis.
// Tulis nyata: upsert per id, bukan delete-all — aman dari file salah/rusak.
// ponytail: validasi per-kolom longgar (record); ceiling: skema zod penuh per tabel.
export async function POST(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const parsed = restoreSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'File backup tidak valid' }, { status: 400 });
    }
    const { dry_run, data } = parsed.data;
    const db = createServerClient();
    if (data.patients.length + data.examinations.length > 20000) {
      return NextResponse.json({ error: 'File terlalu besar (maks 20 ribu baris)' }, { status: 413 });
    }

    async function plan(table: 'patients' | 'examinations', rows: Record<string, unknown>[]) {
      const ids = rows.map(r => r.id).filter(id => typeof id === 'string') as string[];
      if (ids.length === 0) return { baru: 0, ada: 0 };
      let ada = 0;
      for (let i = 0; i < ids.length; i += 500) {
        const { data: found, error } = await db.from(table).select('id').in('id', ids.slice(i, i + 500));
        if (error) throw error;
        ada += found?.length ?? 0;
      }
      return { baru: ids.length - ada, ada };
    }

    const p = await plan('patients', data.patients);
    const e = await plan('examinations', data.examinations);
    if (dry_run) {
      return NextResponse.json({
        dry_run: true,
        patients: p, examinations: e,
        config: { baru: 0, ada: data.config.length },
        warning: 'Mode simulasi: tidak ada data ditulis. Kirim dry_run:false untuk eksekusi.',
      });
    }

    let restoredPatients = 0, restoredExams = 0;
    for (let i = 0; i < data.patients.length; i += 200) {
      const chunk = data.patients.slice(i, i + 200);
      const { error } = await db.from('patients').upsert(chunk, { onConflict: 'id' });
      if (error) throw error;
      restoredPatients += chunk.length;
    }
    for (let i = 0; i < data.examinations.length; i += 200) {
      const chunk = data.examinations.slice(i, i + 200);
      const { error } = await db.from('examinations').upsert(chunk, { onConflict: 'id' });
      if (error) throw error;
      restoredExams += chunk.length;
    }
    for (const row of data.config) {
      if (typeof row.key === 'string' && typeof row.value === 'string') {
        await db.from('config').update({ value: row.value }).eq('key', row.key);
      }
    }

    const user = await getAuthedUser();
    await writeAudit(user?.email, {
      action: 'RESTORE',
      entity: 'backup',
      description: `Restore backup: ${restoredPatients} pasien, ${restoredExams} pemeriksaan (dry_run:false)`,
    });
    return NextResponse.json({ success: true, restoredPatients, restoredExams });
  } catch (err) {
    console.error('backup POST error:', err);
    return NextResponse.json({ error: 'Restore gagal' }, { status: 500 });
  }
}
