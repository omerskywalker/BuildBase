# BuildBase — Design System

This document is the visual and interaction contract for every agent and developer building features. Read it before writing any UI. **Non-negotiable** items are marked ⛔.

---

## 1. Visual Identity

BuildBase is a **warm, parchment-toned, athletic** application. The visual language should feel like a sunlit training journal — purposeful, high-contrast brown-on-cream, built for performance, not for decoration. No dark mode. No heavy drop-shadows. No glassmorphism. Forest green and burnt orange are accent colors only, not primary surfaces.

The brand is the combination of two distinct elements:
- **Build** — deep forest green `#1C3A2A`. Steady. Structural.
- **Base** — burnt orange `#C84B1A`. Action. Energy.

```tsx
// ⛔ MUST use this exact treatment everywhere the name appears
<span style={{ color: "#1C3A2A" }}>Build</span>
<span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
```

---

## 2. Color System

### Surfaces (backgrounds — 4 levels)

| Token | Hex | Use when |
|-------|-----|---------|
| `--color-bg-base` | `#EDE4D3` | Page backgrounds, the "floor" (warm parchment) |
| `--color-bg-surface` | `#E5DAC8` | Sidebar, sticky headers, nav |
| `--color-bg-elevated` | `#E8DECE` | Cards, panels, inputs |
| `--color-bg-hover` | `#DDD2BF` | Hover states on clickable surfaces |

⛔ Never go more than one level of elevation in a single card stack. A card inside a card inside a card creates visual mud.

### Content (text)

| Token | Hex | Use when |
|-------|-----|---------|
| `--color-content-primary` | `#2C1A10` | Headings, primary body text (deep brown) |
| `--color-content-secondary` | `#6B5A48` | Supporting copy, labels, subtitles (warm brown) |
| `--color-content-muted` | `#988A78` | Timestamps, metadata, disabled text (soft brown) |

### Borders

| Token | Hex | Use when |
|-------|-----|---------|
| `--color-border-subtle` | `#C8B99D` | Default card borders, dividers |
| `--color-border-strong` | `#B5A68C` | Focus rings, active states |

### Accent and Brand

| Token | Hex | Use when |
|-------|-----|---------|
| `--color-accent` | `#C84B1A` | CTAs, active nav indicator, badges |
| `--color-accent-dim` | `#8C3410` | Hover state of accent elements, bar/rod in logo |
| `--color-brand` | `#1C3A2A` | "Build" text, decorative brand moments |

### Semantic

| Token | Hex | Use when |
|-------|-----|---------|
| `--color-success` | `#2D7A3A` | Completed sessions, set logged confirmation |
| `--color-warning` | `#C08030` | CI pending, soreness alert |
| `--color-error` | `#B83020` | Auth errors, CI failure |
| `--color-info` | `#3060A0` | In-progress badges, PR links |

### Effort Scale (1–5)

```
1 → #D32F2F  🔴 (Easy / didn't even try)
2 → #F57C00  🟠
3 → #FBC02D  🟡
4 → #388E3C  🟢
5 → #1B5E20  💚 (Maxed out)
```

---

## 3. Typography

Two typefaces. That's it.

| Role | Family | When |
|------|--------|------|
| `--font-display` | Space Grotesk | Page titles, section headings, logo, numbers in stats |
| `--font-sans` | Inter | All body text, labels, buttons, nav |

### Scale

```
Page title (h1):    font-display, 22–28px, weight 700
Section heading:    font-display, 16–18px, weight 700
Card heading:       font-display, 14–15px, weight 600
Body:               font-sans,    14–15px, weight 400–500
Label / caption:    font-sans,    12–13px, weight 500
Metadata / mono:    font-mono,    11–12px, weight 400
```

⛔ Never use font-display for body copy — it becomes unreadable at small sizes and lengths.
⛔ Never use `text-transform: uppercase` on body text. It's acceptable only for short status badges (<3 words).

### Line heights

- Headings: 1.2–1.3
- Body: 1.5–1.6
- Labels/metadata: 1.4

---

## 4. Spacing & Density

BuildBase uses **comfortable density** throughout: enough breathing room that the UI feels premium, tight enough that information isn't spread thin.

### Core rhythm: 4px grid

Every spacing value should be a multiple of 4px. Common values:
- `4px` — internal padding on tiny badges
- `8px` — gap between icon and label
- `12px` — inner card padding (compact)
- `16px` — default card padding, section gap
- `24px` — between cards/sections
- `32px` — page-level vertical spacing
- `48px` — large section separators

### Page layout

```
Max content width: 1200px (centered)
Page horizontal padding: 16px mobile / 24px tablet / 32px desktop
Sidebar width: 220px (fixed, left)
Main content: 100% - 220px on lg+
```

---

## 5. Component Patterns

### Cards

The primary container for all content. Three variants:

```
Default:
  background: #E8DECE
  border: 1px solid #C8B99D
  border-radius: 12px
  padding: 20px

Elevated (floating dialog, etc.):
  background: #E5DAC8
  border: 1px solid #B5A68C
  border-radius: 12px
  box-shadow: 0 2px 12px rgba(0,0,0,0.06)

Accent-edge (current session, CTA focus):
  same as Default but with:
  border-left: 3px solid #C84B1A
```

⛔ Don't nest Default cards inside Default cards. Use Elevated for inner containers.

### Buttons

```
Primary (CTA):
  background: #C84B1A
  color: #FEFCF8
  font-weight: 600
  border-radius: 8px
  padding: 11px 20px
  no border
  hover: background #D95520, transform scale(1.01)
  active: transform scale(0.99)
  disabled: opacity 0.4, cursor not-allowed

Secondary:
  background: transparent
  border: 1px solid #B5A68C
  color: #6B5A48
  hover: background #DDD2BF, border-color #C84B1A, color #2C1A10

Ghost:
  background: transparent
  color: #6B5A48
  no border
  hover: color #2C1A10, background rgba(0,0,0,0.04)

Destructive:
  background: rgba(184,48,32,0.12)
  border: 1px solid rgba(184,48,32,0.3)
  color: #B83020
  hover: background rgba(184,48,32,0.2)
```

### Inputs

```
background: #EDE4D3
border: 1px solid #C8B99D
border-radius: 8px
padding: 11px 14px
font-size: 15px
color: #2C1A10
placeholder: #988A78
transition: border-color 0.15s

:focus → border-color: #C84B1A, outline: none
:invalid/:error → border-color: #B83020
```

⛔ Always use `type="password"` with a show/hide toggle for password fields. Never leave a bare password input.
⛔ Always pair inputs with a visible `<label>`. No placeholder-only labels.

### Badges / Status chips

```
Compact pill: padding 2px 8px, border-radius 6px, font-size 11px, font-weight 700
Full chip: padding 4px 12px, border-radius 8px, font-size 12px, font-weight 600

Status colors follow semantic tokens:
  not-started: border-subtle background
  in-progress: info (#3060A0) with 10% opacity background
  done: success (#2D7A3A) with 10% opacity background
  paused: secondary text, muted background
```

### Navigation (Sidebar)

```
Active item:
  background: rgba(200,75,26,0.1)
  border-left: 3px solid #C84B1A
  color: #2C1A10
  icon: accent color

Inactive item:
  background: transparent
  color: #6B5A48
  icon: muted color
  hover: background #DDD2BF, color #2C1A10
```

---

## 6. Chart Design (Recharts)

### Color palette for data series

When multiple series are shown, use this order:
```
Series 1: #C84B1A  (accent/primary)
Series 2: #2D7A3A  (success/green)
Series 3: #3060A0  (info/blue)
Series 4: #C08030  (warning/amber)
Series 5: #6B5A48  (secondary/muted)
```

### Line charts (progress per lift)

```tsx
// Recharts config — use these exact values
<LineChart>
  <CartesianGrid strokeDasharray="3 3" stroke="#C8B99D" vertical={false} />
  <XAxis
    tick={{ fill: "#988A78", fontSize: 11 }}
    axisLine={{ stroke: "#C8B99D" }}
    tickLine={false}
  />
  <YAxis
    tick={{ fill: "#988A78", fontSize: 11 }}
    axisLine={false}
    tickLine={false}
    width={40}
  />
  <Tooltip
    contentStyle={{
      background: "#E8DECE",
      border: "1px solid #C8B99D",
      borderRadius: 8,
      color: "#2C1A10",
      fontSize: 13,
    }}
    cursor={{ stroke: "#B5A68C", strokeDasharray: "4 4" }}
  />
  <Line
    type="monotone"
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 5, fill: "#C84B1A", strokeWidth: 0 }}
  />
</LineChart>
```

### General charting rules

- ⛔ No chart borders on the chart container itself (the card provides the border)
- ⛔ No chart titles inside the SVG — put them above in the card header
- Remove unnecessary grid lines. Horizontal gridlines only.
- Tooltip should always show the exact value + unit (e.g., "135 lbs")
- When showing effort/soreness, use the effort scale colors from §2
- Keep chart height between 200–320px for embedded charts, 400px for full-page

---

## 7. Motion & Animation (framer-motion)

### Principles

1. **Fast and purposeful** — animations should take 150–300ms. Nothing over 400ms for UI transitions.
2. **Spring feels good, ease feels cheap** — use `type: "spring"` with `stiffness: 300, damping: 30` for interactive elements.
3. **Animate layout changes** — use `layout` prop on elements that reorder or resize.
4. **Reveal, don't decorate** — animations should help the user understand what's happening, not show off.

### Standard configs

```ts
// Fade in (page section reveal, card appear)
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
};

// Slide up (bottom sheets, prompts)
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { type: "spring", stiffness: 400, damping: 35 },
};

// Scale tap (buttons, set confirmation)
const scaleTap = {
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 500, damping: 30 },
};

// Stagger children (list of cards, exercise rows)
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};
```

### When to animate

| Element | Animation |
|---------|-----------|
| Page/section mount | `fadeIn` (staggered for lists) |
| Set logged confirmation | Green flash + `scaleTap` on the row |
| Effort/soreness prompt | `slideUp` with `AnimatePresence` |
| Session card collapse/expand | `layout` + height transition |
| Milestone achievement | Burst + `fadeIn` with spring bounce |
| Modal/dialog | `slideUp` + backdrop `fadeIn` |
| Sidebar active indicator | `layout` so it slides between items |

---

## 8. Gestalt Principles Applied

### Proximity
Group related elements tightly and separate unrelated elements with space. In the session tracker:
- All sets for one exercise: `gap: 4px` between rows
- Between exercises: `gap: 16px`
- Between session sections: `gap: 24px`

### Similarity
Consistent visual treatment for the same type of element across all screens:
- All "start action" buttons use the accent orange
- All "completed" states use the success green + strikethrough
- All metadata (dates, IDs, branch names) uses `font-mono` + `content-muted`

### Continuity
The sidebar provides spatial continuity across all pages. The active indicator should animate smoothly between items (use framer-motion `layout` on the highlight).

### Figure/Ground
Cards on `bg-surface` on top of `bg-base` creates clear figure/ground separation. Never use the same background for a card and its container.

### Closure
Progress bars should always show a track (even at 0%) so the user understands what "full" looks like. Empty stats cards should show the outline of what will be there.

---

## 9. Empty, Loading, and Error States

⛔ Every page and component MUST have all three states designed. Never ship a `Loading...` text string or an empty `null` render.

### Loading
```tsx
// Skeleton lines — match the shape of the real content
<div style={{
  height: 16, borderRadius: 4,
  background: "linear-gradient(90deg, #DDD2BF 25%, #D3C8B5 50%, #DDD2BF 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  width: "60%",
}} />
```

Add the shimmer keyframe to globals.css once and reuse everywhere.

### Empty state
```tsx
// Structure: icon + heading + subtext + optional CTA
<div style={{ textAlign: "center", padding: "48px 24px" }}>
  <div style={{ /* icon circle */ }}>
    <DumbbellIcon size={24} color="#988A78" />
  </div>
  <h3>No sessions logged yet</h3>
  <p>Complete your first session to see it here.</p>
  <button>Start Session →</button>
</div>
```

Empty states should be encouraging, not diagnostic. Write copy that tells the user what to do next, not what's missing.

### Error state
```tsx
// Show context-aware message, not a raw error string
<div style={{
  background: "rgba(184,48,32,0.08)",
  border: "1px solid rgba(184,48,32,0.3)",
  borderRadius: 8, padding: "12px 16px",
  color: "#2C1A10", fontSize: 14,
}}>
  <span style={{ color: "#B83020", fontWeight: 600 }}>
    Something went wrong.
  </span>{" "}
  {friendlyMessage}
</div>
```

Never show `error.message` directly to users for auth/network errors. Map known Supabase error codes to friendly messages (see lib/errors.ts — TODO).

---

## 10. Anti-Patterns ⛔

These patterns are explicitly banned. If you see them, fix them.

| Anti-pattern | Why | Instead |
|---|---|---|
| `bg-gradient-to-r from-... to-...` as a card background | Looks generic/cheap | Solid surface colors with thoughtful borders |
| Glassmorphism (`backdrop-blur` + translucent bg) | Bad perf, illegible text | Solid elevated surface |
| Multiple accent colors in one view | Creates visual noise | One accent, one semantic color |
| Nested cards inside cards inside cards | Creates mud | Use `Elevated` card variant, or just spacing |
| `shadow-xl` on everything | Flat design looks stronger | Reserve box-shadow for true floating elements |
| All-caps body text | Hard to read at length | Use weight/color for hierarchy instead |
| Placeholder text as the only label | Bad accessibility | Always have a real `<label>` |
| `onClick={() => router.push(...)}` on a div | Not keyboard accessible | Use `<a>` or `<button>` |
| `display: flex; justify-content: space-between` for form actions | Breaks on mobile | Stack vertically or use gap |
| Coach form assessment data exposed in user views | Security violation | Use `getFormBadge()` only |
| Modifying `lib/roadmap-data.ts` in parallel agent runs | Merge conflicts | Kickoff API manages status |

---

## 11. Page-Level Patterns

### Authenticated app shell

Every page inside `app/(app)/` gets:
- Sidebar (220px fixed left on `lg+`)
- Sticky header (mobile only, 56px)
- Main content area: `px-4 py-6 lg:px-8`

### Form pages (onboarding, settings)

- Max width: `480px` (centered in content area, not full page)
- Use the `Accent-edge` card variant for the active step
- Progress indicator at top for multi-step flows

### Data pages (sessions, progress, coach clients)

- Use a sticky subheader for filters/controls
- Page title + description in a `24px` padded section at top
- Main content in cards below

### Table/list pages (admin users, exercises)

- Full-width table inside a card
- Row hover: `bg-hover`
- Selected row: `accent` left border
- Actions column: always rightmost, `DropdownMenu` for ≥2 actions

---

## 12. Seed Data & Program Structure

The default 12-week program uses this structure:

**3 Phases × 12 weeks × 3 sessions/week = 36 unique workout templates per program**

```
Phase 1 — Foundation (Weeks 1–4):  3×12 reps,  learning movements
Phase 2 — Build      (Weeks 5–8):  4×8  reps,  progressive overload
Phase 3 — Peak       (Weeks 9–12): 5×5  reps,  peak strength

Session A — Lower body:  Squat, Romanian DL, Leg Press, Lunge, Face Pull
Session B — Upper push:  Bench Press, Incline DB, Overhead Press, Tricep Pushdown
Session C — Pull + hinge: Deadlift, Barbell Row, Lat Pulldown, Cable Row, Dips
```

Weight tiers: `pre_baseline` → `default` → `post_baseline` (low → standard → advanced)
Gender split: `_f` (female defaults) and `_m` (male defaults) on every template exercise.
