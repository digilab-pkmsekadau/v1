import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin, requireAuth } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

const auditSchema = z.object({
  action: z.string().min(1).max(100),
  entity: z.string().min(1).max(100),
  entity_id: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  user_email: z.string().email().max(320).optional(),
});

// GET /api/audit — ambil log aktivitas terbaru (admin only)
export async function GET(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const parsedLimit = parseInt(searchParams.get('limit') ?? '50', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 50;

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
      console.error('DB error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// POST /api/audit — catat aktivitas (login required)
export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth();
    if (denied) return denied;

    const db = createServerClient();
    const parsed = auditSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const { error } = await db.from('audit_log').insert(parsed.data);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, message: 'audit_log table not found, skipped' });
      }
      console.error('DB error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
