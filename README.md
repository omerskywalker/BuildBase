#BuildBase

A structured fitness coaching platform for coaches and athletes — built with React, Express, and Supabase.

What it does
BuildBase gives coaches and athletes a shared home for structured training. Coaches build programs, assign them to athletes, and leave form feedback. Athletes log sessions, track progress, and see their trends over time.

For athletes

Dashboard with next session, completion rate, and streak
Quick-log any freestyle workout by muscle group — no program required
Session logging with sets, reps, weight, effort, and soreness prompts
Progress charts and milestone tracking
Coach notes and form feedback visible in-app
For coaches

Client roster with individual drill-down views
Per-exercise form assessments (needs cues / getting there / locked in)
Coach notes pushed directly to athlete dashboards
Program and playbook management
For admins

User management and role assignment
Program creation and administration
Tech stack
Layer	Tech
Frontend	React 19 + Vite, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, Recharts
Routing	wouter (lightweight SPA routing)
Auth & DB	Supabase (Postgres + Row Level Security + Auth)
API	Express 5, Node.js 24, TypeScript
Monorepo	pnpm workspaces
Build	esbuild (API), Vite (frontend)
Project structure
buildbase/
├── artifacts/
│   ├── buildbase/          # React SPA (Vite)
│   │   └── src/
│   │       ├── pages/      # All page components
│   │       ├── components/ # Shared UI components
│   │       └── lib/        # Auth context, API client, types, utils
│   └── api-server/         # Express API server
│       └── src/
│           ├── routes/     # All API route handlers
│           └── lib/        # Supabase server client, auth helpers
└── supabase/
    ├── migrations/         # SQL migration files
    └── seed.sql            # 12-week program seed data

Database (14 tables)
profiles · programs · phases · workout_templates · exercises · template_exercises · user_enrollments · user_exercise_overrides · session_logs · set_logs · personal_records · milestones · coach_form_assessments · coach_notes

Row Level Security is enforced on every table. Athletes can only read/write their own data. Coaches can read client data. Admins have full access. Privilege escalation (role changes, coach reassignment) is blocked by a BEFORE UPDATE trigger.

Getting started
Prerequisites
Node.js 24+
pnpm 9+
A Supabase project
Environment variables
Create the following in your environment (Replit Secrets or .env):

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

Install dependencies
pnpm install

Run locally
# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev
# Start the React SPA (port from $PORT)
pnpm --filter @workspace/buildbase run dev

Typecheck
pnpm run typecheck

Build
pnpm run build

API overview
All routes are under /api/ and require a Supabase Bearer token in the Authorization header.

Method	Route	Description
GET	/api/dashboard	Dashboard summary for current user
GET	/api/sessions	Session list (grouped by week)
POST	/api/sessions	Create a new session log
PATCH	/api/sessions/:id	Update session (complete, effort, soreness)
GET	/api/progress	Progress stats, milestones, trends
POST	/api/quick-log	Log a freestyle workout by muscle group
GET	/api/coach/clients	Coach: list all clients
GET	/api/coach/clients/:id	Coach: client detail
GET	/api/admin/users	Admin: all users
GET	/api/admin/programs	Admin: all programs
Security model
All data access is gated by Supabase RLS policies
SECURITY DEFINER functions (auth_role(), is_my_client()) prevent privilege escalation through policy bypasses
A BEFORE UPDATE trigger on profiles blocks non-admins from changing role, coach_id, or email
The API server verifies the Supabase JWT on every request via getAuthUser()
The frontend never exposes the service role key — only the anon key is used client-side
Color theme
Token	Value
Background	#EDE4D3
Accent (CTA)	#C84B1A
Brand (dark green)	#1C3A2A
Content primary	#2C1A10
Fonts: Inter (body) + Space Grotesk (display headings)
