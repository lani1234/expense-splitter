# Plan: UI Polish — More Color, Better Contrast, iPad-Centered Layout

## Context

The current light theme has too little contrast (near-white cards on near-white background), the content spans too wide for a polished app feel, and entry rows feel visually sparse. The goal is to match the reference screenshot's feel: vivid blue backgrounds, white cards that clearly "float," centered iPad-width content, and colorful data elements.

---

## Changes

### 1. `frontend/src/index.css` — Richer background + card shadows

Deepen the page background from barely-tinted white to a clearly medium blue so white cards pop:

```css
--background: 224 60% 90%;        /* Medium blue — #C8D4F6 range */
--surface-elevated: 224 30% 95%;   /* Subtle blue tint for hover states */
```

Add a global card shadow rule so every `bg-surface` card lifts off the background:

```css
/* In @layer base */
.bg-surface {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06);
}
```

### 2. `frontend/src/components/layout/AppShell.tsx` — Narrower, centered layout

- `max-w-5xl` → `max-w-3xl` on both `<main>` and the NavBar inner `<div>`
- This brings content to 768px wide — an iPad-like column

### 3. `frontend/src/components/layout/NavBar.tsx` — Match narrower width

- Change `max-w-5xl` → `max-w-3xl` to keep nav aligned with content

### 4. `frontend/src/components/instances/ParticipantTotalsBar.tsx` — Colorful tiles

Replace the flat `bg-surface-elevated` tiles with per-participant color accents cycling through 4 vivid color pairs (matching the screenshot's colorful summary cards):

```tsx
const TILE_COLORS = [
  { bg: "bg-blue-50 border-blue-200",       amount: "text-blue-600"   },
  { bg: "bg-violet-50 border-violet-200",   amount: "text-violet-600" },
  { bg: "bg-emerald-50 border-emerald-200", amount: "text-emerald-600" },
  { bg: "bg-orange-50 border-orange-200",   amount: "text-orange-600"  },
]
```

Apply `shadow-sm` to each tile. Tile container gets `rounded-xl border` instead of just a background.

### 5. `frontend/src/components/instances/FieldSection.tsx` — Card contrast

Add `shadow-sm` to the field box:
```
rounded-lg border border-border bg-surface overflow-hidden shadow-sm
```

Add a colored left accent border to the section header label:
```tsx
<h3 className="font-semibold text-foreground pl-2 border-l-2 border-primary">{field.label}</h3>
```

### 6. `frontend/src/components/instances/FieldValueRow.tsx` — Fix row spread

Remove the fixed `w-28` from the amount span — replace with `shrink-0 tabular-nums` so it sizes naturally, letting the row feel compact:

```tsx
<span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
  ${fieldValue.amount.toFixed(2)}
</span>
```

### 7. `frontend/src/components/instances/InstanceCard.tsx` — Lift cards

Add `shadow-sm` to the card: `bg-surface border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all`

### 8. `frontend/src/components/templates/TemplateCard.tsx` — Lift cards

Same treatment: add `shadow-sm` and `hover:shadow-md` to the card.

### 9. `frontend/src/pages/InstanceDetailPage.tsx` — Settle button color

Make the Settle button a vivid green to stand out:

```tsx
<Button size="sm" onClick={handleSettle} className="bg-emerald-500 hover:bg-emerald-600 text-white">
```

---

## Critical Files

- `frontend/src/index.css`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/layout/NavBar.tsx`
- `frontend/src/components/instances/ParticipantTotalsBar.tsx`
- `frontend/src/components/instances/FieldSection.tsx`
- `frontend/src/components/instances/FieldValueRow.tsx`
- `frontend/src/components/instances/InstanceCard.tsx`
- `frontend/src/components/templates/TemplateCard.tsx`
- `frontend/src/pages/InstanceDetailPage.tsx`

---

## Verification

1. `cd frontend && npm run dev`
2. Templates page: cards should visibly float on a blue background with shadows
3. Active instances page: same card lift effect
4. Instance detail: participant tiles should be colorful; field rows should no longer feel stretched; field section boxes should stand out
5. Resize window to ~800px — content should stay centered and tight, not spread edge-to-edge
