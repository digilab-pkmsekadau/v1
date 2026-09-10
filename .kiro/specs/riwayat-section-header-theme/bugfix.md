# Bugfix Requirements Document

## Introduction

Section header "Riwayat Pemeriksaan" (badge + counter "N data") di halaman `app/(app)/riwayat/page.tsx` memakai class `.section-badge` yang tidak terdefinisi di CSS manapun, plus inline style hardcoded (`background: rgba(100,116,139,0.06)`, `color: #475569`) tanpa varian dark mode. Akibatnya badge tidak mengikuti design token tema neo-brutalism proyek (CSS variables `--bg-card`, `--border-color`, `--text-main`, utility `.brutal-badge`, pola Tailwind `dark:`) dan tampil salah/pecah di dark mode (teks gelap di atas background gelap).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN halaman `/riwayat` dirender THEN badge "Riwayat Pemeriksaan" menggunakan class `.section-badge` yang tidak memiliki definisi CSS di `globals.css` maupun file CSS lain, sehingga styling badge bergantung sepenuhnya pada inline style hardcoded

1.2 WHEN badge "Riwayat Pemeriksaan" dirender THEN sistem menerapkan inline style hardcoded `background: rgba(100,116,139,0.06)` dan `color: #475569` yang bukan bagian dari design token tema proyek

1.3 WHEN aplikasi dalam dark mode THEN badge tetap memakai warna hardcoded light-mode (`#475569` teks gelap, background slate transparan) sehingga kontras rendah/tidak terbaca di background gelap `--bg-body: #09090b`

1.4 WHEN tema berubah (light ↔ dark) THEN badge tidak beradaptasi karena tidak memakai CSS variable tema (`--bg-card`, `--text-main`, `--border-color`) maupun class Tailwind `dark:` seperti komponen lain di halaman yang sama (misal counter "N data" yang sudah memakai `text-slate-400 dark:text-slate-500`)

### Expected Behavior (Correct)

2.1 WHEN halaman `/riwayat` dirender THEN badge "Riwayat Pemeriksaan" SHALL memakai styling yang terdefinisi dalam sistem tema proyek (utility class tema seperti `.brutal-badge` atau class Tailwind standar), bukan class `.section-badge` yang tidak terdefinisi

2.2 WHEN badge "Riwayat Pemeriksaan" dirender THEN sistem SHALL memakai design token tema (CSS variables `--bg-card`/`--border-color`/`--text-main` atau ekuivalen Tailwind `dark:` variants) tanpa inline style warna hardcoded

2.3 WHEN aplikasi dalam dark mode THEN badge SHALL menampilkan warna background dan teks yang sesuai token dark theme (kontras memadai terhadap `--bg-body: #09090b`)

2.4 WHEN tema berubah (light ↔ dark) THEN badge SHALL beradaptasi otomatis mengikuti token tema, konsisten dengan elemen lain di halaman yang sama

### Unchanged Behavior (Regression Prevention)

3.1 WHEN halaman `/riwayat` dirender THEN sistem SHALL CONTINUE TO menampilkan icon `Activity` (size 13) dan teks "Riwayat Pemeriksaan" di dalam badge

3.2 WHEN data riwayat sudah dimuat dan tidak kosong THEN sistem SHALL CONTINUE TO menampilkan counter "{history.length} data" di samping badge dengan styling yang sudah benar (`text-slate-400 dark:text-slate-500`)

3.3 WHEN data riwayat loading atau kosong THEN sistem SHALL CONTINUE TO menyembunyikan counter "N data"

3.4 WHEN halaman `/riwayat` dirender THEN sistem SHALL CONTINUE TO menampilkan layout section header (badge + counter dalam flex row dengan gap) dan `HistoryTable` di bawahnya tanpa perubahan struktur

3.5 WHEN komponen lain di luar section header ini dirender THEN sistem SHALL CONTINUE TO mempertahankan styling mereka (perubahan hanya pada badge section header, bukan elemen lain di halaman)
