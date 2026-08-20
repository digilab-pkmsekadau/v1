// Server-only auth guards untuk API routes (defense-in-depth di atas middleware).
import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

/** Kembalikan user Supabase yang terautentikasi, atau null. */
export async function getAuthedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/** True jika user login DAN role-nya admin. */
export async function isAdminUser() {
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

/** Guard: return NextResponse 401 kalau tidak login, null kalau lolos. */
export async function requireAuth() {
  if (!(await getAuthedUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** Guard: return NextResponse 403 kalau bukan admin, null kalau lolos. */
export async function requireAdmin() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }
  return null;
}
