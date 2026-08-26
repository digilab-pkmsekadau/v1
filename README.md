# DigiLab

Aplikasi pencatatan dan pelaporan hasil laboratorium untuk Puskesmas Sekadau. Petugas menginput hasil pemeriksaan lab per pasien, sistem mendeteksi nilai abnormal (gender-aware), lalu hasil bisa dicetak formal berkop-surat dan diekspor ke Excel.

## Fitur

- Input hasil lab dinamis per-parameter (hematologi, kimia, imunologi, mikrobiologi, urinalisis)
- Deteksi nilai abnormal berbasis rentang normal per jenis kelamin
- Manajemen data pasien + riwayat pemeriksaan
- Dashboard statistik (grafik) dan cetak hasil formal
- Export Excel bulanan/tahunan
- Backup database dan audit log
- Autentikasi Supabase + kontrol akses admin

## Tech Stack

- Next.js 15 (App Router), React 18, TypeScript
- Supabase (Postgres + Auth)
- Tailwind CSS v4, shadcn/ui, Recharts
- react-hook-form + zod, SheetJS (xlsx)

## Setup

1. Install dependency:
   ```bash
   npm install
   ```
2. Salin `.env.example` ke `.env.local` dan isi kredensial Supabase:
   ```bash
   cp .env.example .env.local
   ```
   Variabel wajib: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. `VISION_API_KEY` opsional — tanpa itu hanya fitur OCR foto hasil lab yang mati.
3. Buat skema database dengan menjalankan `supabase_migration.sql` di SQL Editor Supabase.
4. Jalankan `supabase_rls_migration.sql` — mengaktifkan RLS dan memberi role `petugas` ke akun yang belum punya. **Wajib sebelum deploy**: kode menolak akun tanpa baris di `user_roles`, jadi tanpa langkah ini akun lama terkunci.
5. Matikan **Enable sign-ups** di Supabase Dashboard → Authentication → Providers → Email. Anon key ada di browser, jadi signup terbuka berarti siapa pun bisa membuat akun. Tambah petugas lewat Invite user, lalu masukkan barisnya ke `user_roles`.
6. Jalankan dev server:
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000.

## Perintah

```bash
npm run dev      # dev server
npm run build    # production build (sekaligus typecheck de-facto)
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

Belum ada test suite; verifikasi perubahan lewat `npx tsc --noEmit` dan `npm run build`.

## Arsitektur singkat

- `app/api/**` - REST endpoint, memakai service-role client (`lib/supabase-service.ts`) yang bypass RLS. Otorisasi ditegakkan di `middleware.ts` dan guard `lib/require-auth.ts`.
- `app/(app)/**` - halaman ter-autentikasi (dashboard, input, pasien, riwayat, settings).
- `lib/normal-ranges.ts` - logika deteksi abnormal. `lib/param-options.ts` - daftar parameter lab.
- Data pemeriksaan disimpan di satu tabel lebar `examinations` (satu kolom per parameter).

Menambah parameter lab baru menyentuh banyak file - lihat `CLAUDE.md`.

## Deploy

Butuh SSR + API routes (bukan static export). Deploy ke Vercel atau host Node lain. Set env yang sama di dashboard hosting.
