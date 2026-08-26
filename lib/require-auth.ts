// Server-only auth guards untuk API routes (defense-in-depth di atas middleware).
import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createServerClient } from '@/lib/supabase-service';

export const ALLOWED_ROLES = ['admin', 'petugas'] as const;
export type AppRole = (typeof ALLOWED_ROLES)[number];

/** Kembalikan user Supabase yang terautentikasi, atau null. */
export async function getAuthedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Role user dari tabel user_roles, atau null kalau belum di-provision.
 * Dibaca dengan service-role client: pembacaan role tidak boleh bergantung pada
 * RLS policy user_roles, kalau tidak admin sah bisa terkunci dari fiturnya sendiri.
 */
export async function getUserRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await createServerClient()
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('user_roles lookup error:', error);
    return null;
  }
  const role = data?.role;
  return ALLOWED_ROLES.includes(role as AppRole) ? (role as AppRole) : null;
}

/** User login + role-nya sudah di-provision. Null kalau tidak lolos. */
export async function getAuthorizedUser() {
  const user = await getAuthedUser();
  if (!user) return null;
  const role = await getUserRole(user.id);
  if (!role) return null;
  return { user, role };
}

/** True jika user login DAN role-nya admin. */
export async function isAdminUser() {
  return (await getAuthorizedUser())?.role === 'admin';
}

/**
 * Guard: 401 kalau belum login, 403 kalau akun belum diberi role.
 * Signup Supabase terbuka, jadi "punya akun" saja bukan izin akses.
 */
export async function requireAuth() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await getUserRole(user.id))) {
    return NextResponse.json({ error: 'Akun belum diberi akses' }, { status: 403 });
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
