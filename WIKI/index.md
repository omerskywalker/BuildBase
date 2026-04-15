# BuildBase — Project Wiki

> Read this before starting any task. Check WIKI/gotchas.md for known failures.

## Status (as of scaffold)

- **Scaffolding:** Complete — all routes, types, Supabase clients, SQL migration, roadmap, CI workflow
- **Batch 1:** Not started — auth, RBAC, profiles, seed
- **Batches 2–8:** Not started

## Architecture Overview

### File Map

```
app/
  (auth)/login, signup    → Public auth pages (Batch 1)
  auth/callback           → Supabase OAuth callback
  (app)/                  → Protected user routes (Batches 2–6)
    dashboard/
    sessions/
    progress/
    coach-notes/
  (coach)/                → Coach-only routes (Batch 4)
    clients/
    clients/[id]/
    playbook/
  (admin)/                → Admin-only routes (Batches 5, 7)
    users/
    programs/
  monitor/                → Dev monitor (Batch 8 — scaffold done)
    login/
    roadmap/
  api/
    auth/callback/        → Supabase auth exchange
    monitor/login/        → PIN check, sets cookie
    monitor/kickoff/      → Triggers GitHub workflow_dispatch

lib/
  supabase/client.ts      → Browser client (Client Components)
  supabase/server.ts      → Server client (Server Components)
  types.ts                → All shared types
  utils.ts                → cn(), getFormBadge(), getDefaultWeight(), formatWeight(), hoursSince()
  constants.ts            → Effort/soreness labels, SESSIONS_PER_PAGE, SORENESS_PROMPT_GAP_HOURS
  roadmap-data.ts         → Roadmap items — update status/pr as batches complete

components/
  layout/Sidebar.tsx      → Role-aware nav (stub — implement Batch 1)
  layout/Header.tsx       → Mobile header (stub — implement Batch 1)
  ui/                     → shadcn components (add with: npx shadcn@latest add <component>)

proxy.ts                  → Next.js 16 auth guard + monitor PIN gate + Supabase session refresh
supabase/migrations/      → SQL schema (run once in Supabase SQL Editor)
tests/                    → Vitest tests
.github/workflows/        → claude-feature.yml (workflow_dispatch for roadmap kickoff)
```

### Data flow

```
Browser → proxy.ts (auth check + session refresh)
       → App Router (Server Components fetch via lib/supabase/server.ts)
       → Route Handlers (lib/supabase/server.ts with service role for admin ops)

Monitor → /monitor/login (PIN → cookie)
        → /monitor/roadmap (server component, fetches GitHub PR status live)
        → KickoffButton → /api/monitor/kickoff → GitHub workflow_dispatch → claude-feature.yml
```

## Design Tokens

See `app/globals.css` for full `@theme` block. Key colors:

| Token | Value | Use |
|-------|-------|-----|
| `bg-base` | `#0F1A14` | Body background |
| `bg-surface` | `#152019` | Sidebar, headers |
| `bg-elevated` | `#1C2A20` | Cards, panels |
| `accent` | `#C84B1A` | CTAs, burnt orange |
| `brand` | `#1C3A2A` | Forest green |
| `content-primary` | `#E8F0E8` | Headings, values |
| `content-secondary` | `#8A9E8A` | Labels |
| `content-muted` | `#4A5A4A` | Timestamps |

## Supabase Setup (required before Batch 1 works)

1. Create project at supabase.com
2. Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
3. Copy URL + anon key + service role key → `.env.local`
4. Enable email auth in Supabase Auth settings

## Vercel Setup

1. Create project at vercel.com, connect to `omerskywalker/BuildBase`
2. Add all env vars from `.env.example` in Vercel dashboard
3. Vercel auto-deploys `main` on push. Preview deploys on all branches.

## Monitor/Roadmap Setup

1. GitHub PAT: `github.com/settings/tokens` → `repo` + `workflow` scopes → set as `GITHUB_TOKEN` in Vercel
2. `ANTHROPIC_API_KEY` → GitHub repo Actions secrets
3. `ROADMAP_PIN` → Vercel env vars
4. `NEXT_PUBLIC_GITHUB_REPO` = `omerskywalker/BuildBase` → Vercel env vars
