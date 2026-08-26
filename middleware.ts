import { createServerClient } from '@supabase/ssr';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { validateEnv } from '@/lib/validate-env';

const PUBLIC_PATHS = ['/login', '/api/auth/logout'];

// Aset publik di root public/ (satu segmen, ada ekstensi). Sengaja TIDAK memakai
// pola ".*\.png$": pola itu juga cocok dengan route dinamis seperti
// /api/patients/<id>.png dan melewatkan seluruh gate auth.
const PUBLIC_FILE = /^\/[\w.-]+\.(png|jpg|jpeg|svg|ico|json|txt|webmanifest)$/;

validateEnv();

// Halaman yang hanya bisa diakses admin
const ADMIN_ONLY_PATHS = ['/settings', '/api/examinations/yearly', '/api/backup', '/api/audit'];

function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiPath = matchesPath(pathname, '/api');

  // Izinkan public paths + aset statis di root public/
  const isPublic = PUBLIC_PATHS.some(p => matchesPath(pathname, p)) || PUBLIC_FILE.test(pathname);
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

  // Wajib punya baris di user_roles. Signup Supabase terbuka, jadi akun sah saja
  // tidak cukup — tanpa role yang di-provision admin, akses ditolak (default deny).
  // Query lewat REST langsung dengan service-role agar tidak terblokir RLS
  // (Edge runtime middleware tidak bisa memakai supabase-js client).
  let role: string | null = null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceKey) {
      const roleRes = await fetch(
        `${url}/rest/v1/user_roles?user_id=eq.${user.id}&select=role`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: 'no-store',
        }
      );
      if (roleRes.ok) {
        const rows: { role?: string }[] = await roleRes.json();
        role = rows?.[0]?.role ?? null;
      }
    }
  } catch {
    role = null;
  }

  if (role !== 'admin' && role !== 'petugas') {
    if (isApiPath) {
      return NextResponse.json({ error: 'Akun belum diberi akses' }, { status: 403 });
    }
    const denied = NextResponse.redirect(new URL('/login?error=no_access', request.url));
    denied.cookies.delete('digilab_session');
    return denied;
  }

  const isAdminPath = ADMIN_ONLY_PATHS.some(p => matchesPath(pathname, p));
  if (isAdminPath && role !== 'admin') {
    if (isApiPath) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico$).*)'],
};
