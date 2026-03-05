import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Fallback ditambahkan untuk mencegah error "URL is required" saat proses BUILD di Vercel
// di mana environment variable mungkin kosong/belum terbaca.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';

// ─── Browser/Client-side client (untuk login, auth di client component) ──────
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Legacy export (kompatibilitas)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ─── Server client (service role) — hanya untuk API routes operasi DB ────────
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
