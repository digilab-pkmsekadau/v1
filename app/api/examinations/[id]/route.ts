import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { writeAudit } from '@/lib/audit';
import { ALL_PARAMS } from '@/lib/param-options';
import { getAuthedUser, requireAuth } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

// Batas nilai PUT: cegah string raksasa/tipe salah masuk DB (DoS/korupsi data).
const updateSchema = z.object({
  tgl_permintaan: z.string().trim().max(20).optional(),
  dokter: z.string().trim().max(200).nullable().optional(),
  petugas: z.string().trim().max(200).nullable().optional(),
  status_biaya: z.enum(['Umum', 'BPJS', 'Gratis']).optional(),
}).catchall(z.string().trim().max(500));

// Allowlist kolom yang boleh diupdate: metadata pemeriksaan + semua kolom hasil lab.
// Mencegah mass-assignment ke kolom sistem (id, patient_id, no_urut, created_at).
const EDITABLE_COLUMNS = new Set<string>([
  'tgl_permintaan',
  'dokter',
  'petugas',
  'status_biaya',
  ...ALL_PARAMS.map(p => p.key),
]);

// GET /api/examinations/[id] — ambil detail lengkap
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const denied = await requireAuth();
    if (denied) return denied;
    const db = createServerClient();
    const { id } = await params;

    const { data, error } = await db
      .from('examinations')
      .select('*, patients(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('examinations GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/examinations/[id] — update data examination
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const denied = await requireAuth();
    if (denied) return denied;
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = createServerClient();
    const { id } = await params;
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined && EDITABLE_COLUMNS.has(key)) updateData[key] = value;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field valid untuk diupdate' }, { status: 400 });
    }

    const { data, error } = await db
      .from('examinations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('DB error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }

    await writeAudit(user.email, {
      action: 'UPDATE',
      entity: 'examination',
      entity_id: id,
      description: `Ubah field: ${Object.keys(updateData).join(', ')}`,
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error('examinations PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/examinations/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const denied = await requireAuth();
    if (denied) return denied;
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = createServerClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    // Ambil no_urut sebelum hapus: setelah baris hilang, jejak audit tidak bisa
    // lagi merujuk pemeriksaan mana yang dihapus selain lewat UUID.
    const { data: before } = await db
      .from('examinations')
      .select('no_urut')
      .eq('id', id)
      .maybeSingle();

    const { error } = await db
      .from('examinations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DB error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }

    await writeAudit(user.email, {
      action: 'DELETE',
      entity: 'examination',
      entity_id: id,
      description: `Hapus pemeriksaan no_urut ${before?.no_urut ?? '-'}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('examinations DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
