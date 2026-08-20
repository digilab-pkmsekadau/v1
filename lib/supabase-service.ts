import 'server-only';

import { createClient } from '@supabase/supabase-js';

// Service-role client — HANYA untuk API routes / server. Memakai SUPABASE_SERVICE_ROLE_KEY
// yang bypass RLS, jadi file ini WAJIB server-only agar key tidak pernah masuk client bundle.
// Fail-fast: kalau env hilang di production, error jelas daripada gagal senyap.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server env tidak lengkap: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
