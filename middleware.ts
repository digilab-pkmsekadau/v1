import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/api/auth'];

// Halaman yang hanya bisa diakses admin
const ADMIN_ONLY_PATHS = ['/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Cek role untuk halaman admin-only (permissive: kalau tabel belum ada, izinkan)
  const isAdminPath = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p));
  if (isAdminPath) {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Hanya blokir kalau tabel ada DAN role eksplisit bukan admin
    // Kalau error (tabel belum ada) atau belum ada row → izinkan akses
    if (!roleError && roleData && roleData.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
