import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const db = createServerClient();
    
    const { data, error } = await db
      .from('config')
      .select('key, value')
      .in('key', ['LIST_DOKTER', 'LIST_PETUGAS']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const dokterRow = data?.find(r => r.key === 'LIST_DOKTER');
    const petugasRow = data?.find(r => r.key === 'LIST_PETUGAS');

    const dokters = dokterRow?.value
      ? dokterRow.value.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const petugas = petugasRow?.value
      ? petugasRow.value.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    return NextResponse.json({ dokters, petugas });
  } catch (err) {
    console.error('config GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = createServerClient();
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: 'key dan value diperlukan' }, { status: 400 });
    }

    const { error } = await db
      .from('config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('config PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
