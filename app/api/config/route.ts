import { NextResponse } from 'next/server';

import { requireAdmin, requireAuth } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

const READABLE_CONFIG_KEYS = [
  'LIST_DOKTER',
  'LIST_PETUGAS',
  'logo_url',
  'doctor_signature',
  'tech_signature',
  'print_template',
] as const;
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

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
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

    const valueOf = (key: string) => data?.find(r => r.key === key)?.value ?? '';

    return NextResponse.json({
      dokters,
      petugas,
      logo_url: valueOf('logo_url'),
      doctor_signature: valueOf('doctor_signature'),
      tech_signature: valueOf('tech_signature'),
      print_template: valueOf('print_template'),
    });
  } catch (err) {
    console.error('config GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

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