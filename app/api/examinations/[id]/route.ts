import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/examinations/[id] — ambil detail lengkap
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
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
    const db = createServerClient();
    const { id } = await params;
    const body = await request.json();

    // Hapus field yang tidak boleh diupdate
    const { id: _id, created_at: _ca, patient_id: _pid, no_urut: _no, patients: _pa, ...updateData } = body;

    const { data, error } = await db
      .from('examinations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
    const db = createServerClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    const { error } = await db
      .from('examinations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('examinations DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
