# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

DigiLab is an internal lab-results recording and reporting app for Puskesmas Sekadau (an Indonesian community health center). The UI, comments, and most identifiers are in Indonesian — match that language when editing user-facing strings and comments. Stack: Next.js 15 (App Router), React 18, TypeScript, Tailwind v4, Supabase (Postgres + Auth).

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build (also the de-facto typecheck; there is no separate test suite)
npm run lint       # eslint (flat config in eslint.config.js)
npm run lint:fix   # eslint --fix
npx tsc --noEmit   # standalone typecheck
```

There is **no test framework** — no unit/integration/e2e tests exist. Do not claim tests pass; verify changes with `npx tsc --noEmit` and `npm run build`.

Required env (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. `lib/validate-env.ts` runs at module load in `middleware.ts` and `app/layout.tsx` and **throws on the server** if the two `NEXT_PUBLIC_*` vars are missing, so a misconfigured deploy fails fast at startup.

## Architecture

### Two Supabase clients — know which one you're in
- `lib/supabase.ts` → `createServerClient()` uses the **service-role key and bypasses Row Level Security**. It is used by every API route under `app/api/**` for DB access. Because RLS is bypassed, **authorization is enforced entirely in `middleware.ts`, not by the database.** Any new API route that mutates data is protected only by whatever middleware rule covers its path.
- `lib/supabase.ts` → `createSupabaseBrowserClient()` (anon key) is for client components (login).
- `lib/supabase-server.ts` → cookie-based SSR client used to read the authenticated user inside route handlers / server components (e.g. admin check in `app/api/config/route.ts`, root redirect in `app/page.tsx`).

### Auth & authorization live in `middleware.ts`
- All routes are auth-gated except `PUBLIC_PATHS` (`/login`, `/api/auth`).
- `ADMIN_ONLY_PATHS` (`/settings`, `/api/examinations/yearly`, `/api/backup`, `/api/audit`) require an `admin` row in the `user_roles` table (default-deny: role query error or non-admin → blocked).
- Requests to `/api/*` get JSON `401`/`403`; page requests get redirects (`/login` or `/dashboard`). Preserve this split when adding guards.
- There is leftover PIN-based auth (`lib/auth.ts`, `app/api/auth/verify-pin`) alongside Supabase Auth; Supabase Auth is the real path. Logout clears both.

### Data model: one wide `examinations` table
Each lab parameter is its own text column on `examinations` (values stored as strings, often with a unit suffix like `"90 mg/dl"`). Patient identity lives in `patients`; `config` is a key/value table (`LIST_DOKTER`, `LIST_PETUGAS`, `logo_url`, `doctor_signature`, `tech_signature`, `print_template`).

### Adding or changing a lab parameter touches MANY files (critical)
A single new parameter must be wired through all of these or it silently breaks end-to-end (this is a real, recurring bug source):
1. `supabase_migration.sql` — add the DB column.
2. `types/index.ts` — add to the `Examination` interface.
3. `lib/param-options.ts` — `PARAM_OPTIONS` (form field) + `ALL_PARAMS`.
4. `lib/normal-ranges.ts` — `NORMAL_RANGES` (abnormal detection) if numeric/categorical.
5. `app/api/examinations/route.ts` — `PARAM_MAP` (**write path**; missing entry = value dropped on save).
6. `app/api/export/route.ts` — `PARAM_COLUMN` (Excel export; label→column, missing = 400).
7. `app/api/dashboard/route.ts` — `select(...)` column list + the `chemistry`/`immunology`/`microbiology` stats objects and their counters.

The label strings in the dashboard stats objects, `PARAM_COLUMN` keys, and the export download buttons must match exactly — they are the join key between UI and API.

### Other conventions
- API routes return `NextResponse.json`; success is often `{ success: true }` or a data payload, errors `{ error }` with a status. Most set `export const dynamic = 'force-dynamic'`.
- Excel export builds rows server-side (`app/api/export/**`) and the client turns them into `.xlsx` via `lib/export.ts` (xlsx lib).
- Forms use react-hook-form + zod (`app/(app)/input/page.tsx`); toasts via `sonner`; confirm dialogs via the `useConfirm` context (`components/ui/ConfirmDialog.tsx`).
- Supabase queries default to a 1000-row cap; paginate with `.range()` for full-table aggregates (see `getMonthlyStats` in `app/api/dashboard/route.ts`).
- Dates: WIB helpers in `lib/utils.ts` (`getTodayWIB`, `getStartOfMonth`, `formatDateDisplay`).
- shadcn/radix primitives live in `components/ui/`; feature components in `components/{dashboard,input,layout}/`.

## Known gaps (not yet addressed)
No rate limiting on any endpoint. No tests. Mutating routes (`POST /api/examinations`, `patients` writes) require login but not admin — acceptable only because this is a trusted internal tool.
