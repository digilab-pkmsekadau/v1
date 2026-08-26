import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { getAuthedUser } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/patients/[id] — riwayat lengkap pasien + semua pemeriksaan
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    if (!(await getAuthedUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = createServerClient();
    const { id } = await params;

    // Data pasien
    const { data: patient, error: pErr } = await db
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (pErr || !patient) {
      return NextResponse.json({ error: 'Pasien tidak ditemukan' }, { status: 404 });
    }

    // Semua pemeriksaan pasien ini
    const { data: examinations, error: eErr } = await db
      .from('examinations')
      .select('*')
      .eq('patient_id', id)
      .order('tgl_permintaan', { ascending: true });

    if (eErr) {
      console.error('examinations select error:', eErr);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }

    return NextResponse.json({ patient, examinations: examinations ?? [] });
  } catch (err) {
    console.error('patients GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
