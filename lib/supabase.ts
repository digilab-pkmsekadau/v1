import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser/Client-side client (untuk login, auth di client component) ──────
// Service-role client dipindah ke lib/supabase-service.ts (server-only) agar
// SUPABASE_SERVICE_ROLE_KEY tidak pernah masuk client bundle.
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
