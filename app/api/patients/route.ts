import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAuthedUser } from '@/lib/require-auth';
import { createServerClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

function sanitizeSearchTerm(value: string) {
  return value
    .replace(/[%,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

// GET /api/patients - search pasien by nama/NIK
// Mengembalikan juga `last_status_biaya` dari examination terbaru pasien
export async function GET(request: NextRequest) {
  try {
    if (!(await getAuthedUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = createServerClient();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const safeQ = sanitizeSearchTerm(q);

    const SELECT_COLS = `
      id, nama, nik, jenis_kelamin, alamat, tgl_lahir, created_at,
      examinations (status_biaya, tgl_permintaan, created_at)
    `;

    if (q && !safeQ) {
      return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 25 });
    }

    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') ?? '25', 10) || 25, 5), 100);
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
    const from = (page - 1) * pageSize;

    let listQuery = db
      .from('patients')
      .select(SELECT_COLS, { count: 'exact' });

    if (safeQ) {
      listQuery = listQuery.or(`nama.ilike.%${safeQ}%,nik.ilike.%${safeQ}%`);
    }

    const { data, error, count } = await listQuery
      .order('nama', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('DB error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as Record<string, unknown>[];

    // Ambil status_biaya dari examination terbaru
    const enriched: (Record<string, unknown> & { last_status_biaya: string | null; last_exam_count: number })[] = rows.map((p) => {
      const exams = (p.examinations as Array<{ status_biaya?: string; tgl_permintaan?: string; created_at?: string }>) || [];
      const sorted = [...exams].sort((a, b) => {
        const da = new Date(a.tgl_permintaan || a.created_at || 0).getTime();
        const db = new Date(b.tgl_permintaan || b.created_at || 0).getTime();
        return db - da;
      });
      const last_status_biaya = sorted[0]?.status_biaya ?? null;
      const last_exam_count = exams.length;
      const { examinations: _e, ...rest } = p as Record<string, unknown>;
      void _e;
      return { ...rest, last_status_biaya, last_exam_count };
    });

    // Sort: exact match first, then starts with, then contains
    if (safeQ) {
      const qLower = safeQ.toLowerCase();
      enriched.sort((a, b) => {
        const aNama = String(a.nama || '').toLowerCase();
        const bNama = String(b.nama || '').toLowerCase();
        const aNik = String(a.nik || '').toLowerCase();
        const bNik = String(b.nik || '').toLowerCase();

        // Exact match (NIK or nama)
        const aExact = aNama === qLower || aNik === qLower;
        const bExact = bNama === qLower || bNik === qLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Starts with
        const aStarts = aNama.startsWith(qLower) || aNik.startsWith(qLower);
        const bStarts = bNama.startsWith(qLower) || bNik.startsWith(qLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // More examinations = higher priority
        return (b.last_exam_count || 0) - (a.last_exam_count || 0);
      });
    }

    return NextResponse.json({
      data: enriched,
      total: count ?? enriched.length,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil((count ?? enriched.length) / pageSize), 1),
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}