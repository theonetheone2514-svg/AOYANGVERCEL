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
- **Sentry**: Wraps next.config via `withSentryConfig`. Error boundaries (`error.tsx`) call `Sentry.captureException()` — all 4 (root/admin/merchant/rider).
- **PWA**: Service worker at `/sw.js`, icon generation in `scripts/generate-pwa-icons.mjs` runs as prebuild.
- **Cron**: Vercel cron hits `/api/cron/rate-limit-cleanup` daily (see `vercel.json`). Requires `CRON_SECRET` — returns 500 if missing.
- **DB migrations**: Manual SQL files in `supabase/migrations/`, not Drizzle/Prisma.
- **ESLint**: Flat config, relaxes `no-explicit-any`, `no-img-element`, and several React hooks rules.

## Security Architecture

- **Middleware**: Fail-closed — redirects to login if Supabase env vars missing. CSP nonce on every response. Role-based route protection.
- **CSRF**: Double-submit cookie pattern with `timingSafeEqual` in `src/lib/csrf.ts`. All mutation routes use `withAuth` wrapper which enforces origin + CSRF validation.
- **Rate limiting**: DB-backed via Supabase RPC `rate_limit_check()`. Applied to: auth endpoints, order creation, uploads, rider actions, LINE webhook.
- **OTP**: SHA-256 hashed (`sha256(phone:otp)`), 5-min TTL, single-use. Used for registration and LINE linking.
- **Stores API**: `select('id, name, image_url, status, wait_time, active, created_at')` — never `select('*')` to avoid leaking `phone` and `line_user_id`.
- **Ratings**: POST verifies `order.customer_id === session.user_id` before inserting.
- **Orders**: GET + PATCH enforce ownership checks per role (customer owns order, merchant owns store, rider assigned to order).

## UI Conventions

- **Toast notifications**: Use `showToast(message, type)` from `src/components/Toast.tsx` — never `alert()` or `prompt()`. Types: `'success' | 'error' | 'info'`. Auto-dismiss after 3s.
- **Order toasts**: Use `showOrderToast({ id, title, message, total })` for new order notifications (auto-dismiss 5s).
- **Toast container**: Mounted in `ClientLayout.tsx` — do not add a second instance.
- **BottomNav**: Filters links by user role via `useAuth()`. Customer sees only home; merchant sees home + merchant + dashboard; rider sees home + rider; admin sees home + dashboard.

## Data Patterns

- **Delivery fee**: Stored in `settings` table (`key: 'delivery_fee'`), fetched at page load. Never hardcode.
- **Realtime**: Merchant + Rider portals use Supabase Realtime for live order updates. Customer orders page (`/orders`) also has Realtime subscription on `customer_id`.
- **Session → user_id mapping**: For merchants, `session.user_id` = store ID (e.g. "S01"). For riders, `session.user_id` = rider UUID. For customers, `session.user_id` = customer UUID. Do NOT query stores/riders table to resolve — use `session.user_id` directly.
