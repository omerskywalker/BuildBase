export type ItemStatus = "not-started" | "in-progress" | "done" | "paused" | "failed";

export interface ItemScope {
  owns: string[];
  avoid: string[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: ItemStatus;
  tests: boolean;
  branch?: string;
  pr?: number;
  issue?: number;
  scope?: ItemScope;
}

export interface RoadmapBatch {
  number: number;
  title: string;
  summary: string;
  parallelizable: boolean;
  items: RoadmapItem[];
}

export const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "omerskywalker/BuildBase";

export const ROADMAP: RoadmapBatch[] = [
  // ── Phase 1: Stop Lying to Users ──────────────────────────────────────────
  // Critical bugs that cause data loss or false feedback. Do these first, sequentially.
  {
    number: 1,
    title: "Stop Lying to Users",
    summary: "Fix the critical bugs that silently lose workout data and show false success messages.",
    parallelizable: false,
    items: [
      {
        id: "1-1",
        title: "Fix quick-log persistence — session_logs NOT NULL constraint",
        description: [
          "session_logs.week_number and session_number are NOT NULL but the quick-log API sends neither.",
          "Add a migration: ALTER TABLE session_logs ALTER COLUMN week_number SET DEFAULT 0; same for session_number.",
          "Verify the quick-log route (artifacts/api-server/src/routes/quick-log.ts) inserts successfully after the migration.",
          "Add a test that POSTs to /api/quick-log and asserts the session_log row exists with week_number=0.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/quick-log-persistence",
        issue: 97,
        scope: {
          owns: [
            "supabase/migrations/004_quick_log_defaults.sql",
            "artifacts/api-server/src/routes/quick-log.ts",
          ],
          avoid: ["artifacts/buildbase/src/components/QuickLogModal.tsx"],
        },
      },
      {
        id: "1-2",
        title: "Fix QuickLogModal false success on save failure",
        description: [
          "QuickLogModal.tsx:560-562 catch block sets setSaved(true) even on failure — user sees 'Workout Saved!' when nothing was recorded.",
          "Also line 548-549 never checks response.ok.",
          "Fix: check response.ok after fetch, throw on non-2xx. In catch block, show toast.error() instead of setSaved(true). Keep modal open for retry.",
          "Depends on #97 being merged first (otherwise all quick-logs fail).",
          "Add a test that mocks a failed API response and asserts the error toast appears.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/quick-log-false-success",
        issue: 98,
        scope: {
          owns: ["artifacts/buildbase/src/components/QuickLogModal.tsx"],
          avoid: ["artifacts/api-server/src/routes/quick-log.ts"],
        },
      },
      {
        id: "1-3",
        title: "Add apiFetchJson wrapper — surface API failures as toasts",
        description: [
          "apiFetch() in artifacts/buildbase/src/lib/api.ts returns raw Response. 6+ callers skip response.ok check.",
          "Create apiFetchJson<T>() that checks .ok, parses JSON, and throws ApiError on failure.",
          "Migrate all callers that currently do .then(r => r.json()) without checking .ok:",
          "  CoachNotesPage, MilestonesPage, TrendsPage, ProgressPage, ChartsPage, ClientsPage,",
          "  SorenessPrompt, EffortPrompt, SessionCard (fire-and-forget calls).",
          "Each migrated caller should catch and show toast.error().",
          "Add tests for the apiFetchJson wrapper (success path, error path, network failure).",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/api-error-handling",
        issue: 99,
        scope: {
          owns: ["artifacts/buildbase/src/lib/api.ts"],
          avoid: ["artifacts/api-server/"],
        },
      },
    ],
  },

  // ── Phase 2: Backend Hardening ────────────────────────────────────────────
  // Security and reliability fixes on the Express API. Most touch separate route files.
  {
    number: 2,
    title: "Backend Hardening",
    summary: "Stop leaking errors, validate inputs, lock down CORS, and actually use the logger.",
    parallelizable: true,
    items: [
      {
        id: "2-1",
        title: "Stop leaking database error messages to clients",
        description: [
          "sessions.ts returns raw error.message from Supabase in 7 places (lines 144, 166, 187, 226, 304, 329, 354).",
          "This exposes table names, column names, and constraint names to clients.",
          "Replace all error.message responses with generic messages.",
          "Import logger from ../lib/logger.ts (currently never imported in ANY route file) and log the actual error server-side.",
          "Standardize error response shape: { error: string } across all routes.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/sanitize-error-responses",
        issue: 100,
        scope: {
          owns: ["artifacts/api-server/src/routes/sessions.ts"],
          avoid: [
            "artifacts/api-server/src/routes/admin.ts",
            "artifacts/api-server/src/routes/coach.ts",
            "artifacts/api-server/src/routes/quick-log.ts",
          ],
        },
      },
      {
        id: "2-2",
        title: "Verify update row counts — silent no-ops on sessions",
        description: [
          "POST /sessions/:id/complete, /effort, /soreness check for Supabase errors but don't verify the update affected rows.",
          "If target row doesn't exist (wrong ID, RLS blocks), response is { ok: true } — a silent no-op.",
          "Also DELETE /admin/users doesn't confirm update succeeded.",
          "Fix: use .select('id').single() after .update() and check returned data.",
          "Return 404 if no rows affected.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/verify-update-row-counts",
        issue: 101,
        scope: {
          owns: [
            "artifacts/api-server/src/routes/sessions.ts",
            "artifacts/api-server/src/routes/admin.ts",
          ],
          avoid: ["artifacts/api-server/src/routes/coach.ts"],
        },
      },
      {
        id: "2-3",
        title: "Add JSON body size limit and CORS origin allowlist",
        description: [
          "app.ts uses express.json() with no limit option — attacker can send multi-GB payload.",
          "cors() uses default config (allows all origins).",
          "Fix: express.json({ limit: '1mb' }), cors({ origin: process.env.FRONTEND_URL, credentials: true }).",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/request-limits-cors",
        issue: 102,
        scope: {
          owns: ["artifacts/api-server/src/app.ts"],
          avoid: ["artifacts/api-server/src/routes/"],
        },
      },
      {
        id: "2-4",
        title: "Use logger in all route files",
        description: [
          "lib/logger.ts exists and is properly defined but is NEVER imported in any route file.",
          "All server-side errors are silently returned to clients without being logged.",
          "Import and use logger in every route file for error cases and key operations.",
          "This is a cross-cutting change — touch all route files.",
        ].join("\n"),
        status: "not-started",
        tests: false,
        branch: "fix/add-server-logging",
        issue: 115,
        scope: {
          owns: [
            "artifacts/api-server/src/routes/admin.ts",
            "artifacts/api-server/src/routes/coach.ts",
            "artifacts/api-server/src/routes/dashboard.ts",
            "artifacts/api-server/src/routes/progress.ts",
            "artifacts/api-server/src/routes/quick-log.ts",
          ],
          avoid: [],
        },
      },
      {
        id: "2-5",
        title: "Add RLS INSERT policy for coach_form_assessments",
        description: [
          "schema.sql:412-416 defines SELECT/ALL policies for coach_form_assessments but no explicit INSERT WITH CHECK.",
          "Coaches may be unable to insert new form assessments.",
          "Add migration with: CREATE POLICY form_assessments_coach_insert ON coach_form_assessments FOR INSERT WITH CHECK (coach_id = auth.uid());",
        ].join("\n"),
        status: "not-started",
        tests: false,
        branch: "fix/form-assessment-rls",
        issue: 120,
        scope: {
          owns: ["supabase/migrations/005_form_assessment_rls.sql"],
          avoid: [],
        },
      },
    ],
  },

  // ── Phase 3: Data Quality & Resilience ────────────────────────────────────
  {
    number: 3,
    title: "Data Quality & Resilience",
    summary: "Input validation, seed data fixes, transaction safety, and React error boundaries.",
    parallelizable: true,
    items: [
      {
        id: "3-1",
        title: "Validate input on admin exercise/user creation routes",
        description: [
          "No length limits on text fields (exercise names, descriptions, coaching cues).",
          "No range validation on numeric inputs (reps_completed, weight_used accept negatives).",
          "No URL format validation on video_url (could accept javascript: URIs).",
          "Search string unbounded in admin.ts:470.",
          "Add Zod validation (api-zod package already exists in workspace).",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/input-validation",
        issue: 103,
        scope: {
          owns: [
            "artifacts/api-server/src/routes/admin.ts",
            "artifacts/api-server/src/routes/sessions.ts",
          ],
          avoid: [],
        },
      },
      {
        id: "3-2",
        title: "Fix seed data: weights and plank reps",
        description: [
          "Female post-baseline weights set to 0 — athletes who complete baseline would see weights drop to 0.",
          "Plank has reps_default=0 (time hold), UI shows '0 reps'.",
          "Phase 3 deadlift starts at 65 lbs (f) but Phase 1 trap bar deadlift starts at 45 — backwards progression.",
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
        id: "3-3",
        title: "Exercise reorder: use transaction instead of Promise.all",
        description: [
          "admin.ts:443-447 reorders exercises via Promise.all with individual updates.",
          "If one update fails, partial state is left with no rollback.",
          "Fix: use a Supabase RPC function that wraps the reorder in a database transaction.",
          "Or at minimum, catch individual failures and report which ones failed.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "fix/exercise-reorder-transaction",
        issue: 116,
        scope: {
          owns: ["artifacts/api-server/src/routes/admin.ts"],
          avoid: [],
        },
      },
      {
        id: "3-4",
        title: "Add error boundaries to React app",
        description: [
          "No error boundary components exist. Unhandled errors crash the entire page (white screen).",
          "Add a root-level ErrorBoundary wrapping the app.",
          "Add per-page error boundaries for graceful degradation.",
          "Show 'Something went wrong' UI with retry button.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/error-boundaries",
        issue: 119,
        scope: {
          owns: [
            "artifacts/buildbase/src/components/ErrorBoundary.tsx",
            "artifacts/buildbase/src/App.tsx",
          ],
          avoid: [],
        },
      },
    ],
  },

  // ── Phase 4: Core Loop Features ───────────────────────────────────────────
  // Features that complete the core product loop. Parallelizable with scope contracts.
  {
    number: 4,
    title: "Core Loop Features",
    summary: "Program enrollment, post-onboarding flow, database-backed playbook, session history, and exercise videos.",
    parallelizable: true,
    items: [
      {
        id: "4-1",
        title: "Program enrollment UI — Assign Program button",
        description: [
          "Admins currently must touch the database to enroll athletes into programs.",
          "Add 'Assign Program' button to AdminUsersPage with program dropdown.",
          "New endpoint: POST /api/admin/enroll { userId, programId }.",
          "Deactivates any current enrollment, creates new user_enrollments row.",
          "Show confirmation toast.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/program-enrollment-ui",
        issue: 106,
        scope: {
          owns: [
            "artifacts/api-server/src/routes/admin.ts",
            "artifacts/buildbase/src/pages/admin/AdminUsersPage.tsx",
          ],
          avoid: [
            "artifacts/buildbase/src/pages/DashboardPage.tsx",
            "artifacts/buildbase/src/pages/OnboardingPage.tsx",
          ],
        },
      },
      {
        id: "4-2",
        title: "Post-onboarding flow — auto-enroll or prompt",
        description: [
          "After onboarding, athletes hit a blank dashboard with no sessions or progress.",
          "Check if user has active enrollment after onboarding completes.",
          "If not, show 'Getting Started' card on dashboard.",
          "Handle the no-enrollment state gracefully instead of showing empty sections.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/post-onboarding-enrollment",
        issue: 107,
        scope: {
          owns: [
            "artifacts/buildbase/src/pages/DashboardPage.tsx",
            "artifacts/buildbase/src/pages/OnboardingPage.tsx",
          ],
          avoid: ["artifacts/buildbase/src/pages/admin/"],
        },
      },
      {
        id: "4-3",
        title: "Make playbook database-backed",
        description: [
          "PlaybookPage.tsx has a static PLAYBOOK constant. Coaches can't add/edit without a code deploy.",
          "New table: playbook_entries (id, title, category, content, created_by, is_active, order_index, timestamps).",
          "RLS: coaches/admins can CRUD, athletes can SELECT.",
          "API endpoints: GET/POST/PUT/DELETE /api/coach/playbook.",
          "Update PlaybookPage.tsx to fetch from API.",
          "Add create/edit UI for coaches.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/playbook-database",
        issue: 108,
        scope: {
          owns: [
            "artifacts/buildbase/src/pages/coach/PlaybookPage.tsx",
            "artifacts/api-server/src/routes/coach.ts",
            "supabase/migrations/006_playbook_entries.sql",
          ],
          avoid: [
            "artifacts/buildbase/src/pages/sessions/",
            "artifacts/buildbase/src/pages/admin/",
          ],
        },
      },
      {
        id: "4-4",
        title: "Session history view",
        description: [
          "Athletes can see charts but can't browse past workouts.",
          "New page or tab: session history in reverse chronological order.",
          "Each entry: date, workout name, exercises with sets/reps/weight.",
          "Expandable/collapsible detail per session.",
          "Backend: GET /api/sessions/history?page=1&limit=20 (paginated).",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/session-history",
        issue: 110,
        scope: {
          owns: [
            "artifacts/buildbase/src/pages/sessions/SessionHistoryPage.tsx",
            "artifacts/api-server/src/routes/sessions.ts",
          ],
          avoid: [
            "artifacts/buildbase/src/pages/sessions/SessionsPage.tsx",
            "artifacts/buildbase/src/pages/sessions/SessionCard.tsx",
          ],
        },
      },
      {
        id: "4-5",
        title: "Render exercise video/demo links in session cards",
        description: [
          "video_url column exists on exercises (schema.sql:77) and is typed (types.ts:61) but nothing renders it.",
          "In SessionCard or SessionDetailModal, if exercise has video_url, render a video icon/link.",
          "Clicking opens embedded player (YouTube iframe) or external link.",
          "Add sample video URLs to seed data for key exercises.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/exercise-video-links",
        issue: 109,
        scope: {
          owns: [
            "artifacts/buildbase/src/pages/sessions/SessionCard.tsx",
            "artifacts/buildbase/src/pages/sessions/SessionDetailModal.tsx",
          ],
          avoid: ["artifacts/buildbase/src/pages/sessions/SessionsPage.tsx"],
        },
      },
    ],
  },

  // ── Phase 5: Code Cleanup ─────────────────────────────────────────────────
  {
    number: 5,
    title: "Code Cleanup",
    summary: "Decompose oversized components, remove unused packages, add database indexes.",
    parallelizable: true,
    items: [
      {
        id: "5-1",
        title: "Decompose QuickLogModal (613 lines)",
        description: [
          "QuickLogModal.tsx is 613 lines with step state machine, muscle group selector, exercise cards,",
          "set row logic, and save orchestration all in one file.",
          "Split into: QuickLogModal (shell), MuscleGroupStep, ExerciseLogStep,",
          "QuickLogExerciseCard, QuickLogSetRow, QuickLogSummary, useQuickLogSave hook.",
          "Place in artifacts/buildbase/src/components/quick-log/ directory.",
          "Must preserve all existing functionality — this is a pure refactor.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "refactor/quick-log-decompose",
        issue: 104,
        scope: {
          owns: [
            "artifacts/buildbase/src/components/QuickLogModal.tsx",
            "artifacts/buildbase/src/components/quick-log/",
          ],
          avoid: [],
        },
      },
      {
        id: "5-2",
        title: "Remove unused Drizzle / generated API client",
        description: [
          "lib/db/src/schema/index.ts is completely empty. Drizzle is installed but defines zero tables.",
          "lib/api-client-react generated client only covers health check — doesn't match actual API.",
          "lib/api-zod generated types same issue.",
          "lib/api-spec OpenAPI spec only defines GET /healthz.",
          "Remove these packages or document the decision to adopt them later.",
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
        id: "5-3",
        title: "Add missing database indexes",
        description: [
          "Missing indexes on frequently-joined FK columns and common query patterns.",
          "Add: idx_template_exercises_exercise_id, idx_set_logs_exercise_id,",
          "idx_personal_records_exercise_id, idx_user_enrollments_program_id,",
          "idx_session_logs_user_week, idx_set_logs_session_exercise,",
          "idx_template_exercises_ordering, idx_form_assessments_user_exercise.",
          "Also refactor progress.ts .in() fallback to use a subquery instead of passing all session IDs.",
        ].join("\n"),
        status: "not-started",
        tests: false,
        branch: "perf/add-database-indexes",
        issue: 105,
        scope: {
          owns: [
            "supabase/migrations/007_add_indexes.sql",
            "artifacts/api-server/src/routes/progress.ts",
          ],
          avoid: [],
        },
      },
    ],
  },

  // ── Phase 6: Platform Feel ────────────────────────────────────────────────
  {
    number: 6,
    title: "Platform Feel",
    summary: "Email notifications, admin analytics, CI/CD, and Stripe — the features that make it a real product.",
    parallelizable: true,
    items: [
      {
        id: "6-1",
        title: "Coach note email notifications",
        description: [
          "Athletes only see notes if they open the app. Email on coach_notes INSERT would drive engagement.",
          "Supabase Edge Function triggered on INSERT.",
          "Send via Resend or SendGrid (free tier). Email: coach name, note preview, link to app.",
          "Add email_notifications preference to profiles (default: on).",
          "Rate limit: max 1 email per coach per athlete per hour.",
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
        id: "6-2",
        title: "Admin analytics dashboard",
        description: [
          "Admins have zero visibility into platform usage.",
          "New admin page with: total active athletes, weekly completion rate,",
          "coach workload (clients/coach, notes/week), new signups.",
          "Backend: GET /api/admin/analytics aggregation endpoint.",
          "Charts using Recharts.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/admin-analytics",
        issue: 112,
        scope: {
          owns: [
            "artifacts/buildbase/src/pages/admin/AdminAnalyticsPage.tsx",
            "artifacts/api-server/src/routes/admin.ts",
          ],
          avoid: [],
        },
      },
      {
        id: "6-3",
        title: "CI/CD pipeline",
        description: [
          "No automated checks on push. Broken types can land on main.",
          "Create .github/workflows/ci.yml: trigger on push to main and PRs,",
          "run pnpm install, pnpm run typecheck, pnpm run build.",
          "Auto-deploy to Vercel on merge to main.",
          "Add Prettier lint step (already a devDep).",
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
        id: "6-4",
        title: "Stripe payments — subscription billing",
        description: [
          "Subscription layer for coach/athlete billing.",
          "Stripe integration for recurring subscriptions.",
          "Webhook handler for subscription lifecycle events.",
          "Billing portal, invoice history, plan management.",
          "Requires business model decision first.",
        ].join("\n"),
        status: "not-started",
        tests: true,
        branch: "feat/stripe-payments",
        issue: 114,
        scope: {
          owns: [
            "artifacts/api-server/src/routes/billing.ts",
            "artifacts/buildbase/src/pages/BillingPage.tsx",
          ],
          avoid: [],
        },
      },
    ],
  },
];

// ── Progress helpers ──────────────────────────────────────────────────────────

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
