import { createServerClient } from './supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'digilab_session';
const SESSION_VALUE = 'authenticated';

export async function verifyPin(pin: string): Promise<boolean> {
  const db = createServerClient();
  const { data, error } = await db
    .from('config')
    .select('value')
    .eq('key', 'APP_PIN')
    .single();

  if (error || !data) return false;
  return data.value.trim() === pin.trim();
}

export async function setSession(response: NextResponse): Promise<NextResponse> {
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
  return response;
}

export async function getSession(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get(SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}

export async function clearSession(response: NextResponse): Promise<NextResponse> {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    return session?.value === SESSION_VALUE;
  } catch {
    return false;
  }
}
