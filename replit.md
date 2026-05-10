# BuildBase

A structured fitness coaching platform for coaches and athletes. Supports multiple user roles (user, coach, admin) with session tracking, progress charts, milestones, coach notes, and admin program management.

## Run & Operate

- `pnpm --filter @workspace/buildbase run dev` — run the React SPA (Vite, port from $PORT)
- `pnpm --filter @workspace/api-server run dev` — run the API server (Express, port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Vite + React SPA, wouter (routing), TailwindCSS, shadcn/radix UI, framer-motion, recharts
- Auth/DB: Supabase (`@supabase/supabase-js` browser client)
- API: Express 5 (port 8080)
- Build: esbuild (API server CJS bundle)

## Where things live

- `artifacts/buildbase/` — React SPA (all pages, components, auth)
  - `src/lib/supabase.ts` — Supabase client singleton
  - `src/lib/auth-context.tsx` — AuthProvider + useAuth hook
  - `src/lib/types.ts` — shared TypeScript types
  - `src/App.tsx` — wouter router, all routes, ProtectedRoute
  - `src/index.css` — BuildBase theme tokens (HSL)
  - `src/pages/` — all page components (auth, dashboard, sessions, progress, coach, admin)
  - `src/components/layout/` — AppLayout, Header, Sidebar
- `artifacts/api-server/` — Express API server

## Architecture decisions

- Vite SPA (not Next.js/SSR) — migrated from Next.js; all data fetching via useEffect + fetch
- wouter for routing (not react-router-dom) — lightweight, SPA-compatible
- `@supabase/supabase-js` browser client (not @supabase/ssr) — client-side auth only
- Supabase singleton pattern in `supabase.ts` to avoid multiple GoTrueClient instances
- API calls use relative `/api/...` paths — proxied to Express on port 8080

## Product

- **Auth**: Login, signup, forgot/reset password via Supabase auth
- **Onboarding**: Role-based setup flow for new users
- **Dashboard**: Overview of sessions, progress, upcoming workouts
- **Sessions**: Log and track training sessions with detailed cards
- **Progress**: Charts, milestones, trends over time
- **Coach Notes**: Coach-to-athlete notes and feedback
- **Clients**: Coach view of all clients and individual client detail
- **Playbook**: Saved programs and exercise templates
- **Admin**: User management and program administration

## User preferences

- Color theme: bg `#EDE4D3`, accent `#C84B1A`, brand `#1C3A2A`, content-primary `#2C1A10`
- Fonts: Inter (body) + Space Grotesk (display, `var(--font-display)`)

## Gotchas

- Secrets must be stored as plain values only (no `KEY=value` format) in the Replit Secrets panel
- Required secrets: `VITE_SUPABASE_URL` (e.g. `https://xxxx.supabase.co`) and `VITE_SUPABASE_ANON_KEY`
- After adding/changing secrets, restart the `artifacts/buildbase: web` workflow for Vite to pick them up

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
