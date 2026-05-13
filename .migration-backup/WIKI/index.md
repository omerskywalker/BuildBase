---
type: project-index
tags: [buildbase, index]
last-updated: 2026-04-16
---

# BuildBase — Project Wiki

> **Agents: read this file first.** 60 seconds of reading = no wasted tool calls.
> Then read `WIKI/gotchas.md` before touching anything.

---

## What This App Does

BuildBase is a structured fitness coaching SaaS with RBAC (admin / coach / user). Coaches program 12-week strength plans, track client form, and send notes. Users log sets, view progress, and get automatically guided to their next session. The product is pre-scaffold but not yet feature-complete — agents are building it batch by batch via the `/monitor/roadmap` kickoff system.

## Data Flow

```
Browser ──► proxy.ts (auth guard + PIN gate + Supabase session refresh)
         ──► App Router server components (lib/supabase/server.ts)
         ──► Supabase PostgreSQL (RLS enforced)

Monitor ──► /monitor/roadmap (server component, reads GitHub PR status + Upstash KV)
         ──► KickoffButton → POST /api/monitor/kickoff
         ──► GitHub workflow_dispatch → claude-feature.yml
         ──► Claude Code agent (reads GitHub Issue for spec, writes code, commits, pushes)
         ──► PR marked ready → human reviews + merges
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 — App Router, `proxy.ts` (not `middleware.ts`) |
| UI | React 19, Tailwind v4 (CSS-first), shadcn/ui v4 (base-nova style) |
| Auth + DB | Supabase (PostgreSQL + RLS + SSR auth via `@supabase/ssr`) |
| KV store | Upstash Redis (`@upstash/redis`) — roadmap status overrides only |
| Charts | Recharts |
| Animation | Framer Motion |
| DnD | dnd-kit (Batch 7) |
| Toast | Sonner |
| Server state | TanStack React Query |
| Client state | Zustand |
| Tests | Vitest + jsdom |
| CI | GitHub Actions — `claude-feature.yml` (agent) + `ci.yml` (lint/test) |
| Hosting | Vercel (auto-deploy `main`; preview on all branches) |
| Package mgr | pnpm 9 |

## Key Files

| File | Purpose |
|---|---|
| `proxy.ts` | Auth guard + monitor PIN gate + Supabase session refresh. Next.js 16 — not middleware.ts |
| `lib/types.ts` | All shared TypeScript interfaces — Profile, SessionLog, SetLog, CoachNote, etc. |
| `lib/roadmap-data.ts` | Roadmap item definitions. `status`, `pr`, `issue` updated as work progresses |
| `lib/storage.ts` | Upstash Redis KV — `getRoadmapOverrides()` / `setRoadmapOverride()`. Key: `bb:roadmap-overrides` |
| `lib/github-api.ts` | GitHub REST helpers: `ensureBranchReady`, `createDraftPr`, `createIssue`, `getMainSha` |
| `lib/supabase/server.ts` | Server Supabase client — use in Server Components, Route Handlers, Server Actions |
| `lib/supabase/client.ts` | Browser Supabase client — use in Client Components only |
| `lib/utils.ts` | `cn()`, `getFormBadge()`, `getDefaultWeight()`, `formatWeight()`, `hoursSince()` |
| `lib/constants.ts` | `EFFORT_LABELS`, `SORENESS_LABELS`, `SESSIONS_PER_PAGE=3`, `SORENESS_PROMPT_GAP_HOURS=12` |
| `lib/rbac.ts` | Role helpers — `requireRole()`, `hasRole()` |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema — run once in Supabase SQL Editor |
| `supabase/seed.sql` | Default 12-week program seed data |
| `app/globals.css` | Tailwind v4 `@theme` block — all design tokens here |
| `.github/workflows/claude-feature.yml` | Agent workflow — `workflow_dispatch` → Claude Code implements a roadmap item |

## Route Structure

```
app/
  (auth)/login            → /login          Public
  (auth)/signup           → /signup         Public
  (auth)/forgot-password  → /forgot-password Public
  (auth)/reset-password   → /reset-password  Public
  auth/callback           → OAuth callback   Public
  (app)/dashboard         → /dashboard       Protected: all roles
  (app)/sessions          → /sessions        Protected: user
  (app)/progress          → /progress        Protected: user
  (app)/coach-notes       → /coach-notes     Protected: user (coach-paired only)
  (coach)/clients         → /clients         Protected: coach/admin
  (coach)/clients/[id]    → /clients/:id     Protected: coach/admin
  (coach)/playbook        → /playbook        Protected: coach/admin
  (admin)/users           → /admin/users     Protected: admin only
  (admin)/programs        → /admin/programs  Protected: admin only
  monitor/login           → PIN gate         Public
  monitor/roadmap         → Dev monitor      PIN-gated
```

## Database Schema (key tables)

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users — `role`, `gender`, `coach_id`, `template_tier`, `onboarding_done` |
| `programs` / `phases` | Program definitions — 3 phases, 12 weeks |
| `workout_templates` | Per-week session templates (36 per program) |
| `template_exercises` | Exercises with 6 weight defaults (3 tiers × 2 genders) |
| `user_enrollments` | Links user to program + tracks current week/session |
| `session_logs` | One per user per session — effort, soreness, completion |
| `set_logs` | One per set logged — weight_used, reps_completed |
| `coach_form_assessments` | **COACH-ONLY** — never expose status to user role |
| `coach_notes` | Banner + history — `dismissed_at`, `read_at`, `sent_at` |
| `personal_records` | Auto-detected PRs per exercise |
| `milestones` | Achievement tracking |

## KV Store

| Key | Type | Purpose |
|---|---|---|
| `bb:roadmap-overrides` | `Record<string, RoadmapOverride>` | Runtime status/pr/issue overrides for roadmap monitor items. Bypasses static `roadmap-data.ts` so clicking "Start" immediately shows in-progress without redeploy |

`RoadmapOverride = { status: "in-progress" \| "done" \| "paused", pr?: number, issue?: number, startedAt?: string }`

Requires env vars: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Vercel env).
Degrades gracefully to static data when not configured.

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server only) | Bypasses RLS — admin ops only |
| `ROADMAP_PIN` | Vercel | PIN for /monitor/login |
| `GITHUB_TOKEN` | Vercel (server only) | Fine-grained PAT — needs Contents/PRs/Issues/Actions write |
| `NEXT_PUBLIC_GITHUB_REPO` | Vercel | `omerskywalker/BuildBase` |
| `NEXT_PUBLIC_APP_URL` | Vercel | `https://buildbase.io` |
| `UPSTASH_REDIS_REST_URL` | Vercel | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel | Upstash Redis auth token |
| `ANTHROPIC_API_KEY` | GitHub Actions secrets | Claude Code in `claude-feature.yml` |

## Current Status (2026-04-16)

| Batch | Items | Status |
|---|---|---|
| 1 — Foundation | Auth, RBAC, Profiles, Seed | PRs open (#7–10), in-progress in static data |
| 2 — Session Tracker | Onboarding + 3 tracker items | Not started (issues #17, 22–24 exist) |
| 3 — Phase View | Phase overview, detail modal, preview | Not started (issues #25–27) |
| 4 — Coach Features | Playbook, clients, form assessment, notes | Not started (issues #28–31) |
| 5 — Admin Panel | User mgmt, create user, overrides | Not started (issues #32–34) |
| 6 — Metrics | Charts, milestones, trends | Not started (issues #35–37) |
| 7 — Template Editor | Program editor, session DnD, exercise lib | Not started (issues #38–40) |
| 8 — Monitor | Login, KickoffButton, Poller | **Done** |

GitHub Issue numbers stamped in `lib/roadmap-data.ts` — kickoff never creates duplicates.

## Design System

Full spec in `WIKI/design-system.md`. Quick reference:

| Token | Value | Use |
|---|---|---|
| `bg-base` | `#0F1A14` | Page background |
| `bg-surface` | `#152019` | Sidebar, headers |
| `bg-elevated` | `#1C2A20` | Cards, panels |
| `accent` | `#C84B1A` | CTAs, burnt orange |
| `brand` | `#1C3A2A` | Forest green |
| `content-primary` | `#E8F0E8` | Headings |
| `content-secondary` | `#8A9E8A` | Labels |
| `success` | `#2D7A3A` | Completed states |
| `error` | `#B83020` | Errors |
| `info` | `#3060A0` | In-progress, PR links |

App name rendering — must match everywhere:
```tsx
<span style={{ color: "#1C3A2A" }}>Build</span>
<span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
```

## Conventions

**Branch naming:**
```
feat/batch-{n}-{short-description}   roadmap batch work
fix/{short-description}              bug fixes
chore/{short-description}            deps, config, CI
```

**Commit format:**
```
type(scope): short description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**PR process:** Branch off `main` → `pnpm tsc --noEmit` clean → `pnpm test` passing → PR targets `main`.

**Parallel agents:** When a batch is `parallelizable: true`, each item has a FILE SCOPE CONTRACT in its GitHub Issue. Agents must only touch files listed under "Owns" and never touch files under "Avoid". Never modify `lib/roadmap-data.ts` in a parallel run — the kickoff API manages status via KV.

## Navigation

- [gotchas.md](gotchas.md) — **Read this before touching anything**
- [agents.md](agents.md) — Agent-specific context for GitHub Actions runs
- [design-system.md](design-system.md) — Full visual spec, component patterns, anti-patterns
- [sessions/](sessions/) — Session logs
