import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/patients — search pasien by nama/NIK
export async function GET(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    let query = db
      .from('patients')
      .select('id, nama, nik, jenis_kelamin, alamat, tgl_lahir, created_at')
      .order('nama', { ascending: true })
      .limit(50);

    if (q) {
      query = query.or(`nama.ilike.%${q}%,nik.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
