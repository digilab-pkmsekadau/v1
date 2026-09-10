# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Badge Memakai Styling Tema Terdefinisi
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope property to concrete failing case: badge element di `app/(app)/riwayat/page.tsx:310`
  - Test badge memakai class `.section-badge` (tak terdefinisi) dan inline style hardcoded `background: rgba(100,116,139,0.06)`, `color: #475569`
  - Test computed style badge identik di light dan dark mode (tidak beradaptasi tema)
  - Run test on UNFIXED code - expect FAILURE (confirms bug exists)
  - Document counterexamples found (e.g., "badge memakai class tak terdefinisi + inline style non-token")
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Konten dan Layout Section Header Tidak Berubah
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: icon `Activity` (size 13) + teks "Riwayat Pemeriksaan" selalu dirender di dalam badge
  - Observe: counter `{history.length} data` muncul hanya saat `!loading && history.length > 0`, dengan class `text-[11px] font-bold text-slate-400 dark:text-slate-500`
  - Observe: layout section header `mb-3 flex items-center gap-2` berisi badge + counter, diikuti `div.brutal-card` berisi `HistoryTable`
  - Write property-based test: untuk semua kombinasi `{loading, history.length}` — counter visibility dan styling identik; konten badge invariant
  - Verify tests PASS on UNFIXED code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix untuk badge section header theme

  - [ ] 3.1 Implement the fix
    - Ganti `<div className="section-badge" style={{ background: 'rgba(100,116,139,0.06)', color: '#475569' }}>` menjadi `<div className="brutal-badge">` di `app/(app)/riwayat/page.tsx:310`
    - Tidak ada perubahan lain: tidak ada CSS baru, tidak ada import baru, tidak ada perubahan pada counter/layout/komponen lain
    - _Bug_Condition: isBugCondition(element) where element.className CONTAINS 'section-badge' OR element.style CONTAINS hardcodedColor_
    - _Expected_Behavior: badge memakai `.brutal-badge`, tanpa inline style warna, computed style dari token tema (`--bg-card`, `--border-color`, `--text-main`)_
    - _Preservation: icon Activity, teks, counter visibility rule, counter class, layout flex, HistoryTable tidak berubah_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Badge Memakai Styling Tema Terdefinisi
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Konten dan Layout Section Header Tidak Berubah
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
