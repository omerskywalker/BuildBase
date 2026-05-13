---
type: agent-guide
tags: [agents, buildbase, github-actions]
last-updated: 2026-04-16
---

# Agent Guide — BuildBase

> Read this if you are a Claude Code agent running in GitHub Actions via `claude-feature.yml`.

---

## Your Environment

- **Repo:** checked out at the working directory, on the feature branch specified by `inputs.branch_name`
- **Node:** 20, pnpm 9 — dependencies already installed by the workflow
- **Git:** configured as `github-actions[bot]` — do NOT run `git add`, `git commit`, or `git push` yourself. The workflow handles all of that after you finish.
- **Secrets available:** `ANTHROPIC_API_KEY` (your own key, already in use), `GITHUB_TOKEN` (OIDC-provisioned)

## Workflow Inputs You Receive

| Input | What it is |
|---|---|
| `item_id` | Roadmap item ID, e.g. `"2-1"` |
| `item_title` | Short title of the item |
| `item_description` | Brief description (may include FILE SCOPE CONTRACT for parallel runs) |
| `branch_name` | Feature branch, already created and checked out |
| `issue_number` | GitHub Issue # with the full spec — **read this first** |
| `pr_number` | Draft PR # already open — push commits to it, do NOT create a new PR |

## Your Job — Step by Step

1. **Read `CLAUDE.md`** — project conventions, design tokens, architecture
2. **Read `WIKI/gotchas.md`** — real failures. Do this before writing a single line
3. **Read GitHub Issue `#<issue_number>`** — full implementation spec, acceptance criteria, FILE SCOPE CONTRACT
4. **Write code** — follow the file scope contract if present (parallel batch runs only)
5. **Write tests** in `tests/` — see coverage requirements below
6. **Run `pnpm tsc --noEmit`** — fix every type error before finishing
7. **Run `pnpm test`** — fix every failing test before finishing
8. **Update `lib/roadmap-data.ts`** for your item — set `status: "in-progress"`, `pr: <pr_number>`, confirm `issue: <issue_number>` is set
   - **EXCEPTION:** If the description contains FILE SCOPE CONTRACT, **skip this step** — the kickoff API manages status for parallel agents

## Critical Constraints

- **Do NOT run git commands** — no `git add`, `git commit`, `git push`. The workflow commits everything after you return.
- **Do NOT create a new PR** — Draft PR `#<pr_number>` already exists. Pushing commits is enough.
- **Do NOT modify `lib/roadmap-data.ts`** if you are in a parallel batch (FILE SCOPE CONTRACT present in your description).
- **Respect FILE SCOPE CONTRACT** — if the issue lists "Owns" and "Avoid" paths, only touch files under "Owns".

## Test Requirements

Tests live in `tests/`. Coverage target: `lib/**/*.ts` (excludes external API wrappers).

Minimum per batch:

| Batch | What to test |
|---|---|
| 1 — Auth/RBAC | Unauthenticated redirect, role checks, profile creation logic |
| 2 — Session Tracker | `getDefaultWeight()`, `hoursSince()`, soreness prompt trigger |
| 3 — Phase View | Session status calculations (complete/current/upcoming) |
| 4 — Coach Features | `getFormBadge()` — must never return raw form status to user role |
| 5 — Admin | Role validation, override application |
| 6 — Metrics | PR detection logic, streak calculation |
| 7 — Template Editor | API route response shapes, validation |

## Required Workflow Permissions

The workflow (`claude-feature.yml`) runs with:
```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write    # Required for OIDC token used by claude-code-action@beta
```

## Key Imports

```ts
// Types
import type { Profile, SessionLog, SetLog, CoachNote } from "@/lib/types";

// Supabase — pick the right one
import { createClient } from "@/lib/supabase/server";  // Server Components, Route Handlers
import { createClient } from "@/lib/supabase/client";  // Client Components only

// Utils
import { cn, getFormBadge, getDefaultWeight, formatWeight, hoursSince } from "@/lib/utils";

// Constants
import { EFFORT_LABELS, SORENESS_LABELS, SESSIONS_PER_PAGE, SORENESS_PROMPT_GAP_HOURS } from "@/lib/constants";

// RBAC
import { hasRole, requireRole } from "@/lib/rbac";
```

## Common Supabase Patterns

```ts
// Server Component — get current user
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");

// Get profile
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

// NEVER query coach_form_assessments in user-facing components — use getFormBadge() instead
```

## What NOT To Do

- ❌ `git commit` / `git push` / `git add` — workflow handles this
- ❌ Create a new PR — the draft PR already exists
- ❌ Modify `lib/roadmap-data.ts` during parallel batch runs
- ❌ Expose `coach_form_assessments.status` to user-role views
- ❌ Use `middleware.ts` — it's `proxy.ts` in Next.js 16
- ❌ Access `params.id` synchronously — always `await params` in Next.js 16
- ❌ Call `cookies()` synchronously — always `await cookies()`
- ❌ Create `tailwind.config.ts` — Tailwind v4 is CSS-first, tokens live in `globals.css`
- ❌ Use `runtime` key in `proxy.ts` config — causes build error

## Adding shadcn Components

```bash
npx shadcn@latest add button card input label dialog sheet badge tabs separator
```

Components go to `components/ui/`. Check what's already there before adding.
