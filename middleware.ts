import { createServerClient } from '@supabase/ssr';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { validateEnv } from '@/lib/validate-env';

const PUBLIC_PATHS = ['/login', '/api/auth'];

validateEnv();

// Halaman yang hanya bisa diakses admin
const ADMIN_ONLY_PATHS = ['/settings', '/api/examinations/yearly', '/api/backup', '/api/audit'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiPath = pathname.startsWith('/api');

  // Izinkan public paths
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key',
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data?.user) {
    if (isApiPath) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = data.user;

  // Cek role untuk halaman admin-only. Default deny jika role tidak valid.
  const isAdminPath = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p));
  if (isAdminPath) {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || roleData?.role !== 'admin') {
      if (isApiPath) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
