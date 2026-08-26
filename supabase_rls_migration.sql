-- Hardening akses: "punya akun Supabase" bukan izin akses. Setiap user WAJIB punya
-- baris di user_roles ('admin' atau 'petugas') sebelum middleware.ts /
-- lib/require-auth.ts mengizinkan apa pun. Jalankan di SQL Editor Supabase.
--
-- Status per 2026-08-26 (diverifikasi lewat REST API dengan anon key):
--   langkah 1 SUDAH aktif (insert role 'Admin' ditolak 23514)
--   langkah 2 SUDAH jalan (labpkmsekadau@gmail.com -> petugas)
--   langkah 3 SUDAH beres (anon SELECT [] , INSERT 42501, DELETE tanpa efek)
--   langkah 4 SUDAH aktif untuk patients/examinations/config/user_roles
--   config.APP_PIN SUDAH dihapus (sisa autentikasi PIN yang tidak dipakai lagi)
-- Skrip ini idempoten, aman dijalankan berulang.

-- 1. SUDAH AKTIF. Batasi nilai role supaya typo tidak jadi role tak dikenal.
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'petugas'));

-- 2. SUDAH DIJALANKAN. Tetap di sini untuk akun yang ditambahkan kemudian.
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'petugas'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id);

-- 3. SUDAH BERES. Sebelumnya anon key bisa SELECT, INSERT, dan DELETE audit_log —
--    jejak "siapa mengubah/menghapus rekam medis" bisa dibaca, dipalsukan, dan
--    dihapus dari internet. Blok di bawah menutup dua sebabnya sekaligus: aktifkan
--    RLS, lalu buang semua policy. Aplikasi memakai service-role yang bypass RLS,
--    jadi tabel ini tidak butuh policy apa pun — policy justru yang membuka pintu.
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.audit_log', p.policyname);
    RAISE NOTICE 'dropped policy: %', p.policyname;
  END LOOP;
END $$;

-- 4. SUDAH AKTIF. Dibiarkan supaya setup dari nol tetap benar.
--    Tanpa policy = anon key tidak bisa apa-apa. Akses aplikasi lewat service-role.
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Verifikasi 1 — akun tanpa role, harus 0 baris:
-- SELECT u.email FROM auth.users u
-- LEFT JOIN user_roles r ON r.user_id = u.id WHERE r.user_id IS NULL;

-- Verifikasi 2 — rls_aktif harus true DAN jumlah_policy harus 0 untuk kelima tabel.
-- rowsecurity true tapi masih ada policy = anon tetap bisa masuk.
-- SELECT c.relname AS tabel,
--        c.relrowsecurity AS rls_aktif,
--        (SELECT count(*) FROM pg_policies p
--          WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS jumlah_policy
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public'
--   AND c.relname IN ('user_roles','patients','examinations','config','audit_log')
-- ORDER BY c.relname;

