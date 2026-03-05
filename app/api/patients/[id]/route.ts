import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/patients/[id] — riwayat lengkap pasien + semua pemeriksaan
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
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
      return NextResponse.json({ error: eErr.message }, { status: 500 });
    }

    return NextResponse.json({ patient, examinations: examinations ?? [] });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
