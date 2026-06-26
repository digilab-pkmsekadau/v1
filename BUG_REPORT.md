# DigiLab Bug/Error Report

Tanggal pemeriksaan: 2026-06-26

## Ringkasan Validasi

- `npm run lint`: lulus, 0 error, 15 warning.
- `npx tsc --noEmit`: awalnya gagal karena referensi `.next/types` hilang/stale; setelah `npm run build` membuat ulang `.next/types`, TypeScript lulus.
- `npm run build`: gagal di sandbox dengan `spawn EPERM`, tetapi berhasil saat dijalankan di luar sandbox. Output build masih menampilkan warning ESLint internal: `Invalid Options: useEslintrc, extensions`.

## Temuan Prioritas

### 1. High - Sistem auth bercampur antara cookie PIN lama dan Supabase Auth

Referensi:
- `lib/auth.ts:6`, `lib/auth.ts:21`, `lib/auth.ts:42`
- `app/page.tsx:3`, `app/page.tsx:6`, `app/page.tsx:8`, `app/page.tsx:10`
- `app/login/page.tsx:52`, `app/login/page.tsx:63`
- `middleware.ts:39`

Root page (`/`) menentukan redirect memakai cookie `digilab_session` dari auth PIN lama, sedangkan halaman login dan middleware memakai Supabase Auth. Akibatnya user yang berhasil login via Supabase bisa tetap diarahkan ke `/login` saat membuka `/`, karena cookie PIN tidak pernah dibuat oleh alur login Supabase.

Rekomendasi:
- Samakan satu sumber kebenaran auth. Jika Supabase Auth adalah alur utama, hapus/ubah `isAuthenticated()` di `app/page.tsx` agar memakai Supabase session.
- Jika PIN masih dibutuhkan, integrasikan PIN sebagai tahap tambahan setelah Supabase login, bukan sistem session terpisah.

### 2. High - Akses admin permissive jika role tidak ditemukan atau query role error

Referensi:
- `middleware.ts:12`
- `middleware.ts:50`
- `middleware.ts:58`

Halaman `/settings` hanya diblokir jika query `user_roles` sukses dan role eksplisit bukan `admin`. Jika tabel belum ada, query error, atau user belum punya row role, akses justru diizinkan.

Dampak:
- User non-admin yang sudah login bisa masuk ke halaman pengaturan jika data role belum lengkap atau query role bermasalah.

Rekomendasi:
- Gunakan default deny untuk admin route: izinkan hanya jika `roleData?.role === 'admin'`.
- Tangani error role sebagai 403/redirect, bukan allow.

### 3. Medium - Search pasien raw string rentan error untuk karakter khusus

Referensi:
- `app/api/patients/route.ts:14`
- `app/api/patients/route.ts:26`

Input query `q` langsung dimasukkan ke filter Supabase `.or(\`nama.ilike.%${q}%,nik.ilike.%${q}%\`)`. Karakter khusus PostgREST seperti koma, tanda kurung, atau `%` dapat mengubah parsing filter, menghasilkan error, atau hasil pencarian tidak akurat.

Rekomendasi:
- Escape karakter khusus untuk filter PostgREST, atau gunakan strategi query yang tidak menyusun filter dari raw input.
- Batasi panjang query dan validasi karakter untuk NIK/nama.

### 4. Medium - Endpoint update config menolak nilai kosong, sementara UI mengizinkan beberapa field kosong

Referensi:
- `app/(app)/settings/page.tsx:67`
- `app/(app)/settings/page.tsx:76`
- `app/api/config/route.ts:43`

UI mengizinkan beberapa config tertentu disimpan kosong, tetapi API `PUT /api/config` menolak semua payload dengan `!value`. Ini bisa membuat user tidak bisa mengosongkan field config walaupun UI menganggap valid.

Rekomendasi:
- Ubah validasi API menjadi mengecek `key` wajib, sementara `value` boleh string kosong untuk key yang memang boleh kosong.
- Validasi key dengan whitelist agar endpoint tidak bisa mengubah config sembarang.

### 5. Medium - Hapus data tahunan hanya validasi panjang tahun, belum validasi angka/range

Referensi:
- `app/api/examinations/yearly/route.ts:14`
- `app/api/examinations/yearly/route.ts:20`
- `app/api/examinations/yearly/route.ts:21`
- `app/api/examinations/yearly/route.ts:22`

Endpoint delete tahunan hanya mengecek panjang `year` sama dengan 4. Nilai seperti `"abcd"` lolos validasi awal dan dipakai untuk range tanggal. Ini tidak selalu menghapus data, tetapi tetap bug validasi pada endpoint destruktif.

Rekomendasi:
- Validasi dengan regex `^\d{4}$`.
- Batasi range tahun yang masuk akal.
- Pertimbangkan verifikasi admin server-side sebelum operasi delete.

### 6. Low - `npx tsc --noEmit` bisa gagal karena `.next/types` stale/hilang

Referensi:
- `tsconfig.json:19`
- `tsconfig.json:35`
- `tsconfig.json:36`

TypeScript awalnya gagal karena file `.next/types/...` yang dirujuk oleh include pattern tidak ada. Setelah build ulang, error hilang.

Rekomendasi:
- Tambahkan script typecheck yang stabil, misalnya menjalankan `next build` untuk validasi Next, atau bersihkan `.next`/`tsconfig.tsbuildinfo` sebelum typecheck di CI.
- Pastikan artefak `.next` tidak menjadi sumber error palsu saat developer menjalankan `tsc` langsung.

### 7. Low - Build menampilkan warning ESLint internal karena kombinasi Next/ESLint

Referensi:
- `package.json:21`
- `package.json:42`
- `package.json:43`

Build berhasil, tetapi output menampilkan `ESLint: Invalid Options: useEslintrc, extensions`. Ini indikasi mismatch konfigurasi/versi ESLint dengan integrasi Next.

Rekomendasi:
- Evaluasi versi `eslint`, `eslint-config-next`, dan format config flat `eslint.config.js`.
- Pastikan CI menangkap lint lewat `npm run lint`, karena build saat ini tetap exit 0 meskipun warning ESLint internal muncul.

## Warning Lint

Lint menemukan 15 warning, mayoritas unused import/variable dan satu dependency hook:

- `app/(app)/dashboard/page.tsx:96`, `app/(app)/dashboard/page.tsx:131`
- `app/(app)/input/page.tsx:144`, `app/(app)/input/page.tsx:150`, `app/(app)/input/page.tsx:177`, `app/(app)/input/page.tsx:180`
- `app/(app)/pasien/[id]/page.tsx:3`
- `app/(app)/riwayat/page.tsx:13`
- `app/(app)/settings/page.tsx:3`
- `app/api/audit/route.ts:30`, `app/api/audit/route.ts:58`
- `app/api/examinations/route.ts:5`
- `app/api/patients/[id]/route.ts:39`
- `app/api/patients/route.ts:25`

Rekomendasi:
- Bersihkan unused variable/import.
- Perbaiki dependency `useEffect` di `app/(app)/input/page.tsx:177`.
- Kurangi `any` pada data form/export agar perubahan schema lebih mudah tertangkap TypeScript.

## Catatan Tambahan

- Banyak file memiliki teks mojibake seperti `â€”`, `â†’`, `Âµ`, dan `Â©`. Ini tidak selalu memecahkan build, tetapi bisa muncul sebagai teks rusak di UI atau komentar source.
- Worktree saat diperiksa sudah berisi banyak perubahan lokal. Pemeriksaan ini tidak mereset atau mengubah source aplikasi, hanya menambahkan report ini.

## Status Perbaikan 2026-06-26

Sudah diperbaiki:

- Root redirect sekarang memakai Supabase Auth, bukan cookie PIN lama.
- Logout Supabase sekarang juga membersihkan cookie session PIN lama `digilab_session`.
- Guard admin di middleware sekarang default-deny jika role error, tidak ada row role, atau role bukan `admin`.
- Endpoint admin/destruktif `/api/examinations/yearly`, `/api/backup`, dan `/api/audit` ikut masuk guard admin middleware.
- `PUT /api/config` sekarang memverifikasi user admin langsung di route, memakai whitelist key, dan mengizinkan value kosong hanya untuk field opsional.
- Search pasien sekarang menyanitasi query dan membatasi panjang input sebelum menyusun filter Supabase.
- Delete tahunan sekarang hanya menerima tahun numerik 4 digit dalam rentang yang masuk akal.

Validasi setelah perbaikan:

- `npm run lint`: lulus, 0 error, 14 warning tersisa dari area lain.
- `npx tsc --noEmit`: lulus.
- `npm run build`: berhasil di luar sandbox; sandbox lokal masih gagal dengan `spawn EPERM` karena pembatasan proses child Next.

Catatan keamanan data:

- Perbaikan ini hanya mengubah source code. Tidak ada command atau migrasi yang menghapus data database.
- Endpoint hapus tahunan tetap ada, tetapi validasinya diperketat dan aksesnya dibatasi admin.