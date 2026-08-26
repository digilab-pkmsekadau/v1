import 'server-only';

import { createServerClient } from '@/lib/supabase-service';

type AuditEntry = {
  action: string;
  entity: string;
  entity_id?: string | null;
  description?: string | null;
};

/**
 * Catat aktivitas ke audit_log. user_email SELALU diambil dari sesi server,
 * jangan pernah dari body request — kalau tidak jejak audit bisa dipalsukan.
 * Gagal menulis audit tidak boleh membatalkan operasi utama, jadi error hanya di-log.
 */
export async function writeAudit(userEmail: string | null | undefined, entry: AuditEntry) {
  try {
    const { error } = await createServerClient()
      .from('audit_log')
      .insert({ ...entry, user_email: userEmail ?? null });
    if (error && error.code !== '42P01') {
      console.error('audit_log insert error:', error);
    }
  } catch (err) {
    console.error('writeAudit error:', err);
  }
}
