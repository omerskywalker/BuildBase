export type ItemStatus = "not-started" | "in-progress" | "done" | "paused" | "failed";

/** Paths this agent owns and should NOT be touched by sibling agents in the same batch. */
export interface ItemScope {
  owns: string[];   // Route/file paths this item's agent creates (e.g. "app/(coach)/playbook/")
  avoid: string[];  // Paths owned by other items in the same batch
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: ItemStatus;
  tests: boolean;
  branch?: string;
  pr?: number;
  /** GitHub Issue number created at kickoff time. Closed automatically when PR merges. */
  issue?: number;
  /** File scope contract for parallel agent execution. */
  scope?: ItemScope;
}

export interface RoadmapBatch {
  number: number;
  title: string;
  summary: string;
  /** When true, all not-started items can be dispatched in parallel without merge conflicts. */
  parallelizable: boolean;
  items: RoadmapItem[];
}

export const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "omerskywalker/BuildBase";

export const ROADMAP: RoadmapBatch[] = [
  {
    number: 1,
    title: "Foundation",
    summary: "Supabase auth, role-based routing, RLS policies, profile creation, and default 12-week program seed.",
    // Items chain: auth → RBAC → profiles → seed. Each depends on prior work.
    parallelizable: false,
    items: [
      {
        id: "1-1",
        title: "Supabase Auth integration (email/password)",
        description: "Login, signup, logout, password reset flows using @supabase/ssr.",
        status: "done",
        tests: true,
        branch: "feat/batch-1-auth",
        pr: 7,
        issue: 18,
        scope: {
          owns: ["app/(auth)/", "app/auth/callback/", "components/AuthForm.tsx"],
          avoid: ["proxy.ts", "scripts/"],
        },
      },
      {
        id: "1-2",
        title: "Role-based routing + RLS policies",
        description: "proxy.ts guards per role, all tables have RLS policies enforcing admin/coach/user access.",
        status: "done",
        tests: true,
        branch: "feat/batch-1-rbac",
        pr: 8,
        issue: 19,
        scope: {
          owns: ["proxy.ts"],
          avoid: ["app/(auth)/", "scripts/"],
        },
      },
      {
        id: "1-3",
        title: "Profile creation on first login",
        description: "After OAuth callback, create profiles row if missing. Onboarding flag set to false.",
        status: "done",
        tests: true,
        branch: "feat/batch-1-profiles",
        pr: 9,
        issue: 20,
        scope: {
          owns: ["app/auth/callback/"],
          avoid: ["proxy.ts", "scripts/"],
        },
      },
      {
        id: "1-4",
        title: "Seed script: default 12-week program",
        description: "36 sessions, all exercises with default weights per tier + gender, insertable via admin panel or script.",
        status: "done",
        tests: true,
        branch: "feat/batch-1-seed",
        pr: 10,
        issue: 21,
        scope: {
          owns: ["scripts/seed.ts", "supabase/seed.sql"],
          avoid: ["app/(auth)/", "proxy.ts"],
        },
      },
    ],
  },
  {
    number: 2,
    title: "Session Tracker",
    summary: "Onboarding flow, interactive session tracker with weekly pagination, set logging, and effort/soreness prompts.",
    // Items 2-2/2-3/2-4 all touch app/(app)/sessions/ — sequential to avoid conflicts.
    parallelizable: false,
    items: [
      {
        id: "2-1",
        title: "Onboarding flow (name, gender, template)",
        description: "First-login wizard collecting full_name, gender, confirming template tier. Sets onboarding_done.",
        status: "done",
        tests: true,
        branch: "feat/batch-2-onboarding",
        pr: 67,
        issue: 17,
        scope: {
          owns: ["app/(app)/onboarding/"],
          avoid: ["app/(app)/sessions/"],
        },
      },
      {
        id: "2-2",
        title: "Session tracker page",
        description: "Weekly view with 3 sessions per page, next incomplete session auto-opens, completed auto-collapse.",
        status: "done",
        tests: true,
        branch: "feat/batch-2-tracker",
        pr: 68,
        issue: 22,
        scope: {
          owns: ["app/(app)/sessions/page.tsx", "app/(app)/sessions/SessionCard.tsx"],
          avoid: ["app/(app)/onboarding/"],
        },
      },
      {
        id: "2-3",
        title: "Interactive weight/rep controls + set logging",
        description: "+/- increment buttons, pre-filled defaults, tap to log a set (green confirmation), optimistic updates.",
        status: "done",
        tests: true,
        branch: "feat/batch-2-set-logging",
        pr: 69,
        issue: 23,
        scope: {
          owns: ["app/(app)/sessions/SetRow.tsx", "app/(app)/sessions/WeightControl.tsx", "app/api/sessions/"],
          avoid: ["app/(app)/onboarding/"],
        },
      },
      {
        id: "2-4",
        title: "Effort + soreness prompts",
        description: "End-of-session 5-button effort prompt; pre-session soreness prompt when 12h+ gap since last session.",
        status: "done",
        tests: true,
        branch: "feat/batch-2-prompts",
        pr: 71,
        issue: 24,
        scope: {
          owns: ["app/(app)/sessions/EffortPrompt.tsx", "app/(app)/sessions/SorenessPrompt.tsx"],
          avoid: ["app/(app)/onboarding/"],
        },
      },
    ],
  },
  {
    number: 3,
    title: "Phase View",
    summary: "Program overview with session status indicators, progress bars, completed session detail, and future session preview.",
    parallelizable: true,
    items: [
      {
        id: "3-1",
        title: "Phase overview page",
        description: "All sessions shown as grid with complete/current/upcoming indicators. Per-phase and overall progress bars.",
        status: "done",
        tests: true,
        branch: "feat/batch-3-phase-view",
        pr: 72,
        issue: 25,
        scope: {
          owns: ["app/(app)/progress/"],
          avoid: ["app/(app)/sessions/SessionDetailModal.tsx", "app/(app)/sessions/SessionPreview.tsx"],
        },
      },
      {
        id: "3-2",
        title: "Completed session detail modal",
        description: "Click a completed session to see date, weights used, effort score, notes.",
        status: "done",
        tests: true,
        branch: "feat/batch-3-session-detail",
        pr: 73,
        issue: 26,
        scope: {
          owns: ["app/(app)/sessions/SessionDetailModal.tsx"],
          avoid: ["app/(app)/progress/", "app/(app)/sessions/SessionPreview.tsx"],
        },
      },
      {
        id: "3-3",
        title: "Future session preview (read-only)",
        description: "Tap any upcoming session to see the exercise list with default weights — read-only preview.",
        status: "done",
        tests: true,
        branch: "feat/batch-3-session-preview",
        pr: 74,
        issue: 27,
        scope: {
          owns: ["app/(app)/sessions/SessionPreview.tsx"],
          avoid: ["app/(app)/progress/", "app/(app)/sessions/SessionDetailModal.tsx"],
        },
      },
    ],
  },
  {
    number: 4,
    title: "Coach Features",
    summary: "Playbook, client list, form assessments (internal only), Solid Form badge, and coach notes with banner + history.",
    parallelizable: true,
    items: [
      {
        id: "4-1",
        title: "Coach's Playbook page",
        description: "Formatted, collapsible, searchable reference guide for the coach at /playbook.",
        status: "done",
        tests: true,
        branch: "feat/batch-4-playbook",
        pr: 78,
        issue: 28,
        scope: {
          owns: ["app/(coach)/playbook/"],
          avoid: ["app/(coach)/clients/", "app/(app)/coach-notes/", "components/CoachNotesBanner.tsx"],
        },
      },
      {
        id: "4-2",
        title: "Client list + detail view",
        description: "Coach sees their clients, clicks in to see session log history, current week, stats.",
        status: "done",
        tests: false,
        branch: "feat/batch-4-clients",
        issue: 29,
        scope: {
          owns: ["app/(coach)/clients/page.tsx", "app/(coach)/clients/[id]/page.tsx"],
          avoid: ["app/(coach)/playbook/", "app/(app)/coach-notes/", "components/CoachNotesBanner.tsx", "app/(coach)/clients/[id]/FormAssessmentPanel.tsx"],
        },
      },
      {
        id: "4-3",
        title: "Form assessment panel + Solid Form badge",
        description: "Coach marks needs_cues / getting_there / locked_in per exercise. User sees 'Solid Form ✅' badge only on locked_in. Auto-suppressed from future check-ins.",
        status: "done",
        tests: true,
        branch: "feat/batch-4-form-assessment",
        pr: 82,
        issue: 30,
        scope: {
          owns: ["app/(coach)/clients/[id]/FormAssessmentPanel.tsx", "app/api/coach/form-assessment/"],
          avoid: ["app/(coach)/playbook/", "app/(app)/coach-notes/", "components/CoachNotesBanner.tsx"],
        },
      },
      {
        id: "4-4",
        title: "Coach notes system",
        description: "Coach sends notes via + button → dialog. User sees banner on dashboard until dismissed. Unsend while unread. Full history in Coach's Notes tab.",
        status: "in-progress",
        tests: true,
        branch: "feat/batch-4-coach-notes",
        pr: 83,
        issue: 31,
        scope: {
          owns: ["app/(app)/coach-notes/", "components/CoachNotesBanner.tsx", "app/api/coach/notes/"],
          avoid: ["app/(coach)/playbook/", "app/(coach)/clients/"],
        },
      },
    ],
  },
  {
    number: 5,
    title: "Admin Panel",
    summary: "User + coach management tables, role assignment, user creation form, and per-user workout override editor.",
    parallelizable: true,
    items: [
      {
        id: "5-1",
        title: "User + coach management",
        description: "Admin table with full CRUD. Assign roles, pair coaches to users, activate/deactivate.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-5-admin-users",
        issue: 32,
        scope: {
          owns: ["app/(admin)/users/page.tsx", "app/api/admin/users/"],
          avoid: ["app/(admin)/users/create/", "app/(admin)/overrides/"],
        },
      },
      {
        id: "5-2",
        title: "Create user form",
        description: "Admin creates users directly: name, email, gender, role, coach assignment, template tier.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-5-create-user",
        issue: 33,
        scope: {
          owns: ["app/(admin)/users/create/", "app/api/admin/users/create/"],
          avoid: ["app/(admin)/users/page.tsx", "app/(admin)/overrides/"],
        },
      },
      {
        id: "5-3",
        title: "Per-user workout override editor",
        description: "Admin (or coach) can override sets/reps/weight for any exercise for a specific user.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-5-overrides",
        issue: 34,
        scope: {
          owns: ["app/(admin)/overrides/", "app/api/admin/overrides/"],
          avoid: ["app/(admin)/users/"],
        },
      },
    ],
  },
  {
    number: 6,
    title: "Metrics",
    summary: "Progress charts, weekly volume, streaks, PRs, milestones with animations, and effort/soreness trends.",
    parallelizable: true,
    items: [
      {
        id: "6-1",
        title: "Progress charts per lift",
        description: "Recharts line charts showing weight over time per exercise. Coach sees these for their clients.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-6-charts",
        issue: 35,
        scope: {
          owns: ["app/(app)/progress/charts/", "components/LiftChart.tsx"],
          avoid: ["app/(app)/progress/milestones/", "app/(app)/progress/trends/"],
        },
      },
      {
        id: "6-2",
        title: "Streaks, completion rate, PRs, milestones",
        description: "Streak counter, overall completion %, auto-detected personal records board, milestone checklist with achievement animations.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-6-milestones",
        issue: 36,
        scope: {
          owns: ["app/(app)/progress/milestones/", "components/MilestoneCard.tsx", "components/StreakBadge.tsx"],
          avoid: ["app/(app)/progress/charts/", "app/(app)/progress/trends/"],
        },
      },
      {
        id: "6-3",
        title: "Effort + soreness trend charts + insights",
        description: "Line charts for effort/soreness over sessions. Auto-generated insight text (e.g. 'High effort → next-day soreness correlation').",
        status: "not-started",
        tests: false,
        branch: "feat/batch-6-insights",
        issue: 37,
        scope: {
          owns: ["app/(app)/progress/trends/", "components/TrendChart.tsx"],
          avoid: ["app/(app)/progress/charts/", "app/(app)/progress/milestones/"],
        },
      },
    ],
  },
  {
    number: 7,
    title: "Workout Template Editor",
    summary: "Admin program editor with drag-and-drop sessions, exercise library CRUD, weight editor, and program versioning.",
    parallelizable: true,
    items: [
      {
        id: "7-1",
        title: "Program + phase editor",
        description: "Admin can edit program name, phase names, and week ranges at /admin/programs.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-7-program-editor",
        issue: 38,
        scope: {
          owns: ["app/(admin)/programs/page.tsx", "app/(admin)/programs/[id]/page.tsx", "app/api/admin/programs/"],
          avoid: ["app/(admin)/programs/[id]/session-editor/", "app/(admin)/programs/[id]/exercises/"],
        },
      },
      {
        id: "7-2",
        title: "Session editor with drag-and-drop (dnd-kit)",
        description: "Reorder exercises within a session via drag-and-drop. Add/remove exercises. Edit superset groups.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-7-session-editor",
        issue: 39,
        scope: {
          owns: ["app/(admin)/programs/[id]/session-editor/"],
          avoid: ["app/(admin)/programs/page.tsx", "app/(admin)/programs/[id]/exercises/"],
        },
      },
      {
        id: "7-3",
        title: "Exercise library + weight editor",
        description: "Full CRUD for exercises. Edit all 6 weight defaults (3 tiers × 2 genders) per template exercise. Program versioning — snapshot before destructive changes.",
        status: "not-started",
        tests: false,
        branch: "feat/batch-7-exercise-library",
        issue: 40,
        scope: {
          owns: ["app/(admin)/programs/[id]/exercises/", "app/api/admin/exercises/"],
          avoid: ["app/(admin)/programs/page.tsx", "app/(admin)/programs/[id]/session-editor/"],
        },
      },
    ],
  },
  {
    number: 8,
    title: "Monitor / Roadmap",
    summary: "PIN-gated /monitor/roadmap with KickoffButton → GitHub workflow_dispatch, RoadmapPoller, and RetryButton.",
    parallelizable: false,
    items: [
      {
        id: "8-1",
        title: "/monitor/login PIN gate + roadmap page",
        description: "PIN-gated monitor at /monitor/roadmap. Adapts HuntYourHome pattern with BuildBase branding.",
        status: "done",
        tests: false,
        branch: "feat/batch-8-monitor",
      },
      {
        id: "8-2",
        title: "KickoffButton → GitHub workflow_dispatch",
        description: "Click Start on any not-started item → POST /api/monitor/kickoff → triggers claude-feature.yml → PR created.",
        status: "done",
        tests: false,
        branch: "feat/batch-8-kickoff",
      },
      {
        id: "8-3",
        title: "RoadmapPoller + RetryButton",
        description: "Client component auto-refreshes when items are in-progress. RetryButton re-triggers failed CI runs.",
        status: "done",
        tests: false,
        branch: "feat/batch-8-poller",
      },
    ],
  },
];

// ── Progress helpers ───────────────────────────────────────────────────────────

export function getBatchProgress(batch: RoadmapBatch) {
  const total = batch.items.length;
  const done = batch.items.filter((i) => i.status === "done").length;
  const inProgress = batch.items.filter((i) => i.status === "in-progress").length;
  return { total, done, inProgress };
}

export function getOverallProgress() {
  const allItems = ROADMAP.flatMap((b) => b.items);
  const total = allItems.length;
  const done = allItems.filter((i) => i.status === "done").length;
  const pct = Math.round((done / total) * 100);
  return { total, done, pct };
}
