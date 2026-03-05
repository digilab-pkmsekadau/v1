import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';

// GET /api/audit — ambil log aktivitas terbaru
export async function GET(request: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    const { data, error } = await db
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Kalau tabel belum ada, return empty array (graceful)
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], message: 'Tabel audit_log belum dibuat' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/audit — catat aktivitas (dipanggil dari client/server-side)
export async function POST(request: NextRequest) {
  try {
    const db = createServerClient();
    const body = await request.json();
    const { action, entity, entity_id, description, user_email } = body;

    const { error } = await db.from('audit_log').insert({
      action,       // CREATE | UPDATE | DELETE
      entity,       // examinations | patients | settings
      entity_id,    // ID record yang diubah
      description,  // Deskripsi human-readable
      user_email,   // Email petugas
    });

    if (error) {
      // Graceful kalau tabel belum ada
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, message: 'audit_log table not found, skipped' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
