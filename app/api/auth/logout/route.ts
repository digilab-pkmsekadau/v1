import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function buildLogoutResponse() {
  const response = NextResponse.json({ success: true });
  // Bersihkan cookie sesi PIN lama kalau masih tersisa di browser user.
  response.cookies.delete('digilab_session');
  return response;
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return buildLogoutResponse();
  } catch {
    return buildLogoutResponse();
  }
}