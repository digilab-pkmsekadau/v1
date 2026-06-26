import { NextResponse } from 'next/server';

import { clearSession } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    const response = NextResponse.json({ success: true });
    await clearSession(response);
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    await clearSession(response);
    return response;
  }
}