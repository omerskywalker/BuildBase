---
type: gotchas
tags: [gotchas, lessons-learned, buildbase]
last-updated: 2026-04-16
---

# Gotchas — BuildBase

> Read this before starting any task. Each entry is a real thing that burned us.
> Add new entries at the top with the date.

---

## 2026-04-16 — claude-code-action@beta requires `mode: agent` + `direct_prompt`

**Symptom:** Workflow run fails immediately with:
`Error: Prepare step failed with error: Tag mode cannot handle workflow_dispatch events. Use 'agent' mode for automation events.`

**Cause:** `claude-code-action@beta` changed its API. The old input `prompt:` is no longer valid — it must be `direct_prompt:`. And `workflow_dispatch` events require `mode: agent` to be set explicitly (default mode is "tag" which only works on PR/issue events).

**Fix:**
```yaml
- uses: anthropics/claude-code-action@beta
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    mode: agent          # ← required for workflow_dispatch
    direct_prompt: |     # ← not "prompt:"
      ...
```

---

## 2026-04-16 — ANTHROPIC_API_KEY must be in GitHub Actions secrets (not just Vercel)

**Symptom:** After fixing the mode error, workflow fails with:
`Error: Environment variable validation failed: Either ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN is required when using direct Anthropic API.`

**Cause:** `ANTHROPIC_API_KEY` is set as a Vercel env var (for any future server-side AI use) but GitHub Actions has its own separate secrets store. The workflow's `secrets.ANTHROPIC_API_KEY` looks in the repo's Actions secrets, not Vercel.

**Fix:** Go to GitHub → repo → Settings → Secrets and variables → Actions → New repository secret → `ANTHROPIC_API_KEY`.

---

## 2026-04-16 — GitHub workflow file: merge conflicts silently drop critical lines

**Symptom:** PR was merged, but `mode: agent` and `direct_prompt:` still weren't on main. The old `prompt:` key survived.

**Cause:** When multiple PRs touched `.github/workflows/claude-feature.yml`, the merge conflict was resolved back to the old version. GitHub's merge commit silently kept the old field names.

**Fix:** After any PR touching `claude-feature.yml`, always verify with `git show origin/main:.github/workflows/claude-feature.yml | grep -E "mode:|direct_prompt:|prompt:"` before triggering a kickoff.

---

## 2026-04-16 — Issue numbers must be stamped in roadmap-data.ts before kickoff

**Symptom:** Clicking "Start" creates a new duplicate GitHub Issue every time, even when the issue already exists.

**Cause:** `createIssue()` is guarded by `item.issue ?? existing?.issue ?? null`. If `item.issue` is `undefined` in `roadmap-data.ts` AND Upstash Redis is not configured (so `existing` is always `{}`), the guard fails and a new issue is created unconditionally on every click.

**Fix:** All issue numbers are now stamped in `lib/roadmap-data.ts` (items 1-1 through 7-3 → GitHub issues #17–40). Never remove these numbers. Duplicate issues #42–44, #47 were closed.

---

## 2026-04-16 — Workflow commit step silently succeeds with 0 changes

**Symptom:** PR is marked "ready for review" but has 0 file changes — only the empty init commit.

**Cause:** The commit step had `|| echo "Nothing to commit"` which swallowed the git failure. Then `git push` pushed the empty branch and `gh pr ready` marked it done. The Claude Code agent may have written nothing (model/auth issue) but the workflow appeared to succeed.

**Fix:** Added a "Verify changes exist" step before commit:
```bash
git add -A
if git diff --cached --quiet; then
  echo "::error::Claude Code produced no file changes."
  exit 1
fi
```

---

## 2026-04-15 — GitHub fine-grained PAT needs 4 specific permissions

**Symptom:** `/api/monitor/kickoff` returns `{ "error": "Failed to prepare branch — check GITHUB_TOKEN permissions" }`.

**Cause:** The fine-grained PAT used as `GITHUB_TOKEN` in Vercel was missing one or more required permissions.

**Required permissions (all must be Read and write):**
- **Contents** — create branches, create commits via git data API
- **Pull requests** — create draft PRs
- **Issues** — create/read GitHub Issues
- **Actions** — trigger `workflow_dispatch`

---

## 2026-04-15 — Branch must have ≥1 commit ahead of main for PR creation

**Symptom:** `createDraftPr()` returns 422 from GitHub: "No commits between main and feat/...".

**Cause:** GitHub requires the head branch to have at least one commit that main doesn't have before a PR can be created. `createBranch()` alone just creates a ref pointing to the same SHA as main — same tree, no diff.

**Fix:** `ensureBranchReady()` in `lib/github-api.ts` calls `createEmptyCommit()` when the branch HEAD SHA equals main's HEAD SHA. This creates a git commit with the same tree but a new hash, satisfying GitHub's requirement.

---

## 2026-04-15 — Upstash Redis env vars required for live in-progress status

**Symptom:** Clicking "Start" fires the kickoff API, button shows "Started → PR", but the roadmap page never updates to show "In Progress" after `router.refresh()`.

**Cause:** `setRoadmapOverride()` in `lib/storage.ts` silently no-ops if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are not set. The KV write is skipped, so on the next page render the static `roadmap-data.ts` status (not-started) is still shown.

**Fix:** Set both Upstash env vars in Vercel. The monitor degrades gracefully without them but live status updates don't work.

---

## Next.js 16 — proxy.ts replaces middleware.ts

**Symptom:** Auth guard or session refresh logic silently does nothing.

**Cause:** Next.js 16 renamed `middleware.ts` → `proxy.ts`. The exported function must be named `proxy`, not `middleware`. A `middleware.ts` at the root is silently ignored.

**Fix:**
```ts
// CORRECT — proxy.ts
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }; // no `runtime` key — build error

// WRONG — silently no-ops
export function middleware(request: NextRequest) { ... }
```
Note: `runtime` is not allowed in proxy.ts config — it always runs on Node.js.

---

## Next.js 16 — params and cookies/headers are async

**Symptom:** `params.id` is undefined; `cookies()` causes a type error.

**Fix:**
```ts
// Pages/layouts
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// Server components
const cookieStore = await cookies();
const headersList = await headers();
```

---

## Tailwind v4 — no tailwind.config.ts, @theme is CSS-first

**Symptom:** Custom tokens not resolving, or shadcn init breaks fonts.

**Cause:** Tailwind v4 uses CSS-first config. All design tokens live in the `@theme {}` block in `app/globals.css`. Font references inside `@theme` must be literal strings — `var()` references resolve at parse time and can't see Next.js runtime injections.

**Fix:**
```css
/* CORRECT */
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

/* WRONG — circular */
--font-sans: var(--font-sans);

/* WRONG — next/font injects this at runtime, @theme can't see it */
--font-sans: var(--font-inter);
```

---

## Supabase — getUser() not getSession() in proxy.ts

**Symptom:** Auth seems to work but sessions don't refresh correctly; stale tokens.

**Cause:** `getSession()` reads from the cookie without re-validating against the Supabase auth server. Only `getUser()` re-validates and refreshes the session token.

**Fix:** `proxy.ts` must use `supabase.auth.getUser()`.

---

## Supabase — coach_form_assessments is coach-only, forever

**Symptom:** Form assessment scores visible to users in the UI.

**Cause:** The `coach_form_assessments` table was queried in a user-facing component.

**Fix:** Users NEVER see raw form status. Use `getFormBadge(status)` from `lib/utils.ts`:
- `locked_in` → `"Solid Form ✅"`
- Everything else → `null`
RLS on the table also enforces this at the DB level.

---

## Monitor — MONITOR_COOKIE name is the source of truth

The monitor cookie name is `_bb_ok`, defined in `lib/constants.ts` as `MONITOR_COOKIE`. Both `proxy.ts` and `/api/monitor/kickoff/route.ts` parse the raw `Cookie` header for this value. If the name ever changes, update both files.
