#!/usr/bin/env node
/**
 * Creates GitHub Issues for all not-done roadmap items that don't already
 * have an issue number in roadmap-data.ts, then prints a mapping of
 * item-id → issue-number so you can paste it into roadmap-data.ts.
 *
 * Usage: node scripts/create-roadmap-issues.mjs
 * Requires: GITHUB_TOKEN env var (or gh CLI auth)
 */

import { execSync } from "node:child_process";

const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "omerskywalker/BuildBase";
const GH_API = "https://api.github.com";

// ── Inline roadmap (mirrors lib/roadmap-data.ts, skipping done items) ─────────

const ITEMS = [
  // Batch 1
  { id: "1-1", title: "Supabase Auth integration (email/password)", description: "Login, signup, logout, password reset flows using @supabase/ssr.", branch: "feat/batch-1-auth", scope: { owns: ["app/(auth)/", "app/auth/callback/", "components/AuthForm.tsx"], avoid: ["proxy.ts", "scripts/"] } },
  { id: "1-2", title: "Role-based routing + RLS policies", description: "proxy.ts guards per role, all tables have RLS policies enforcing admin/coach/user access.", branch: "feat/batch-1-rbac", scope: { owns: ["proxy.ts"], avoid: ["app/(auth)/", "scripts/"] } },
  { id: "1-3", title: "Profile creation on first login", description: "After OAuth callback, create profiles row if missing. Onboarding flag set to false.", branch: "feat/batch-1-profiles", scope: { owns: ["app/auth/callback/"], avoid: ["proxy.ts", "scripts/"] } },
  { id: "1-4", title: "Seed script: default 12-week program", description: "36 sessions, all exercises with default weights per tier + gender, insertable via admin panel or script.", branch: "feat/batch-1-seed", scope: { owns: ["scripts/seed.ts", "supabase/seed.sql"], avoid: ["app/(auth)/", "proxy.ts"] } },
  // Batch 2 (2-1 already has issue #17)
  { id: "2-2", title: "Session tracker page", description: "Weekly view with 3 sessions per page, next incomplete session auto-opens, completed auto-collapse.", branch: "feat/batch-2-tracker", scope: { owns: ["app/(app)/sessions/page.tsx", "app/(app)/sessions/SessionCard.tsx"], avoid: ["app/(app)/onboarding/"] } },
  { id: "2-3", title: "Interactive weight/rep controls + set logging", description: "+/- increment buttons, pre-filled defaults, tap to log a set (green confirmation), optimistic updates.", branch: "feat/batch-2-set-logging", scope: { owns: ["app/(app)/sessions/SetRow.tsx", "app/(app)/sessions/WeightControl.tsx", "app/api/sessions/"], avoid: ["app/(app)/onboarding/"] } },
  { id: "2-4", title: "Effort + soreness prompts", description: "End-of-session 5-button effort prompt; pre-session soreness prompt when 12h+ gap since last session.", branch: "feat/batch-2-prompts", scope: { owns: ["app/(app)/sessions/EffortPrompt.tsx", "app/(app)/sessions/SorenessPrompt.tsx"], avoid: ["app/(app)/onboarding/"] } },
  // Batch 3
  { id: "3-1", title: "Phase overview page", description: "All sessions shown as grid with complete/current/upcoming indicators. Per-phase and overall progress bars.", branch: "feat/batch-3-phase-view", scope: { owns: ["app/(app)/progress/"], avoid: ["app/(app)/sessions/SessionDetailModal.tsx", "app/(app)/sessions/SessionPreview.tsx"] } },
  { id: "3-2", title: "Completed session detail modal", description: "Click a completed session to see date, weights used, effort score, notes.", branch: "feat/batch-3-session-detail", scope: { owns: ["app/(app)/sessions/SessionDetailModal.tsx"], avoid: ["app/(app)/progress/", "app/(app)/sessions/SessionPreview.tsx"] } },
  { id: "3-3", title: "Future session preview (read-only)", description: "Tap any upcoming session to see the exercise list with default weights — read-only preview.", branch: "feat/batch-3-session-preview", scope: { owns: ["app/(app)/sessions/SessionPreview.tsx"], avoid: ["app/(app)/progress/", "app/(app)/sessions/SessionDetailModal.tsx"] } },
  // Batch 4
  { id: "4-1", title: "Coach's Playbook page", description: "Formatted, collapsible, searchable reference guide for the coach at /playbook.", branch: "feat/batch-4-playbook", scope: { owns: ["app/(coach)/playbook/"], avoid: ["app/(coach)/clients/", "app/(app)/coach-notes/", "components/CoachNotesBanner.tsx"] } },
  { id: "4-2", title: "Client list + detail view", description: "Coach sees their clients, clicks in to see session log history, current week, stats.", branch: "feat/batch-4-clients", scope: { owns: ["app/(coach)/clients/page.tsx", "app/(coach)/clients/[id]/page.tsx"], avoid: ["app/(coach)/playbook/", "app/(app)/coach-notes/", "components/CoachNotesBanner.tsx", "app/(coach)/clients/[id]/FormAssessmentPanel.tsx"] } },
  { id: "4-3", title: "Form assessment panel + Solid Form badge", description: "Coach marks needs_cues / getting_there / locked_in per exercise. User sees 'Solid Form ✅' badge only on locked_in. Auto-suppressed from future check-ins.", branch: "feat/batch-4-form-assessment", scope: { owns: ["app/(coach)/clients/[id]/FormAssessmentPanel.tsx", "app/api/coach/form-assessment/"], avoid: ["app/(coach)/playbook/", "app/(app)/coach-notes/", "components/CoachNotesBanner.tsx"] } },
  { id: "4-4", title: "Coach notes system", description: "Coach sends notes via + button → dialog. User sees banner on dashboard until dismissed. Unsend while unread. Full history in Coach's Notes tab.", branch: "feat/batch-4-coach-notes", scope: { owns: ["app/(app)/coach-notes/", "components/CoachNotesBanner.tsx", "app/api/coach/notes/"], avoid: ["app/(coach)/playbook/", "app/(coach)/clients/"] } },
  // Batch 5
  { id: "5-1", title: "User + coach management", description: "Admin table with full CRUD. Assign roles, pair coaches to users, activate/deactivate.", branch: "feat/batch-5-admin-users", scope: { owns: ["app/(admin)/users/page.tsx", "app/api/admin/users/"], avoid: ["app/(admin)/users/create/", "app/(admin)/overrides/"] } },
  { id: "5-2", title: "Create user form", description: "Admin creates users directly: name, email, gender, role, coach assignment, template tier.", branch: "feat/batch-5-create-user", scope: { owns: ["app/(admin)/users/create/", "app/api/admin/users/create/"], avoid: ["app/(admin)/users/page.tsx", "app/(admin)/overrides/"] } },
  { id: "5-3", title: "Per-user workout override editor", description: "Admin (or coach) can override sets/reps/weight for any exercise for a specific user.", branch: "feat/batch-5-overrides", scope: { owns: ["app/(admin)/overrides/", "app/api/admin/overrides/"], avoid: ["app/(admin)/users/"] } },
  // Batch 6
  { id: "6-1", title: "Progress charts per lift", description: "Recharts line charts showing weight over time per exercise. Coach sees these for their clients.", branch: "feat/batch-6-charts", scope: { owns: ["app/(app)/progress/charts/", "components/LiftChart.tsx"], avoid: ["app/(app)/progress/milestones/", "app/(app)/progress/trends/"] } },
  { id: "6-2", title: "Streaks, completion rate, PRs, milestones", description: "Streak counter, overall completion %, auto-detected personal records board, milestone checklist with achievement animations.", branch: "feat/batch-6-milestones", scope: { owns: ["app/(app)/progress/milestones/", "components/MilestoneCard.tsx", "components/StreakBadge.tsx"], avoid: ["app/(app)/progress/charts/", "app/(app)/progress/trends/"] } },
  { id: "6-3", title: "Effort + soreness trend charts + insights", description: "Line charts for effort/soreness over sessions. Auto-generated insight text (e.g. 'High effort → next-day soreness correlation').", branch: "feat/batch-6-insights", scope: { owns: ["app/(app)/progress/trends/", "components/TrendChart.tsx"], avoid: ["app/(app)/progress/charts/", "app/(app)/progress/milestones/"] } },
  // Batch 7
  { id: "7-1", title: "Program + phase editor", description: "Admin can edit program name, phase names, and week ranges at /admin/programs.", branch: "feat/batch-7-program-editor", scope: { owns: ["app/(admin)/programs/page.tsx", "app/(admin)/programs/[id]/page.tsx", "app/api/admin/programs/"], avoid: ["app/(admin)/programs/[id]/session-editor/", "app/(admin)/programs/[id]/exercises/"] } },
  { id: "7-2", title: "Session editor with drag-and-drop (dnd-kit)", description: "Reorder exercises within a session via drag-and-drop. Add/remove exercises. Edit superset groups.", branch: "feat/batch-7-session-editor", scope: { owns: ["app/(admin)/programs/[id]/session-editor/"], avoid: ["app/(admin)/programs/page.tsx", "app/(admin)/programs/[id]/exercises/"] } },
  { id: "7-3", title: "Exercise library + weight editor", description: "Full CRUD for exercises. Edit all 6 weight defaults (3 tiers × 2 genders) per template exercise. Program versioning — snapshot before destructive changes.", branch: "feat/batch-7-exercise-library", scope: { owns: ["app/(admin)/programs/[id]/exercises/", "app/api/admin/exercises/"], avoid: ["app/(admin)/programs/page.tsx", "app/(admin)/programs/[id]/session-editor/"] } },
];

function buildIssueBody(item) {
  const scopeSection = item.scope
    ? `\n### File Scope\n- **Owns:** ${item.scope.owns.map(p => `\`${p}\``).join(", ")}\n- **Avoid:** ${item.scope.avoid.map(p => `\`${p}\``).join(", ")}`
    : "";

  return [
    `## BuildBase Roadmap Item \`${item.id}\``,
    "",
    `**${item.title}**`,
    "",
    item.description,
    "",
    "---",
    "",
    "### Implementation Notes",
    `- Branch: \`${item.branch ?? `feat/item-${item.id}`}\``,
    scopeSection,
    "",
    "### Agent References",
    `- [\`CLAUDE.md\`](https://github.com/${REPO}/blob/main/CLAUDE.md) — project conventions, architecture, design tokens`,
    `- [\`WIKI/index.md\`](https://github.com/${REPO}/blob/main/WIKI/index.md) — current status, file map`,
    `- [\`WIKI/gotchas.md\`](https://github.com/${REPO}/blob/main/WIKI/gotchas.md) — known pitfalls, read first`,
    "",
    "---",
    "*Opened automatically by the BuildBase roadmap monitor.*",
  ].filter(l => l !== undefined).join("\n");
}

async function createIssue(item, token) {
  const res = await fetch(`${GH_API}/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `[${item.id}] ${item.title}`,
      body: buildIssueBody(item),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create issue for ${item.id}: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.number;
}

async function main() {
  // Get token from env or gh CLI
  let token = process.env.GITHUB_TOKEN;
  if (!token) {
    try {
      token = execSync("gh auth token", { encoding: "utf8" }).trim();
    } catch {
      console.error("No GITHUB_TOKEN env var and gh CLI not authenticated.");
      process.exit(1);
    }
  }

  console.log(`Creating ${ITEMS.length} issues on ${REPO}...\n`);

  const mapping = {}; // id → issue number

  for (const item of ITEMS) {
    try {
      const num = await createIssue(item, token);
      mapping[item.id] = num;
      console.log(`  ✓  ${item.id}  →  #${num}  (${item.title})`);
      // Tiny delay to avoid secondary rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗  ${item.id}: ${err.message}`);
    }
  }

  console.log("\n── Issue mapping ────────────────────────────────────────────");
  console.log(JSON.stringify(mapping, null, 2));
  console.log("─────────────────────────────────────────────────────────────\n");
  console.log("Paste these into roadmap-data.ts as `issue: <number>` on each item.");
}

main().catch(err => { console.error(err); process.exit(1); });
