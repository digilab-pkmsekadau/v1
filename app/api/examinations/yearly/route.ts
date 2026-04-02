import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const db = createServerClient();
    const body = await request.json();
    const { year } = body;

    if (!year || year.toString().length !== 4) {
      return NextResponse.json({ error: 'Format tahun tidak valid (harus 4 digit)' }, { status: 400 });
    }

    const { error } = await db
      .from('examinations')
      .delete()
      .gte('tgl_permintaan', `${year}-01-01`)
      .lte('tgl_permintaan', `${year}-12-31`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('delete yearly error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
