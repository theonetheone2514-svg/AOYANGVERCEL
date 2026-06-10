# AGENTS.md

## Project

Next.js 16 food delivery app ("เอาหยังบ่") for a local Thai community. Supabase backend, Vercel deployment, Tailwind CSS v4, React 19. PWA with service worker and LINE integration.

## Quick Commands

```bash
pnpm dev           # dev server (turbopack)
pnpm lint          # eslint (flat config)
pnpm test          # vitest run
npx tsc --noEmit   # typecheck (not in package.json scripts)
pnpm build         # production build (runs prebuild: PWA icon generation)
```

CI order: typecheck → lint → test → build.

## Path Aliases

`@/*` → `src/*` (tsconfig paths).

## Env Vars

Required at runtime (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `LINE_USER_ID`, `LIFF_ID`, `LIFF_URL`
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `ADMIN_PHONES`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`

Tests mock Supabase keys automatically via `vitest.config.ts`.

## Structure

```
src/
  app/          # Next.js App Router pages + API routes
    api/        # REST API (admin, auth, cron, menu, orders, riders, etc.)
    admin/      # Admin panel
    merchant/   # Merchant portal
    rider/      # Rider portal
    dashboard/  # Admin/merchant dashboard
    orders/     # Customer order views
  components/   # Shared React components
  hooks/        # Custom hooks
  lib/          # Utilities, Supabase clients, types, validations
  middleware.ts # Auth + CSP nonce + role-based access
supabase/
  migrations/   # SQL migrations (numbered 00001–00015)
  seed_data.sql
scripts/        # PWA icon generation, LINE rich menu setup, DB backup
```

## Key Facts

- **Supabase clients**: `src/lib/supabase.ts` (anon, lazy singleton) vs `src/lib/supabase-admin.ts` (service role). Use admin client for server-side privileged ops.
- **Auth**: Cookie-based sessions (`session_token`), validated in middleware via Supabase REST. Role types: `admin`, `merchant`, `rider`, `customer`.
- **Roles**: Route protection in middleware (`/admin` → admin, `/merchant` → merchant, `/rider` → rider, `/dashboard` → admin+merchant).
- **API utils**: `src/lib/api-utils.ts` for shared API helpers.
- **Validation**: Zod v4 (`src/lib/validations.ts`).
- **Order statuses**: Thai strings (`รอดำเนินการ`, `กำลังเตรียมอาหาร`, etc.) — not English.
- **Tests**: Only `src/**/*.test.ts` (vitest, node env). Currently 4 test files in `src/lib/`.
- **CSS**: Tailwind v4 via `@tailwindcss/postcss` plugin (not v3 config style).
- **Sentry**: Wraps next.config via `withSentryConfig`.
- **PWA**: Service worker at `/sw.js`, icon generation in `scripts/generate-pwa-icons.mjs` runs as prebuild.
- **Cron**: Vercel cron hits `/api/cron/rate-limit-cleanup` daily (see `vercel.json`).
- **DB migrations**: Manual SQL files in `supabase/migrations/`, not Drizzle/Prisma.
- **ESLint**: Flat config, relaxes `no-explicit-any`, `no-img-element`, and several React hooks rules.
