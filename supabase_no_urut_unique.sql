-- Cegah no_urut duplikat saat dua petugas submit bareng (retry 23505 di POST).
-- Idempoten: aman dijalankan berulang. Bersihkan duplikat lama dulu bila ada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'examinations_no_urut_unique'
  ) THEN
    ALTER TABLE examinations ADD CONSTRAINT examinations_no_urut_unique UNIQUE (no_urut);
  END IF;
END $$;
