# Riwayat Section Header Theme Bugfix Design

## Overview

Badge "Riwayat Pemeriksaan" di `app/(app)/riwayat/page.tsx` (baris 310-314) memakai class `.section-badge` yang tidak terdefinisi di CSS manapun, ditambah inline style hardcoded (`background: rgba(100,116,139,0.06)`, `color: #475569`) tanpa varian dark mode. Akibatnya badge pecah di dark mode (teks gelap di atas `--bg-body: #09090b`).

Perbaikan minimal: ganti class tak terdefinisi + inline style dengan utility tema yang sudah ada, `.brutal-badge` (didefinisikan di `app/globals.css:204-216`, memakai token `--bg-card`, `--border-color`, dan mewarisi `color: var(--text-main)` dari body). Satu baris JSX berubah; tidak ada CSS baru, tidak ada dependency baru, tidak ada perubahan struktur.

## Glossary

- **Bug_Condition (C)**: Kondisi ketika badge "Riwayat Pemeriksaan" dirender dengan class `.section-badge` (tak terdefinisi) dan/atau inline style warna hardcoded, sehingga tidak mengikuti token tema
- **Property (P)**: Perilaku yang diinginkan — badge memakai styling tema terdefinisi (`.brutal-badge` / token `--bg-card`/`--border-color`/`--text-main`) dan beradaptasi otomatis light ↔ dark
- **Preservation**: Icon `Activity` (size 13), teks "Riwayat Pemeriksaan", counter "N data" (`text-slate-400 dark:text-slate-500`), layout flex section header, dan `HistoryTable` harus tidak berubah
- **`.brutal-badge`**: Utility class di `app/globals.css:204-216` — inline-flex badge pill dengan `background: var(--bg-card)`, `border: 2px solid var(--border-color)`, `box-shadow: var(--shadow-sm)`; warna teks diwarisi dari `body { color: var(--text-main) }` sehingga otomatis hitam di light (`#000000`) dan terang di dark (`#fafafa`)
- **`.section-badge`**: Class yang dipakai di JSX tetapi TIDAK memiliki definisi CSS di manapun dalam proyek (terverifikasi via pencarian — hanya muncul di `page.tsx:310`)
- **`html.dark`**: Selector tema gelap di `globals.css:52` yang meng-override CSS variables (`--bg-card: #18181b`, `--text-main: #fafafa`, `--border-color: #fafafa`)

## Bug Details

### Bug Condition

Bug muncul setiap kali halaman `/riwayat` dirender: elemen badge memakai `className="section-badge"` (tanpa definisi CSS) plus atribut `style` inline hardcoded. Karena `.section-badge` tidak ada, satu-satunya styling yang berlaku adalah inline style — warna slate light-mode yang tidak beradaptasi ke dark mode.

**Formal Specification:**
```
FUNCTION isBugCondition(element)
  INPUT: element of type JSX.Element (badge section header)
  OUTPUT: boolean

  RETURN element.className CONTAINS 'section-badge'
         OR element.style CONTAINS hardcodedColor   // rgba(100,116,139,0.06) / #475569
         AND NOT usesThemeToken(element)            // tidak memakai .brutal-badge / CSS var / dark:
END FUNCTION
```

### Examples

- **Light mode**: badge tampil dengan `background: rgba(100,116,139,0.06)`, teks `#475569` — tampak "OK" secara kasat mata tapi bukan token tema; Expected: token tema (`.brutal-badge`: kartu putih, border hitam 2px, shadow). Actual: warna hardcoded.
- **Dark mode**: badge tetap `color: #475569` (abu gelap) di atas `--bg-body: #09090b` — kontras buruk, hampir tak terbaca; Expected: teks `--text-main: #fafafa`, background `--bg-card: #18181b`, border `--border-color: #fafafa`. Actual: warna light-mode hardcoded.
- **Theme switch**: toggle light ↔ dark — badge statis; Expected: beradaptasi otomatis seperti counter "N data" di sebelahnya (`dark:text-slate-500`). Actual: tidak berubah.
- **Edge case — class tak terdefinisi**: `.section-badge` tidak punya definisi, jadi layout badge (inline-flex, gap, padding, pill radius) juga hilang — badge hanya `<div>` blok biasa dengan icon + teks; Expected: struktur badge pill dari `.brutal-badge`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Icon `Activity` dengan `size={13}` tetap dirender di dalam badge
- Teks "Riwayat Pemeriksaan" tetap ditampilkan
- Counter `{history.length} data` tetap muncul hanya saat `!loading && history.length > 0`, dengan styling `text-[11px] font-bold text-slate-400 dark:text-slate-500` yang sudah benar
- Layout section header: flex row `mb-3 flex items-center gap-2` berisi badge + counter, diikuti `div.brutal-card` berisi `HistoryTable`
- Semua elemen lain di halaman (kartu filter, tombol ekspor, toggle preview) tidak tersentuh

**Scope:**
Semua input/perilaku yang TIDAK melibatkan styling badge section header tidak terpengaruh. Ini meliputi:
- Data fetching, loading state, delete handler, export handler
- Styling dan perilaku `HistoryTable`
- Styling counter "N data"
- Halaman lain yang tidak memakai `.section-badge` (terverifikasi: class ini hanya dipakai di satu tempat)

## Hypothesized Root Cause

Berdasarkan analisis kode:

1. **Class `.section-badge` tidak pernah didefinisikan**: Pencarian di seluruh workspace menunjukkan `.section-badge` hanya muncul di `app/(app)/riwayat/page.tsx:310` — tidak ada di `globals.css` maupun file CSS lain. Kemungkinan sisa copy-paste dari template/desain eksternal (folder `design/`) atau refactor yang tidak selesai.

2. **Inline style hardcoded sebagai fallback**: Karena class tak terdefinisi, developer menambahkan inline style warna slate agar badge tetap terlihat — tapi warna ini bukan token tema dan tidak punya varian dark.

3. **Utility tema yang benar sudah ada tapi tidak dipakai**: `.brutal-badge` tersedia di `globals.css:204-216` dan sudah memakai token `--bg-card`/`--border-color` + inherited `--text-main`. Halaman lain memakai pola tema yang benar; hanya badge ini yang terlewat.

4. **Bukan masalah DOM/timing/logic**: Badge selalu dirender (bukan kondisional), jadi bug murni styling statis — fix satu baris.

## Correctness Properties

Property 1: Bug Condition - Badge Memakai Styling Tema Terdefinisi

_For any_ render halaman `/riwayat` di mana bug condition berlaku (isBugCondition returns true), badge "Riwayat Pemeriksaan" yang sudah diperbaiki SHALL memakai class tema terdefinisi (`.brutal-badge`), TIDAK memakai `.section-badge`, TIDAK memiliki inline style warna hardcoded, dan computed style-nya berasal dari token tema (`--bg-card`, `--border-color`, `--text-main`) sehingga beradaptasi benar di light maupun dark mode.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Konten dan Layout Section Header Tidak Berubah

_For any_ render halaman `/riwayat`, kode yang diperbaiki SHALL menghasilkan DOM section header yang sama dengan sebelumnya dalam hal konten dan struktur — icon `Activity` (size 13), teks "Riwayat Pemeriksaan", counter "N data" dengan aturan tampil/sembunyi dan styling yang sama, layout flex `mb-3 flex items-center gap-2`, dan `HistoryTable` di bawahnya — hanya styling badge yang berubah.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Berdasarkan root cause analysis:

**File**: `app/(app)/riwayat/page.tsx`

**Lokasi**: baris 310-314 (elemen badge section header)

**Specific Changes**:

1. **Ganti class + hapus inline style** (satu baris):
   - Sebelum: `<div className="section-badge" style={{ background: 'rgba(100,116,139,0.06)', color: '#475569' }}>`
   - Sesudah: `<div className="brutal-badge">`

Tidak ada perubahan lain: tidak ada CSS baru (`.brutal-badge` sudah ada dan bertema), tidak ada import baru, tidak ada perubahan pada counter, layout, atau komponen lain.

ponytail: `.brutal-badge` mewarisi warna teks dari `body { color: var(--text-main) }` — cukup untuk badge netral ini. Jika nanti butuh badge beraksen (misal kategori warna), tambahkan modifier class di globals.css, bukan inline style.

## Testing Strategy

### Validation Approach

Dua fase: pertama surface counterexample pada kode UNFIXED untuk mengonfirmasi root cause (styling statis, bukan logic), lalu verifikasi fix dan preservasi. Karena perubahan murni styling JSX satu baris, penekanan pada pemeriksaan render/statik dan computed style, bukan logic kompleks.

### Exploratory Bug Condition Checking

**Goal**: Demonstrasikan bug pada kode UNFIXED. Konfirmasi bahwa `.section-badge` tak terdefinisi dan inline style tidak beradaptasi tema. Jika terbantahkan (ternyata ada definisi CSS), re-hypothesize.

**Test Plan**: Render halaman/section header pada kode UNFIXED; assert class dan inline style badge; toggle class `dark` pada `html` dan bandingkan computed color badge dengan token tema.

**Test Cases**:
1. **Undefined Class Test**: Assert badge memakai `section-badge` yang tidak punya rule CSS cocok di stylesheet manapun (fail pada kode unfixed — class ada tapi tak terdefinisi)
2. **Hardcoded Inline Style Test**: Assert badge punya `style.background === 'rgba(100,116,139,0.06)'` dan `style.color === '#475569'` (fail pada kode unfixed — inline style ada)
3. **Dark Mode Contrast Test**: Set `html.dark`, render, assert computed `color` badge === `#475569` (gelap, kontras buruk vs `#09090b`) pada kode unfixed
4. **Theme Switch Test**: Toggle `dark` class, assert computed style badge tidak berubah pada kode unfixed

**Expected Counterexamples**:
- Badge menyandang class tanpa definisi + inline style hardcoded; computed style identik di light dan dark
- Penyebab: class tak terdefinisi, inline style non-token, tidak ada varian `dark:`

### Fix Checking

**Goal**: Untuk semua render di mana bug condition berlaku, fungsi yang diperbaiki menghasilkan badge bertema.

**Pseudocode:**
```
FOR ALL renderContext WHERE isBugCondition(badge_before) DO
  badge := renderFixed(badge_before)
  ASSERT badge.className = 'brutal-badge'
  ASSERT badge.hasNoInlineColorStyle
  ASSERT NOT badge.className CONTAINS 'section-badge'
  IN dark mode: ASSERT computedColor(badge) = token('--text-main')  // #fafafa
  IN light mode: ASSERT computedColor(badge) = token('--text-main') // #000000
END FOR
```

### Preservation Checking

**Goal**: Untuk semua aspek di luar styling badge, hasil identik dengan kode original.

**Pseudocode:**
```
FOR ALL renderContext DO
  ASSERT content(sectionHeader_original) = content(sectionHeader_fixed)
  // icon Activity, teks, counter visibility rule, counter class, layout flex, HistoryTable
END FOR
```

**Testing Approach**: Property-based testing untuk preservasi konten karena:
- Counter visibility bergantung kombinasi `loading` × `history.length` — PBT menggenerate semua kombinasi otomatis
- Menangkap edge case (history kosong, loading, N besar) yang mudah terlewat manual

**Test Plan**: Amati perilaku kode UNFIXED untuk konten badge, aturan counter, dan layout; tulis property test yang menangkap perilaku itu; jalankan pada kode FIXED.

**Test Cases**:
1. **Badge Content Preservation**: Verifikasi icon `Activity` + teks "Riwayat Pemeriksaan" tetap ada setelah fix
2. **Counter Visibility Preservation**: Untuk semua kombinasi `{loading, history.length}` — counter muncul iff `!loading && history.length > 0`, dengan class `text-slate-400 dark:text-slate-500` tak berubah
3. **Layout Preservation**: Section header tetap `mb-3 flex items-center gap-2` berisi badge + counter, diikuti `.brutal-card` berisi `HistoryTable`

### Unit Tests

- Render section header: assert badge memakai `brutal-badge`, tanpa atribut `style`
- Render dengan `html.dark`: assert tidak ada warna hardcoded; computed style berasal dari token
- Edge case: history kosong → counter tersembunyi; loading → counter tersembunyi

### Property-Based Tests

- Generate random `history` array (0..N item) × `loading` boolean → assert aturan visibility counter identik sebelum/sesudah fix
- Generate random theme state (light/dark) → assert computed color/background badge selalu sama dengan nilai token tema saat itu
- Assert konten teks/icon badge invariant di semua skenario

### Integration Tests

- Render halaman `/riwayat` penuh (mock data): badge tampil benar di light dan dark
- Toggle tema saat halaman terbuka: badge beradaptasi tanpa re-render manual
- Visual check: badge konsisten dengan elemen neo-brutalism lain (border 2px, shadow, pill)
