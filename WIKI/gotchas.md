# BuildBase — Gotchas

Real failures and non-obvious pitfalls. Read before writing any code.

## Next.js 16

### proxy.ts — not middleware.ts
Next.js 16 renamed `middleware.ts` to `proxy.ts`. The exported function must be named `proxy` (not `middleware`). The file already exists at the root — **do not create a new `middleware.ts`**.

```ts
// CORRECT
export async function proxy(request: NextRequest) { ... }

// WRONG — no-op in Next.js 16, will silently be ignored
export function middleware(request: NextRequest) { ... }
```

### params and searchParams are async
In Next.js 16, `params` and `searchParams` passed to page/layout components are Promises. Always `await` them:

```ts
// CORRECT
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// WRONG — params is a Promise, accessing .id directly returns undefined
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id; // undefined in Next.js 16
}
```

### cookies() and headers() are async
```ts
// CORRECT
const cookieStore = await cookies();

// WRONG
const cookieStore = cookies(); // type error in Next.js 16
```

## Supabase

### RLS is the real auth gate
`proxy.ts` redirects unauthenticated users but RLS enforces data access at the DB level. Never skip RLS thinking proxy.ts is enough.

### coach_form_assessments is coach-only
This table must NEVER be queried in user-facing pages. The user sees ONLY the result of `getFormBadge(status)` which returns `"Solid Form ✅"` for `locked_in` and `null` for everything else. The raw `status` value must never reach the client.

### Server client vs browser client
- `lib/supabase/server.ts` — for Server Components, Server Actions, Route Handlers
- `lib/supabase/client.ts` — for Client Components only
- Mixing them up causes auth issues (server client uses cookie store, browser client uses localStorage)

### Service role key bypasses RLS
Only use `SUPABASE_SERVICE_ROLE_KEY` for admin operations in Route Handlers. Never use it in client-side code or Server Components that render user data.

## Tailwind v4

### No tailwind.config.ts
Tailwind v4 is CSS-first. All design tokens live in the `@theme {}` block in `app/globals.css`. **Do not create a `tailwind.config.ts`** — shadcn's `components.json` intentionally has an empty `tailwind.config` path.

### @theme inline vs @theme
Use `@theme` (without `inline`) for custom tokens in the root layer. Only use `@theme inline` inside `@layer` blocks. Getting this wrong causes tokens not to resolve.

### Font references in @theme must be literal
Do NOT use CSS variable references inside `@theme {}` — they resolve at parse time, not runtime:
```css
/* WRONG — circular reference */
--font-sans: var(--font-sans);

/* WRONG — next/font injects this at runtime, @theme can't see it */
--font-sans: var(--font-inter);

/* CORRECT — literal font name */
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
```

## Supabase SSR (cookie handling in proxy.ts)

The proxy must call `supabase.auth.getUser()` (not `getSession()`) to securely refresh the session. `getSession()` reads from the cookie without re-validating — `getUser()` hits the Supabase auth server. Always use `getUser()` in proxy.ts.

## shadcn components

Run `npx shadcn@latest add <component>` to add components — they're copied as source files into `components/ui/`. Check what's already there before adding duplicates.

## Monitor cookie parsing

The kickoff route checks for the monitor cookie by parsing the raw `Cookie` header string. If the cookie name or value ever changes, update both `proxy.ts` and `app/api/monitor/kickoff/route.ts`. The cookie name is in `lib/constants.ts` (`MONITOR_COOKIE = "_bb_ok"`).
