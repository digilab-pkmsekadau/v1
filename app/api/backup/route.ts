import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = createServerClient();

    // Ambil semua data dari tabel-tabel utama secara paralel
    const [patientsResult, examinationsResult, configResult] = await Promise.all([
      db.from('patients').select('*').order('created_at', { ascending: true }),
      db.from('examinations').select('*').order('created_at', { ascending: true }),
      db.from('config').select('*'),
    ]);

    if (patientsResult.error) {
      return NextResponse.json({ error: 'Gagal mengambil data pasien: ' + patientsResult.error.message }, { status: 500 });
    }
    if (examinationsResult.error) {
      return NextResponse.json({ error: 'Gagal mengambil data pemeriksaan: ' + examinationsResult.error.message }, { status: 500 });
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

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('backup GET error:', err);
    return NextResponse.json({ error: 'Server error: ' + String(err) }, { status: 500 });
  }
}
