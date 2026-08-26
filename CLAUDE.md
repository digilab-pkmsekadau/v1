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

Required env (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VISION_API_KEY` (OCR foto hasil lab, provider Ollama Cloud `https://ollama.com/v1`, model `gemma4:31b`). `lib/validate-env.ts` runs at module load in `middleware.ts` and `app/layout.tsx` and **throws on the server** if the two `NEXT_PUBLIC_*` vars are missing, so a misconfigured deploy fails fast at startup. A missing `VISION_API_KEY` only disables OCR (503), it does not block startup.

## Architecture

### Two Supabase clients — know which one you're in
- `lib/supabase-service.ts` → `createServerClient()` uses the **service-role key and bypasses Row Level Security**. It is used by every API route under `app/api/**` for DB access, and by `lib/require-auth.ts` to read `user_roles` (role lookup must not depend on RLS policy, or a real admin locks himself out).
- `lib/supabase.ts` → `createSupabaseBrowserClient()` (anon key) is for client components (login).
- `lib/supabase-server.ts` → cookie-based SSR client used to read the authenticated user inside route handlers / server components (`getAuthedUser()` in `lib/require-auth.ts`, root redirect in `app/page.tsx`).

### Authorization: middleware + per-route guards (defense-in-depth)
Because RLS is bypassed, the database enforces nothing. Two layers do:

1. `middleware.ts` — every request except `PUBLIC_PATHS` (`/login`, `/api/auth/logout`) and root-level static assets (`PUBLIC_FILE` regex) must have a row in `user_roles` with role `admin` or `petugas`. **Having a Supabase account is not access** — signup is not the provisioning step. `ADMIN_ONLY_PATHS` (`/settings`, `/api/examinations/yearly`, `/api/backup`, `/api/audit`) additionally require `admin`.
2. `lib/require-auth.ts` — every route handler under `app/api/**` calls `requireAuth()` (401 if not logged in, 403 if no role) or `requireAdmin()` (403 if not admin). Never rely on middleware alone; it has been bypassable before.

Path matching uses `matchesPath()` (exact or `prefix + '/'`), never bare `startsWith` — `startsWith('/api/auth')` also matches `/api/authorize`. The `config.matcher` excludes by **path prefix** (`_next/`, `favicon.ico`), never by file extension: a pattern like `.*\.png$` also matches `/api/patients/<id>.png` and skips the whole gate.

- Requests to `/api/*` get JSON `401`/`403`; page requests get redirects (`/login?error=no_access` or `/dashboard`). Preserve this split when adding guards.
- Provisioning a new petugas: invite the user in Supabase Dashboard, then insert their row in `user_roles`. Public signup must stay disabled.

### Audit log
`lib/audit.ts` → `writeAudit(userEmail, entry)`. `user_email` is **always** taken from the server session (`getAuthedUser()`), never from the request body — `AuditEntry` has no such field. Mutating routes (`POST /api/examinations`, `PUT`/`DELETE /api/examinations/[id]`) write their own audit row; do not rely on the client calling `/api/audit`. `DELETE` reads `no_urut` before deleting, otherwise the trail is an unresolvable UUID. A failed audit insert is logged, never fatal.

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
