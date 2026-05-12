# Plan: Lighter Color Palette + Light/Dark Mode Toggle

## Context

The app currently has a beautiful frosted-glass aurora design, but the participant split bars use saturated OKLCH gradients (lightness 0.54–0.66, chroma 0.16–0.20) that produce intense cobalt blue and vivid purple. The design inspiration screenshot shows softer, more pastel tones. Additionally, dark mode infrastructure (`darkMode: ["class"]` in Tailwind) is configured but completely unimplemented — no `.dark` variables, no toggle, no dark-mode component variants.

This change addresses both: soften the palette in light mode, and add full dark mode with a toggle.

---

## Part 1: Lighter Participant Color Palette

**Goal:** Softer, more pastel-feeling split bars and pill badges.

### `frontend/src/lib/participantColors.ts`

Current gradient: `oklch(0.66 0.16 hue)` → `oklch(0.54 0.20 hue+28)` — produces saturated, dark colors.

**Light mode update:**
```ts
// Light mode: higher lightness, lower chroma = soft pastels
oklch(0.80 0.11 hue) → oklch(0.70 0.14 hue+28)
```

**Dark mode variant** (theme-aware export — function takes `isDark: boolean`):
```ts
// Dark mode: slightly lower lightness, slightly higher chroma for visibility on dark bg
oklch(0.72 0.14 hue) → oklch(0.60 0.17 hue+28)
```

Update `participantGradient(index, isDark?)` signature to accept optional dark flag.

**Pill colors** (`PILL_COLORS`) — lighten the text colors and soften backgrounds:
```ts
// Replace saturated blue/violet/green/orange texts with softer hues
text: "#2563eb" → "#3b82f6"  (blue, lighter)
text: "#7c3aed" → "#8b5cf6"  (violet, lighter)
// bg and border opacity can stay similar
```

---

## Part 2: Dark Mode Infrastructure

### New: `frontend/src/contexts/ThemeContext.tsx`

React context that:
- Reads initial theme from `localStorage.getItem('theme')` (falls back to `'light'`)
- Applies/removes `dark` class on `document.documentElement`
- Persists toggle to `localStorage`
- Exports `useTheme()` hook returning `{ theme, toggleTheme }`

### New: `frontend/src/components/ui/ThemeToggle.tsx`

Small icon button (sun/moon) using lucide-react icons (`Sun`, `Moon`).
- `className="h-7 w-7 rounded-full p-1.5 text-foreground/50 hover:text-foreground/80 hover:bg-white/30 transition-colors"`
- Calls `toggleTheme()` from context

### `frontend/src/components/layout/AppShell.tsx`

Wrap root `<div>` with `<ThemeProvider>` from the new context.

### `frontend/src/components/layout/NavBar.tsx`

Add `<ThemeToggle />` to the right side of the nav bar, alongside the existing "Sign out" button.

### `frontend/src/index.css` — Dark Mode CSS Variables

Add a `.dark { ... }` block:
```css
.dark {
  --background: 222 25% 10%;
  --foreground: 220 15% 90%;
  --card: 222 22% 15%;
  --card-foreground: 220 15% 90%;
  --popover: 222 22% 15%;
  --popover-foreground: 220 15% 90%;
  --primary: 222 85% 65%;
  --primary-foreground: 0 0% 100%;
  --secondary: 222 20% 22%;
  --secondary-foreground: 220 15% 90%;
  --muted: 222 20% 20%;
  --muted-foreground: 220 10% 55%;
  --accent: 222 85% 65%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 75% 55%;
  --destructive-foreground: 0 0% 100%;
  --border: 222 20% 25%;
  --input: 222 20% 22%;
  --ring: 222 85% 65%;
  --surface: 222 22% 15%;
  --surface-elevated: 222 22% 18%;
}
```

Also add dark glass classes:
```css
.dark .glass-card {
  background: rgba(20, 30, 55, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 8px 30px -12px rgba(0, 0, 0, 0.5),
    0 24px 50px -18px rgba(0, 0, 0, 0.35);
}
.dark .glass-card-hover:hover {
  background: rgba(25, 38, 68, 0.68);
}
.dark .glass-pill {
  background: rgba(20, 30, 55, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.09);
}
```

Also remove the unused `--nav` and `--nav-foreground` variables from `:root`.

### `frontend/src/components/layout/AuroraBackground.tsx`

Add dark mode orbs. Use `useTheme()` to switch between two orb configs:

**Light orbs (current):**
- Peach `#ffc8b0`, Blue `#c5d8ff`, Green `#cdf3df`, Purple `#f3cef7`
- Background: `radial-gradient(120% 90% at 50% 0%, #fff4ec 0%, #f0e8ff 55%, #e6f1ff 100%)`

**Dark orbs (new):**
- Deep blue `#0a1f4e`, Deep purple `#2a0f4a`, Deep teal `#053d2d`, Deep rust `#3d1205`
- Background: `radial-gradient(120% 90% at 50% 0%, #0d1220 0%, #12082a 55%, #080e1e 100%)`

### `frontend/src/components/instances/FieldValueRow.tsx`

Three hardcoded light-mode RGBA values to fix with `useTheme()`:

| Location | Light | Dark |
|---|---|---|
| Split bar empty track | `rgba(28,22,46,0.05)` | `rgba(255,255,255,0.08)` |
| "Paid by" pill bg | `rgba(31,154,107,0.09)` | `rgba(31,154,107,0.18)` |
| "Paid by" pill text | `#1a7a55` | `#34d399` |
| Form edit area bg | `rgba(255,255,255,0.65)` | `rgba(20,30,55,0.65)` |

### `frontend/src/components/instances/ParticipantTotalsBar.tsx`

Net amount colors:
- Light: `net <= 0 ? "#059669" : "#c2410c"`
- Dark: `net <= 0 ? "#34d399" : "#fb923c"`

Use `useTheme()` and ternary to switch.

---

## File Summary

| File | Change |
|---|---|
| `frontend/src/lib/participantColors.ts` | Lighter OKLCH values; dark mode variant |
| `frontend/src/index.css` | `.dark {}` CSS vars + `.dark .glass-*` classes; remove unused `--nav` |
| `frontend/src/contexts/ThemeContext.tsx` | **NEW** — ThemeProvider + useTheme |
| `frontend/src/components/ui/ThemeToggle.tsx` | **NEW** — Sun/Moon toggle button |
| `frontend/src/components/layout/AppShell.tsx` | Wrap with ThemeProvider |
| `frontend/src/components/layout/NavBar.tsx` | Add ThemeToggle to nav right side |
| `frontend/src/components/layout/AuroraBackground.tsx` | Theme-aware orb colors |
| `frontend/src/components/instances/FieldValueRow.tsx` | Theme-aware hardcoded RGBA values |
| `frontend/src/components/instances/ParticipantTotalsBar.tsx` | Theme-aware net amount colors |

---

## Verification

1. **Light mode**: Run `npm run dev`, confirm split bars are noticeably softer/lighter pastels
2. **Toggle**: Click sun/moon icon in nav — page switches to dark instantly, no flash
3. **Persistence**: Refresh in dark mode — stays dark (localStorage)
4. **Dark glass cards**: Cards appear as dark frosted glass, not white
5. **Dark aurora**: Background shifts to deep blue-purple with dark glowing orbs
6. **Dark split bars**: Participant gradients visible and readable on dark background
7. **Pill and net colors**: "Paid by" pills and net amounts readable in both modes
