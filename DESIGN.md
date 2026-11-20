# DESIGN.md — DigiLab Puskesmas Sekadau

Arah visual. Antislop adalah filter, file ini adalah jiwa.

## Identitas

Klinik komunitas yang dipercaya, bukan startup. Petugas puskesmas memakai
ini setiap hari di tengah antrean pasien. Desain harus tenang, cepat
dibaca, dan tidak melelahkan mata. Energi hanya muncul di momen yang
butuh tindakan (simpan, peringatan kritis).

## Palet

- Primer: teal `#0d9488` (kepercayaan klinis: steril, tenang). Dipakai di
  nav aktif, judul seksi, angka utama, tautan.
- Aksen: oranye `#f97316`, hanya di momen kunci: tombol simpan/kirim,
  badge butuh perhatian, nilai abnormal. Bukan warna default.
- Netral: kertas `#FAF9F6`, kartu putih, teks `#0f172a`, teks sekunder
  `#475569` (bukan abu pucat, demi kontras AA).
- Status lab: merah = abnormal, hijau = normal/terisi, biru = info.
  Selalu pasangkan dengan teks atau ikon, tidak pernah warna saja.

## Tipografi

Plus Jakarta Sans. Alasan: huruf Indonesia jelas di segala ukuran,
tegas untuk angka lab. Judul halaman tebal uppercase, label form kecil
tapi kontras cukup (minimal 11px, `#475569` ke atas). Angka lab
tabular-nums agar kolom rata.

## Bentuk

Neo-brutalism yang didisiplinkan: border 2px, radius 12/16, shadow
keras hanya untuk elevasi (tombol utama, dialog, kartu terangkat).
Elemen datar duduk di permukaan, tidak melayang. Satu radius murah
di semua elemen adalah default, dilarang.

## Motif

Tabung reaksi dan pipet hanya dipakai fungsional (animasi loading,
empty state), bukan hiasan mengambang. Tidak ada ilustrasi generik.

## Gerak (MOTION 1)

Hover/active saja. Hormati `prefers-reduced-motion`. Tanpa loop
tanpa henti, tanpa animasi logo berulang.

## Teks

Bahasa Indonesia langsung. Tanpa buzzword, tanpa klaim tanpa bukti,
tanpa emoji di UI, tanpa em dash. Angka hanya dari data nyata.

## Kondisi (C-4)

Setiap layar data punya tiga kondisi: loading (dengan teks apa yang
dimuat), kosong (sebab + satu aksi), error (apa gagal + cara lanjut).
