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
        tests: true,
        branch: "feat/batch-4-clients",
        pr: 81,
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
        status: "done",
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
        status: "done",
        tests: true,
        branch: "feat/batch-5-admin-users",
        pr: 84,
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
        status: "done",
        tests: true,
        branch: "feat/batch-5-create-user",
        pr: 85,
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
        status: "done",
        tests: false,
        branch: "feat/batch-5-overrides",
        pr: 86,
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
        status: "done",
        tests: true,
        branch: "feat/batch-6-charts",
        pr: 88,
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
        status: "done",
        tests: true,
        branch: "feat/batch-6-milestones",
        pr: 87,
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
        status: "done",
        tests: false,
        branch: "feat/batch-6-insights",
        pr: 89,
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
        status: "done",
        tests: false,
        branch: "feat/batch-7-program-editor",
        pr: 91,
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
        status: "done",
        tests: true,
        branch: "feat/batch-7-session-editor",
        pr: 92,
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
        status: "done",
        tests: false,
        branch: "feat/batch-7-exercise-library",
        pr: 90,
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // ROADMAP V2 — Production Readiness (Issues #97–#120, Orchestrator #121)
  // ═══════════════════════════════════════════════════════════════════════════════

  // ── Phase 9: Stop Lying to Users ──────────────────────────────────────────
  {
    number: 9,
    title: "Stop Lying to Users",
    summary: "Fix critical bugs that silently lose workout data and show false success messages.",
    parallelizable: false,
    items: [
      {
        id: "9-1",
        title: "Fix quick-log persistence — session_logs NOT NULL constraint",
        description: [
          "session_logs.week_number and session_number are NOT NULL but the quick-log API sends neither.",
          "Add a migration: ALTER TABLE session_logs ALTER COLUMN week_number SET DEFAULT 0; same for session_number.",
          "Verify the quick-log route (app/api/quick-log/route.ts) inserts successfully after the migration.",
          "Add a test that POSTs to /api/quick-log and asserts the session_log row exists with week_number=0.",
        ].join("\n"),
        status: "done",
        tests: true,
        branch: "fix/quick-log-persistence",
        issue: 97,
        scope: {
          owns: ["supabase/migrations/004_quick_log_defaults.sql", "app/api/quick-log/route.ts"],
          avoid: ["components/QuickLogModal.tsx"],
        },
      },
      {
        id: "9-2",
        title: "Fix QuickLogModal false success on save failure",
        description: [
          "QuickLogModal.tsx catch block sets setSaved(true) even on failure — user sees 'Workout Saved!' when nothing was recorded.",
          "Also the fetch call never checks response.ok.",
          "Fix: check response.ok after fetch, throw on non-2xx. In catch block, show toast.error() instead of setSaved(true). Keep modal open for retry.",
          "Depends on #97 being merged first (otherwise all quick-logs fail).",
        ].join("\n"),
        status: "done",
        tests: true,
        branch: "fix/quick-log-false-success",
        issue: 98,
        scope: {
          owns: ["components/QuickLogModal.tsx"],
          avoid: ["app/api/quick-log/route.ts"],
        },
      },
      {
        id: "9-3",
        title: "Add apiFetchJson wrapper — surface API failures as toasts",
        description: [
          "Many client components call fetch() without checking response.ok — failures are silently swallowed.",
          "Create a utility that checks .ok, parses JSON, and throws a typed error on failure.",
          "Migrate all callers that currently ignore error responses.",
          "Each migrated caller should catch and show toast.error().",
        ].join("\n"),
        status: "in-progress",
        tests: true,
        branch: "fix/api-error-handling",
        issue: 99,
        scope: {
          owns: ["lib/api-helpers.ts"],
          avoid: ["app/api/"],
        },
      },
    ],
  },

  // ── Phase 10: Backend Hardening ───────────────────────────────────────────
  {
    number: 10,
    title: "Backend Hardening",
    summary: "Stop leaking errors, validate inputs, and fix silent no-ops in API routes.",
    parallelizable: true,
    items: [
      {
        id: "10-1",
        title: "Stop leaking database error messages to clients",
        description: [
          "Multiple API route handlers return raw Supabase error.message in responses.",
          "This exposes table names, column names, and constraint names to clients.",
          "Replace all error.message responses with generic messages.",
          "Log the actual error server-side using console.error with context.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/sanitize-error-responses",
        issue: 100,
        scope: {
          owns: ["app/api/sessions/"],
          avoid: ["app/api/admin/", "app/api/coach/"],
        },
      },
      {
        id: "10-2",
        title: "Verify update row counts — silent no-ops on sessions",
        description: [
          "Session mutation endpoints check for Supabase errors but don't verify rows were affected.",
          "If target row doesn't exist (wrong ID, RLS blocks), response is { ok: true } — silent no-op.",
          "Fix: use .select('id').single() after .update() and check returned data.",
          "Return 404 if no rows affected.",
        ].join("\n"),
        status: "done",
        tests: true,
        branch: "fix/verify-update-row-counts",
        issue: 101,
        scope: {
          owns: ["app/api/sessions/"],
          avoid: ["app/api/admin/"],
        },
      },
      {
        id: "10-3",
        title: "Add RLS INSERT policy for coach_form_assessments",
        description: [
          "Missing explicit INSERT WITH CHECK policy on coach_form_assessments.",
          "Add migration: CREATE POLICY form_assessments_coach_insert ON coach_form_assessments FOR INSERT WITH CHECK (coach_id = auth.uid());",
        ].join("\n"),
        status: "in-progress",
        tests: false,
        branch: "fix/form-assessment-rls",
        issue: 120,
        scope: {
          owns: ["supabase/migrations/005_form_assessment_rls.sql"],
          avoid: [],
        },
      },
      {
        id: "10-4",
        title: "Validate input on admin exercise/user creation routes",
        description: [
          "No length limits on text fields, no range validation on numbers, no URL format validation.",
          "Add Zod validation to admin API routes for exercise/user creation.",
        ].join("\n"),
        status: "in-progress",
        tests: true,
        branch: "fix/input-validation",
        issue: 103,
        scope: {
          owns: ["app/api/admin/"],
          avoid: ["app/api/sessions/", "app/api/coach/"],
        },
      },
    ],
  },

  // ── Phase 11: Data Quality & Resilience ───────────────────────────────────
  {
    number: 11,
    title: "Data Quality & Resilience",
    summary: "Seed data fixes, transaction safety, and React error boundaries.",
    parallelizable: true,
    items: [
      {
        id: "11-1",
        title: "Fix seed data: weights and plank reps",
        description: [
          "Female post-baseline weights set to 0 — athletes who complete baseline would see weights drop to 0.",
          "Plank has reps_default=0 (time hold), UI shows '0 reps'.",
          "Fix all weight values for logical progression across phases.",
        ].join("\n"),
        status: "not-started",
        tests: false,
        branch: "fix/seed-data-weights",
        issue: 117,
        scope: {
          owns: ["supabase/seed.sql"],
          avoid: [],
        },
      },
      {
        id: "11-2",
        title: "Exercise reorder: use transaction instead of Promise.all",
        description: [
          "Admin exercise reorder uses Promise.all with individual updates — partial state if one fails.",
          "Fix: use a Supabase RPC function that wraps the reorder in a database transaction.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/exercise-reorder-transaction",
        issue: 116,
        scope: {
          owns: ["app/api/admin/programs/"],
          avoid: [],
        },
      },
      {
        id: "11-3",
        title: "Add error boundaries to React app",
        description: [
          "No error boundary components exist. Unhandled errors crash the page (white screen).",
          "Add root-level ErrorBoundary in layout.tsx and per-page error boundaries.",
          "Show 'Something went wrong' UI with retry button.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/error-boundaries",
        issue: 119,
        scope: {
          owns: ["components/ErrorBoundary.tsx", "app/error.tsx", "app/(app)/error.tsx"],
          avoid: [],
        },
      },
    ],
  },

  // ── Phase 12: Core Loop Features ──────────────────────────────────────────
  {
    number: 12,
    title: "Core Loop Features",
    summary: "Program enrollment, post-onboarding flow, database-backed playbook, session history, and exercise videos.",
    parallelizable: true,
    items: [
      {
        id: "12-1",
        title: "Program enrollment UI — Assign Program button",
        description: [
          "Admins must touch the database to enroll athletes into programs.",
          "Add 'Assign Program' button to admin users page with program dropdown.",
          "New endpoint: POST /api/admin/enroll { userId, programId }.",
          "Deactivates current enrollment, creates new user_enrollments row.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/program-enrollment-ui",
        issue: 106,
        scope: {
          owns: ["app/(admin)/users/", "app/api/admin/enroll/"],
          avoid: ["app/(app)/dashboard/", "app/onboarding/"],
        },
      },
      {
        id: "12-2",
        title: "Post-onboarding flow — auto-enroll or prompt",
        description: [
          "After onboarding, athletes hit a blank dashboard with no sessions.",
          "Show 'Getting Started' card if no active enrollment.",
          "Handle the no-enrollment state gracefully.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/post-onboarding-enrollment",
        issue: 107,
        scope: {
          owns: ["app/(app)/dashboard/", "app/onboarding/"],
          avoid: ["app/(admin)/"],
        },
      },
      {
        id: "12-3",
        title: "Make playbook database-backed",
        description: [
          "PlaybookPage has a static PLAYBOOK constant. Coaches can't add/edit without code deploy.",
          "New table: playbook_entries. RLS: coaches/admins CRUD, athletes SELECT.",
          "API: GET/POST/PUT/DELETE /api/coach/playbook.",
          "Update PlaybookPage to fetch from API. Add create/edit UI for coaches.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/playbook-database",
        issue: 108,
        scope: {
          owns: ["app/(coach)/playbook/", "app/api/coach/playbook/", "supabase/migrations/006_playbook_entries.sql"],
          avoid: ["app/(app)/sessions/", "app/(admin)/"],
        },
      },
      {
        id: "12-4",
        title: "Session history view",
        description: [
          "Athletes can see charts but can't browse past workouts.",
          "New page: session history in reverse chronological order with sets/reps/weight.",
          "Backend: GET /api/sessions/history?page=1&limit=20 (paginated).",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/session-history",
        issue: 110,
        scope: {
          owns: ["app/(app)/sessions/history/", "app/api/sessions/history/"],
          avoid: ["app/(app)/sessions/page.tsx", "app/(app)/sessions/SessionCard.tsx"],
        },
      },
      {
        id: "12-5",
        title: "Render exercise video/demo links in session cards",
        description: [
          "video_url column exists on exercises but nothing renders it.",
          "If exercise has video_url, render a video icon/link in SessionCard.",
          "Add sample video URLs to seed data.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/exercise-video-links",
        issue: 109,
        scope: {
          owns: ["app/(app)/sessions/SessionCard.tsx", "app/(app)/sessions/SessionDetailModal.tsx"],
          avoid: ["app/(app)/sessions/page.tsx"],
        },
      },
    ],
  },

  // ── Phase 13: Code Cleanup ────────────────────────────────────────────────
  {
    number: 13,
    title: "Code Cleanup",
    summary: "Decompose oversized components, remove unused packages, add database indexes.",
    parallelizable: true,
    items: [
      {
        id: "13-1",
        title: "Decompose QuickLogModal (600+ lines)",
        description: [
          "QuickLogModal.tsx is 600+ lines with step state machine, muscle group selector, exercise cards,",
          "set row logic, and save orchestration all in one file.",
          "Split into focused components in components/quick-log/ directory.",
          "Must preserve all existing functionality — pure refactor.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "refactor/quick-log-decompose",
        issue: 104,
        scope: {
          owns: ["components/QuickLogModal.tsx", "components/quick-log/"],
          avoid: [],
        },
      },
      {
        id: "13-2",
        title: "Remove unused Drizzle / generated API client packages",
        description: [
          "lib/db/src/schema/index.ts is empty. lib/api-client-react only covers health check.",
          "These packages cause typecheck failures and serve no purpose.",
          "Remove lib/db/, lib/api-client-react/, lib/api-zod/, lib/api-spec/.",
        ].join("\n"),
        status: "not-started",
        tests: false,
        branch: "cleanup/drizzle-decision",
        issue: 118,
        scope: {
          owns: ["lib/db/", "lib/api-client-react/", "lib/api-zod/", "lib/api-spec/"],
          avoid: [],
        },
      },
      {
        id: "13-3",
        title: "Add missing database indexes",
        description: [
          "Missing FK indexes and compound indexes for common query patterns.",
          "Add migration with indexes on template_exercises, set_logs, personal_records, user_enrollments, session_logs.",
        ].join("\n"),
        status: "not-started",
        tests: false,
        branch: "perf/add-database-indexes",
        issue: 105,
        scope: {
          owns: ["supabase/migrations/007_add_indexes.sql"],
          avoid: [],
        },
      },
    ],
  },

  // ── Phase 14: Platform Feel ───────────────────────────────────────────────
  {
    number: 14,
    title: "Platform Feel",
    summary: "Email notifications, admin analytics, CI/CD, and Stripe.",
    parallelizable: true,
    items: [
      {
        id: "14-1",
        title: "Coach note email notifications",
        description: [
          "Athletes only see notes if they open the app.",
          "Supabase Edge Function triggered on coach_notes INSERT.",
          "Send via Resend/SendGrid. Rate limit: 1 email per coach per athlete per hour.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/coach-note-emails",
        issue: 111,
        scope: {
          owns: ["supabase/functions/notify-coach-note/"],
          avoid: [],
        },
      },
      {
        id: "14-2",
        title: "Admin analytics dashboard",
        description: [
          "New admin page: total active athletes, weekly completion rate,",
          "coach workload, new signups. Backend aggregation endpoint.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/admin-analytics",
        issue: 112,
        scope: {
          owns: ["app/(admin)/analytics/", "app/api/admin/analytics/"],
          avoid: [],
        },
      },
      {
        id: "14-3",
        title: "CI/CD pipeline",
        description: [
          "Create .github/workflows/ci.yml: typecheck + build + test on push to main and PRs.",
          "Auto-deploy to Vercel on merge to main.",
        ].join("\n"),
        status: "not-started",
        tests: false,
        branch: "infra/ci-cd-pipeline",
        issue: 113,
        scope: {
          owns: [".github/workflows/ci.yml"],
          avoid: [".github/workflows/claude-feature.yml"],
        },
      },
      {
        id: "14-4",
        title: "Stripe payments — subscription billing",
        description: [
          "Stripe integration for recurring subscriptions.",
          "Webhook handler, billing portal, plan management.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/stripe-payments",
        issue: 114,
        scope: {
          owns: ["app/api/billing/", "app/(app)/billing/"],
          avoid: [],
        },
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
