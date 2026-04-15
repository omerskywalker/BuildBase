<!-- BEGIN:nextjs-agent-rules -->
# This is Next.js 16 — not the version you know

Breaking changes from Next.js 14/15:
- **`middleware.ts` is now `proxy.ts`** — export function must be named `proxy`, not `middleware`
- **`params` and `searchParams` are async** — always `await params` in page/layout components
- **`cookies()` and `headers()` are async** — always `await cookies()` in server components
- Read `node_modules/next/dist/docs/` before writing any Next.js-specific code
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-stack -->
# UI Library Stack

Installed and ready — prefer these over custom implementations:

- **shadcn/ui** — components in `components/ui/`. Add with `npx shadcn@latest add <component>`. Style: base-nova.
- **lucide-react** — icons. `import { Dumbbell, ChevronRight } from 'lucide-react'`
- **recharts** — charts. Use for progress/metrics charts.
- **framer-motion** — animations. Use for session collapse, prompt slide-up, milestone burst.
- **dnd-kit** — drag-and-drop. Use for workout template editor (Batch 7).
- **sonner** — toasts. Already in layout. `import { toast } from 'sonner'`
- **@tanstack/react-query** — server state. Use for client-side data fetching.
- **zustand** — client state. Use for UI state (open panels, optimistic updates).
<!-- END:ui-stack -->

<!-- BEGIN:supabase-rules -->
# Supabase Rules

- **Browser client:** `import { createClient } from '@/lib/supabase/client'` (use in Client Components)
- **Server client:** `import { createClient } from '@/lib/supabase/server'` (use in Server Components, Route Handlers, Server Actions)
- **Never** use the service role key in client-side code — it bypasses RLS
- **RLS is the real auth gate** — proxy.ts is defense-in-depth, not the sole protection
- **Never** expose `coach_form_assessments` data to the user role — coach-only table
<!-- END:supabase-rules -->
