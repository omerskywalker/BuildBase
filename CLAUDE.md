@AGENTS.md

# BuildBase — Agent Context

## Wiki (read before starting any task)
- **Project wiki:** `WIKI/index.md` — architecture, key files, design tokens, current status
- **Gotchas:** `WIKI/gotchas.md` — real failures that have happened, read this first
- **Design doc:** `~/Downloads/ClaudeCode/project-design-docs/BuildBase-design-doc.md` — full product spec

---

## What this app does

BuildBase is a structured fitness coaching SaaS (RBAC: admin/coach/user). Coaches program 12-week strength plans, track client form assessments (coach-only), and send notes. Users log sets, see progress, and get guided to their next session automatically.

**Coach-optional model:** Users with `coach_id IS NULL` get zero coach UI. Coaches pair with clients via admin assignment.

---

## Architecture

### Stack
- **Next.js 16.2.2** (App Router, proxy.ts not middleware.ts)
- **React 19.2.4**
- **Tailwind CSS v4** (CSS-first, `@import "tailwindcss"`, `@theme {}` block — no tailwind.config.ts)
- **shadcn v4** (style: base-nova, components in `components/ui/`)
- **Supabase** (auth + PostgreSQL + RLS)
- **pnpm**, **Vitest v4**, **TypeScript strict**

### Key files
| File | Purpose |
|------|---------|
| `proxy.ts` | Auth guard + monitor PIN gate + Supabase session refresh |
| `lib/types.ts` | All shared TypeScript types |
| `lib/supabase/client.ts` | Browser Supabase client (Client Components) |
| `lib/supabase/server.ts` | Server Supabase client (Server Components, Route Handlers) |
| `lib/roadmap-data.ts` | Roadmap item definitions — update `status` and `pr` as work progresses |
| `lib/constants.ts` | EFFORT_LABELS, SORENESS_LABELS, SESSIONS_PER_PAGE, SORENESS_PROMPT_GAP_HOURS |
| `lib/utils.ts` | `cn()`, `getFormBadge()`, `getDefaultWeight()`, `formatWeight()`, `hoursSince()` |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema — run once in Supabase SQL Editor |
| `app/monitor/roadmap/page.tsx` | PIN-gated roadmap monitor (server component, fetches live GitHub PR status) |

### Route structure
```
app/
  (auth)/login          → /login         Public
  (auth)/signup         → /signup        Public
  auth/callback         → OAuth callback  Public
  (app)/dashboard       → /dashboard      Protected: all roles
  (app)/sessions        → /sessions       Protected: user
  (app)/progress        → /progress       Protected: user
  (app)/coach-notes     → /coach-notes    Protected: user (coach-paired only)
  (coach)/clients       → /clients        Protected: coach/admin
  (coach)/clients/[id]  → /clients/:id    Protected: coach/admin
  (coach)/playbook      → /playbook       Protected: coach/admin
  (admin)/users         → /admin/users    Protected: admin only
  (admin)/programs      → /admin/programs Protected: admin only
  monitor/login         → PIN gate        Public
  monitor/roadmap       → Dev monitor     PIN-gated
```

### Database
Full schema in `supabase/migrations/001_initial_schema.sql`. Key tables:
- `profiles` — extends auth.users, has `role`, `gender`, `coach_id`, `template_tier`
- `session_logs` — one per user per session, tracks effort/soreness
- `set_logs` — one per set logged
- `coach_form_assessments` — **NEVER exposed to user role** — internal coach tool
- `coach_notes` — banner + history system
- `template_exercises` — weight defaults for all 6 tier/gender combos

### RBAC
- **admin** — full access, creates users/coaches, edits program templates
- **coach** — sees own clients, sends notes, marks form assessments
- **user** — sees own data only, never sees form scores (only "Solid Form ✅" on locked_in)

---

## Design tokens (globals.css)

```
bg-base:       #0F1A14   body background
bg-surface:    #152019   sidebar, sticky headers
bg-elevated:   #1C2A20   cards, panels
bg-hover:      #22332A   hover states

border-subtle: #2A3D30
border-strong: #3A5040

content-primary:   #E8F0E8
content-secondary: #8A9E8A
content-muted:     #4A5A4A

brand:       #1C3A2A   (forest green)
accent:      #C84B1A   (burnt orange — CTAs, highlights)
accent-dim:  #8C3410

success:     #2D7A3A
warning:     #C08030
error:       #B83020
```

App name rendering (must match everywhere):
```tsx
<span style={{ color: "#1C3A2A" }}>Build</span>
<span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
```

---

## Key UX rules (non-negotiable)

1. **Form scores NEVER shown to users** — `coach_form_assessments` is coach-only. User sees only "Solid Form ✅" badge when `status === 'locked_in'`. Use `getFormBadge()` from `lib/utils.ts`.
2. **Session tracker pagination** — 3 sessions per page (`SESSIONS_PER_PAGE`), next incomplete auto-opens, completed auto-collapse.
3. **Soreness prompt** — fires when `hoursSince(lastCompletedAt) > SORENESS_PROMPT_GAP_HOURS (12h)` and `soreness_prompted` is false. Sets `soreness_prompted = true` on dismiss.
4. **Effort prompt** — after last set of a session. Scale: 1(🔴 Easy)→5(💪 Maxed). Auto-dismisses after 4s.
5. **Coach notes banner** — shown on dashboard until user hits X (`dismissed_at` is set). Full history at `/coach-notes`.
6. **Optimistic updates** — set_logs update immediately, sync in background.

---

## Conventions

### Branch naming
```
feat/batch-{n}-{short-description}   roadmap batch work
fix/{short-description}              bug fixes
chore/{short-description}            deps, config, CI
```

### Commit format
```
type: short description (imperative, lowercase)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
Types: `feat`, `fix`, `chore`, `test`, `docs`

### PR process
1. Branch off `main`
2. `pnpm tsc --noEmit` must be clean
3. `pnpm test` must pass
4. Update `lib/roadmap-data.ts` with PR number and status
5. PR targets `main`

---

## Testing

```bash
pnpm test           # vitest run
pnpm test:watch     # watch mode
pnpm test:coverage  # coverage report
pnpm tsc --noEmit   # type-check only
```

Tests live in `tests/`. Coverage configured for `lib/**/*.ts`.
Each roadmap item must have tests before its PR is merged.

---

## Environment variables

| Var | Where | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server only) | Bypasses RLS — admin ops only |
| `ROADMAP_PIN` | Vercel | PIN for /monitor/roadmap |
| `GITHUB_TOKEN` | Vercel (server only) | PAT (repo + workflow) for kickoff API |
| `NEXT_PUBLIC_GITHUB_REPO` | Vercel | `omerskywalker/BuildBase` |
| `NEXT_PUBLIC_APP_URL` | Vercel | `https://buildbase.io` |
| `ANTHROPIC_API_KEY` | GitHub Actions secrets | Claude Code in CI workflows |

---

## Updating the roadmap monitor

When a PR for a roadmap item is opened:
1. Set `status: "in-progress"` and `pr: <number>` in `lib/roadmap-data.ts`
2. When merged: set `status: "done"` and `tests: true`
