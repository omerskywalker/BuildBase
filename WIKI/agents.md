# BuildBase — Agent Guide

## Your Environment

- **Repo:** `~/Desktop/projects/BuildBase`
- **Node:** 20+ (pnpm 9)
- **Next.js:** 16.2.2 — see gotchas.md for breaking changes
- **TypeScript:** strict mode

## Setup Before Writing Code

```bash
cd ~/Desktop/projects/BuildBase
pnpm install
cp .env.example .env.local
# Fill in Supabase vars in .env.local
```

## Required Completion Steps (before every PR)

```bash
pnpm tsc --noEmit   # must be clean — zero errors
pnpm test           # must pass — all tests green
```

Then update `lib/roadmap-data.ts`:
- Set `status: "in-progress"` for your item when you start
- Set `status: "done"` and `tests: true` when the PR is ready

## Test Requirements

Every batch item needs tests in `tests/` before its PR merges.

Minimum coverage per item:
- **Batch 1 (auth/RBAC):** Test that unauthenticated users are redirected, role checks work
- **Batch 2 (session tracker):** Test `getDefaultWeight()`, `hoursSince()`, soreness prompt trigger logic
- **Batch 3 (phase view):** Test session status calculations (complete/current/upcoming)
- **Batch 4 (coach features):** Test `getFormBadge()` — ensure it NEVER returns raw form status to user
- **Batch 5 (admin):** Test role validation, override application
- **Batch 6 (metrics):** Test PR detection logic, streak calculation
- **Batches 7–8:** Test utility functions and API route response shapes

Coverage target: `lib/**/*.ts` (excludes external API wrappers)

## Key Imports

```ts
// Types
import type { Profile, SessionLog, SetLog, CoachNote } from "@/lib/types";

// Supabase — pick the right one
import { createClient } from "@/lib/supabase/server";  // Server Components
import { createClient } from "@/lib/supabase/client";  // Client Components

// Utils
import { cn, getFormBadge, getDefaultWeight, formatWeight, hoursSince } from "@/lib/utils";

// Constants
import { EFFORT_LABELS, SORENESS_LABELS, SESSIONS_PER_PAGE, SORENESS_PROMPT_GAP_HOURS } from "@/lib/constants";
```

## Supabase Query Patterns

```ts
// Server Component — get current user
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Server Component — get profile with coach check
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

// Never query coach_form_assessments in user-facing components
// Use getFormBadge() instead — it returns "Solid Form ✅" or null
```

## Component Patterns

```tsx
// Server Component with auth check
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // ...
}

// Client Component with optimistic update
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SetRow({ setLog, ... }) {
  const [completed, setCompleted] = useState(setLog.is_completed);
  
  async function toggleSet() {
    setCompleted(true); // optimistic
    const supabase = createClient();
    await supabase.from("set_logs").update({ is_completed: true }).eq("id", setLog.id);
  }
  // ...
}
```

## Adding shadcn Components

```bash
npx shadcn@latest add button card input label dialog sheet badge tabs
```

Components go to `components/ui/`. Check what's already there before adding.
