# BuildBase

A structured fitness coaching platform for coaches and athletes — built with React, Express, and Supabase.

---

## What it does

BuildBase gives coaches and athletes a shared home for structured training. Coaches build programs, assign them to athletes, and leave form feedback. Athletes log sessions, track progress, and see their trends over time.

**For athletes**
- Dashboard with next session, completion rate, and streak
- Quick-log any freestyle workout by muscle group — no program required
- Session logging with sets, reps, weight, effort, and soreness prompts
- Progress charts and milestone tracking
- Coach notes and form feedback visible in-app

**For coaches**
- Client roster with individual drill-down views
- Per-exercise form assessments (needs cues / getting there / locked in)
- Coach notes pushed directly to athlete dashboards
- Program and playbook management

**For admins**
- User management and role assignment
- Program creation and administration

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts |
| Auth & DB | Supabase (Postgres + Row Level Security + Auth) |
| State | React Query (server), Zustand (client) |
| Payments | Stripe |
| Hosting | Vercel |

---

## Project structure

```
buildbase/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected athlete routes (dashboard, sessions, progress)
│   ├── (auth)/             # Login, signup, password reset
│   ├── (admin)/            # Admin routes (users, programs, overrides, analytics)
│   ├── (coach)/            # Coach routes (clients, playbook)
│   ├── api/                # API route handlers
│   └── monitor/            # PIN-gated roadmap monitor
├── components/             # Shared React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Header, Sidebar
│   └── quick-log/          # QuickLogModal sub-components
├── lib/                    # Utilities, types, Supabase clients, validations
└── supabase/
    ├── migrations/         # SQL migration files
    └── seed.sql            # 12-week program seed data
```

---

## Database (14 tables)

`profiles` · `programs` · `phases` · `workout_templates` · `exercises` · `template_exercises` · `user_enrollments` · `user_exercise_overrides` · `session_logs` · `set_logs` · `personal_records` · `milestones` · `coach_form_assessments` · `coach_notes`

Row Level Security is enforced on every table. Athletes can only read/write their own data. Coaches can read client data. Admins have full access. Privilege escalation (role changes, coach reassignment) is blocked by a BEFORE UPDATE trigger.

---

## Getting started

### Prerequisites

- Node.js 24+
- pnpm 9+
- A [Supabase](https://supabase.com) project

### Environment variables

Copy `.env.local.example` or set these in your environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Install & run

```bash
pnpm install
pnpm dev          # Next.js dev server
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm build        # production build
```

---

## API overview

All routes are Next.js Route Handlers under `/api/`. Auth is handled via Supabase session cookies (set by `proxy.ts`).

| Method | Route | Description |
|---|---|---|
| GET | `/api/sessions` | Session list (grouped by week) |
| POST | `/api/sessions` | Create a new session log |
| PATCH | `/api/sessions/:id/complete` | Mark session complete |
| POST | `/api/sessions/:id/effort` | Record effort score |
| POST | `/api/sessions/:id/soreness` | Record soreness score |
| GET | `/api/sessions/history` | Paginated session history |
| POST | `/api/quick-log` | Log a freestyle workout by muscle group |
| GET | `/api/progress/charts` | Per-exercise chart data |
| GET/POST | `/api/coach/notes` | Coach notes CRUD |
| GET/POST/PUT/DELETE | `/api/coach/playbook` | Playbook entries CRUD |
| POST | `/api/coach/form-assessment` | Form assessment upsert |
| GET/POST | `/api/admin/users` | User management |
| POST | `/api/admin/enroll` | Enroll user in program |
| GET/POST | `/api/admin/programs` | Program management |
| GET/POST | `/api/admin/analytics` | Admin analytics |
| POST | `/api/billing/webhook` | Stripe webhook handler |

---

## Security model

- All data access is gated by Supabase RLS policies
- `SECURITY DEFINER` functions (`auth_role()`, `is_my_client()`) prevent privilege escalation through policy bypasses
- A BEFORE UPDATE trigger on `profiles` blocks non-admins from changing `role`, `coach_id`, or `email`
- `proxy.ts` enforces auth gates and role-based route access (defense-in-depth — RLS is the real gate)
- The frontend never exposes the service role key — only the anon key is used client-side

---

## Color theme

| Token | Value |
|---|---|
| Background | `#EDE4D3` |
| Accent (CTA) | `#C84B1A` |
| Brand (dark green) | `#1C3A2A` |
| Content primary | `#2C1A10` |

Fonts: **Inter** (body) + **Space Grotesk** (display headings)

---

## License

Private — all rights reserved.
