import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
