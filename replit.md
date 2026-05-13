# BuildBase

A structured fitness coaching platform for coaches and athletes. Supports multiple user roles (user, coach, admin) with session tracking, progress charts, milestones, coach notes, and admin program management.

## Run & Operate

- `pnpm run dev` — run the Next.js dev server (port 3000)
- `pnpm run build` — production build
- `pnpm run start` — start production server
- `pnpm run test` — run vitest unit tests
- `pnpm tsc --noEmit` — full typecheck

## Stack

- Node.js 24, TypeScript 5, pnpm (single-package, not a monorepo)
- Framework: **Next.js 16** App Router (not Vite SPA)
- Frontend: React 19, TailwindCSS v4 (CSS-first, `@theme` in globals.css), shadcn v4, framer-motion, recharts
- Auth/DB: Supabase — `@supabase/ssr` (server + client), `@supabase/supabase-js`
- Routing: Next.js App Router (`app/` directory)
- Testing: vitest + @testing-library/react

## Where things live

- `app/` — Next.js App Router pages and API routes
  - `app/(app)/` — authenticated user pages (dashboard, sessions, progress, etc.)
  - `app/(admin)/` — admin pages
  - `app/(coach)/` — coach pages
  - `app/(auth)/` — login, signup, forgot/reset password
  - `app/api/` — Next.js API routes (Edge/Node)
- `components/` — shared React components (shadcn UI, custom)
  - `components/ui/` — shadcn/radix primitive wrappers
  - `components/QuickLogModal.tsx` — quick workout logger (client component)
  - `components/LogWorkoutButton.tsx` — client wrapper for dashboard
- `lib/` — shared utilities and Supabase clients
  - `lib/supabase/client.ts` — browser Supabase client
  - `lib/supabase/server.ts` — server Supabase client (uses cookies)
  - `lib/quick-log-presets.ts` — muscle group + exercise preset data
  - `lib/rbac.ts` — role-based access control helpers
- `tests/` — vitest unit/integration tests
- `supabase/` — Supabase migrations and schema
- `.migration-backup/` — archived original Next.js codebase (do not delete)

## Architecture decisions

- Next.js 16 App Router (SSR + API routes in one project)
- `@supabase/ssr` for proper cookie-based auth in Server Components and API routes
- Server Components fetch data directly; client components use `fetch` to API routes
- Dashboard is a Server Component — interactive elements (QuickLogModal, LogWorkoutButton) are wrapped in `"use client"` components
- All API routes use `createClient()` from `lib/supabase/server` for auth

## Product

- **Auth**: Login, signup, forgot/reset password via Supabase auth
- **Onboarding**: Role-based setup flow for new users
- **Dashboard**: Overview with "Log Workout" quick-log button
- **Sessions**: Log and track training sessions
- **Progress**: Charts, milestones, trends over time
- **Coach Notes**: Coach-to-athlete notes and feedback
- **Clients**: Coach view of all clients and individual client detail
- **Playbook**: Saved programs and exercise templates
- **Admin**: User management and program administration

## User preferences

- Color theme: bg `#EDE4D3`, accent `#C84B1A`, brand `#1C3A2A`, content-primary `#2C1A10`
- Fonts: Inter (body) + Space Grotesk (display, `var(--font-display)`)
- Always ask before making major stack or architecture changes

## Secrets required

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (e.g. `https://xxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-only routes)

## Gotchas

- `allowedDevOrigins` in `next.config.ts` must include `*.replit.dev` for the preview iframe to work
- Dynamic route param names must be consistent within a path segment — e.g. all routes under `app/api/admin/programs/[programId]/` must use `programId`, not `id`
- Secrets are stored as plain values in Replit Secrets (not `KEY=value` format)
- After adding/changing secrets, restart the `Start application` workflow
