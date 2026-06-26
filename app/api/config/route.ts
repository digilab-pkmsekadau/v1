import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const READABLE_CONFIG_KEYS = ['LIST_DOKTER', 'LIST_PETUGAS'] as const;
const WRITABLE_CONFIG_KEYS = [
  'LIST_DOKTER',
  'LIST_PETUGAS',
  'logo_url',
  'doctor_signature',
  'tech_signature',
  'print_template',
] as const;
const OPTIONAL_CONFIG_KEYS = new Set<string>([
  'logo_url',
  'doctor_signature',
  'tech_signature',
  'print_template',
]);

async function isAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return false;

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  return !roleError && roleData?.role === 'admin';
}

export async function GET() {
  try {
    const db = createServerClient();

    const { data, error } = await db
      .from('config')
      .select('key, value')
      .in('key', [...READABLE_CONFIG_KEYS]);

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
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const db = createServerClient();
    const body = await request.json();
    const key = typeof body.key === 'string' ? body.key : '';
    const value = typeof body.value === 'string' ? body.value.trim() : '';

    if (!WRITABLE_CONFIG_KEYS.includes(key as (typeof WRITABLE_CONFIG_KEYS)[number])) {
      return NextResponse.json({ error: 'key tidak valid' }, { status: 400 });
    }

    if (!value && !OPTIONAL_CONFIG_KEYS.has(key)) {
      return NextResponse.json({ error: 'value diperlukan' }, { status: 400 });
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