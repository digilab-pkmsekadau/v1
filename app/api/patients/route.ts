import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/patients — search pasien by nama/NIK
// Mengembalikan juga `last_status_biaya` dari examination terbaru pasien
export async function GET(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    let query = db
      .from('patients')
      .select(`
        id, nama, nik, jenis_kelamin, alamat, tgl_lahir, created_at,
        examinations (status_biaya, tgl_permintaan, created_at)
      `)
      .order('nama', { ascending: true })
      .limit(50);

    if (q) {
      query = query.or(`nama.ilike.%${q}%,nik.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Ambil status_biaya dari examination terbaru
    const enriched = (data || []).map((p) => {
      const exams = (p.examinations as Array<{ status_biaya?: string; tgl_permintaan?: string; created_at?: string }>) || [];
      const sorted = [...exams].sort((a, b) => {
        const da = new Date(a.tgl_permintaan || a.created_at || 0).getTime();
        const db = new Date(b.tgl_permintaan || b.created_at || 0).getTime();
        return db - da;
      });
      const last_status_biaya = sorted[0]?.status_biaya ?? null;
      // Hilangkan field examinations dari hasil agar payload ringan
      const { examinations: _e, ...rest } = p as Record<string, unknown>;
      void _e;
      return { ...rest, last_status_biaya };
    });

    return NextResponse.json({ data: enriched });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
