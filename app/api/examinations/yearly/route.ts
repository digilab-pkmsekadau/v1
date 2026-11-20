import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { writeAudit } from '@/lib/audit';
import { getAuthedUser, requireAdmin } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const db = createServerClient();
    const body = await request.json();
    const year = String(body.year ?? '').trim();

    if (!/^\d{4}$/.test(year)) {
      return NextResponse.json({ error: 'Format tahun tidak valid (harus 4 digit)' }, { status: 400 });
    }

    const yearNumber = Number(year);
    const currentYear = new Date().getFullYear();
    if (yearNumber < 2000 || yearNumber > currentYear + 1) {
      return NextResponse.json({ error: 'Tahun di luar rentang yang diizinkan' }, { status: 400 });
    }

    // Hitung + hapus per-batch: tanpa paginasi cap 1000 bikin audit undercount
    // (tahun >1000 baris) dan delete bisa tak tuntas. ponytail: 2 pass
    // (collect id lalu delete per-100); ceiling: RPC server-side bila >10rb/thn.
    const PAGE_SIZE = 1000;
    const ids: string[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error: pageErr } = await db
        .from('examinations')
        .select('id')
        .gte('tgl_permintaan', `${year}-01-01`)
        .lte('tgl_permintaan', `${year}-12-31`)
        .range(from, from + PAGE_SIZE - 1);
      if (pageErr) {
        console.error('DB error:', pageErr);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
      }
      if (!page || page.length === 0) break;
      ids.push(...page.map((r: { id: string }) => r.id));
      if (page.length < PAGE_SIZE) break;
    }
    for (let i = 0; i < ids.length; i += 100) {
      const { error } = await db.from('examinations').delete().in('id', ids.slice(i, i + 100));
      if (error) {
        console.error('DB error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
      }
    }
    const deletedCount = ids.length;
    const user = await getAuthedUser();
    await writeAudit(user?.email, {
      action: 'DELETE_YEAR',
      entity: 'examination',
      description: `Hapus ${deletedCount} pemeriksaan tahun ${year} (backup wajib sebelum hapus)`,
    });
    return NextResponse.json({ success: true, deleted: deletedCount });
  } catch (err) {
    console.error('delete yearly error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}