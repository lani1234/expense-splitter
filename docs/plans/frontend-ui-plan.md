# Frontend UI Plan — Expense Splitter

## Context
The backend (Spring Boot / PostgreSQL) is fully built with REST endpoints for templates, instances, field values, and participant entry amounts. The `frontend/` directory exists but is empty (only `.vite` and `node_modules`). This plan bootstraps the Vite + React frontend from scratch and implements the full UI as described.

---

## Tech Stack
- **Vite + React + TypeScript** — project scaffold via `npm create vite@latest`
- **shadcn/ui + Tailwind CSS** — component library (copy-paste, Radix UI primitives)
- **TanStack Query (React Query v5)** — server state management, caching, mutations
- **React Router v6** — SPA routing via `createBrowserRouter`
- **Axios** — HTTP client with response unwrapping middleware
- **No auth** — hardcoded `CURRENT_USER_ID` UUID in `src/config/constants.ts`

---

## Color Theme
Dark mode with neon lime-green accent, inspired by the reference screenshot. Configure in `tailwind.config.ts` as CSS custom properties.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0A0A18` | Page background |
| `--surface` | `#13132A` | Card / panel background |
| `--surface-elevated` | `#1C1C3A` | Inputs, dropdowns, hover states |
| `--border` | `#2A2A45` | Subtle borders, dividers |
| `--accent` | `#C8FF00` | Primary buttons, active states, key highlights |
| `--accent-foreground` | `#0A0A18` | Text on accent-colored backgrounds |
| `--foreground` | `#FFFFFF` | Primary text |
| `--muted-foreground` | `#8888AA` | Secondary / placeholder text |
| `--destructive` | `#FF4444` | Delete actions |

**Tailwind semantic classes to use throughout:**
- Backgrounds: `bg-background`, `bg-surface`, `bg-surface-elevated`
- Accent buttons: `bg-accent text-accent-foreground hover:bg-accent/90`
- Ghost/outline buttons: `border-border text-foreground hover:bg-surface-elevated`
- All shadcn/ui components should have their default colors overridden in `globals.css` to use the dark palette above

---

## Project Structure
```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts              # axios instance + ApiResponse unwrapper
│   │   ├── templates.ts           # template/participant/splitRule/field CRUD
│   │   ├── instances.ts           # instance CRUD + field values
│   │   └── participantAmounts.ts  # participant totals
│   ├── types/
│   │   └── index.ts               # TypeScript types matching all backend entities
│   ├── hooks/
│   │   ├── useTemplates.ts        # TanStack Query hooks for templates
│   │   ├── useInstances.ts        # TanStack Query hooks for instances
│   │   └── useFieldValues.ts      # field value + participant amount mutations
│   ├── components/
│   │   ├── ui/                    # shadcn/ui generated components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # top nav + main content wrapper
│   │   │   └── NavBar.tsx         # nav links: Templates | Active | History
│   │   ├── templates/
│   │   │   ├── TemplateCard.tsx
│   │   │   ├── TemplateWizard.tsx # 4-step wizard shell
│   │   │   ├── WizardStep1.tsx    # name + description
│   │   │   ├── WizardStep2.tsx    # participants
│   │   │   ├── WizardStep3.tsx    # split rules (% allocations per participant)
│   │   │   └── WizardStep4.tsx    # fields (label, type, default rule, default amount)
│   │   ├── instances/
│   │   │   ├── InstanceCard.tsx
│   │   │   ├── NewInstanceDialog.tsx  # template dropdown + name input
│   │   │   ├── ParticipantTotalsBar.tsx
│   │   │   ├── FieldSection.tsx       # renders one TemplateField's rows
│   │   │   ├── FieldValueRow.tsx      # single row with inline edit
│   │   │   └── SplitEditor.tsx        # dropdown + percent/fixed inputs
│   ├── pages/
│   │   ├── TemplatesPage.tsx      # /templates
│   │   ├── InstancesPage.tsx      # /instances  (active, flat list)
│   │   ├── InstanceDetailPage.tsx # /instances/:id
│   │   └── SettledPage.tsx        # /settled
│   ├── config/
│   │   └── constants.ts           # CURRENT_USER_ID, API_BASE_URL
│   ├── App.tsx                    # createBrowserRouter + QueryClientProvider
│   └── main.tsx
├── vite.config.ts                 # proxy /api → http://localhost:8080
├── tailwind.config.ts
├── components.json                # shadcn/ui config
└── package.json
```

---

## Routes
| Path | Component | Notes |
|------|-----------|-------|
| `/` | redirect | → `/templates` |
| `/templates` | TemplatesPage | Grid of TemplateCards; "New Template" button |
| `/templates/new` | TemplatesPage + wizard modal | Multi-step wizard in Dialog |
| `/templates/:id/edit` | TemplatesPage + wizard modal | Pre-filled wizard |
| `/instances` | InstancesPage | Flat list sorted by `createdAt` desc |
| `/instances/:id` | InstanceDetailPage | Core working view |
| `/settled` | SettledPage | Flat list of SETTLED instances |

---

## Key UI Flows

### 1. Template Creation Wizard (4 steps)
Displayed as a full-screen Dialog with step indicator (1/4, 2/4…).

- **Step 1 — Basic Info:** Template name (required), description (optional). POST `/api/templates` on "Next" (creates the template early so participants/rules/fields can reference its ID).
- **Step 2 — Participants:** List of participant rows with name input + reorder handle. `+ Add Participant` appends a row. POST `/api/templates/:id/participants` per participant. Min 1 required to proceed.
- **Step 3 — Split Rules:** Create named rules (e.g., "50/50", "70/30"). For each rule, show a row per participant with a % input. Live validation: sum must equal 100%. POST `/api/templates/:id/split-rules` + POST `/api/templates/split-rules/:id/allocations` per participant. Optional (can skip if fields won't have defaults).
- **Step 4 — Fields:** List of field rows: label, type toggle (SINGLE / MULTIPLE), default split rule dropdown (nullable), default amount input (optional, ≥ 0). POST `/api/templates/:id/fields` per field. Min 1 required. "Finish" closes wizard and navigates to `/templates`.

On wizard cancel after step 1: DELETE `/api/templates/:id` to clean up.

### 2. Active / Settled Instance Lists
- "New Instance" floating button → opens `NewInstanceDialog`
- `NewInstanceDialog`: template dropdown (fetches `/api/templates/user/:userId`), name input, Create button → POST `/api/instances`
- Cards show: instance name, template name, creation date, total per participant (fetched via `/api/participant-entry-amounts/instance/:id/participant/:pid/total`)
- Clicking a card navigates to `/instances/:id`

### 3. Instance Detail View (`/instances/:id`)
Layout:
```
┌──────────────────────────────────────────────────────┐
│  March 2026  •  Monthly Expenses       [IN PROGRESS] │
│  [ Rename ]                            [ Settle ]    │
├──────────────────────────────────────────────────────┤
│  TOTALS: Alice $1,234.50 │ Bob $987.25               │
├──────────────────────────────────────────────────────┤
│  Mortgage                                SINGLE       │
│  ┌────────────────────────────────────────────────┐  │
│  │  $2,500.00   50/50   ─  Mar 2026        [✏]   │  │
│  └────────────────────────────────────────────────┘  │
│  Groceries                               MULTIPLE     │
│  ┌────────────────────────────────────────────────┐  │
│  │  Mar 3  Whole Foods    $87.50  50/50    [✏][🗑] │  │
│  │  Mar 9  Jewel          $43.20  50/50    [✏][🗑] │  │
│  │  [ + Add Entry ]                                │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Inline editing (click ✏):** Row transitions to edit mode with:
- Amount input
- Note input
- Date picker
- Split mode selector:
  - "Template Default" → TEMPLATE_FIELD_PERCENT_SPLIT
  - Pick an existing split rule → FIELD_VALUE_CUSTOM_PERCENT (PUT `/field-values/:id/split-rule`)
  - "Fixed Amounts" → FIELD_VALUE_FIXED_AMOUNTS (reveals per-participant amount inputs)
- Save → PUT amount if changed (`PUT /field-values/:id/amount`), PUT split rule if changed; Cancel → revert
- For MULTIPLE fields: delete row button triggers DELETE `/field-values/:id`

**Add Entry (MULTIPLE fields):** Inline form at bottom of section → POST `/api/instances/:id/field-values`

**Totals bar** is refetched after any save.

**Settled instance:** All edit controls hidden; "Reopen" button shown (PUT `/api/instances/:id/reopen`).

---

## API Client Design
```typescript
// src/api/client.ts
const client = axios.create({ baseURL: '/api' });
// Interceptor: unwrap ApiResponse<T>.data or throw on success=false
```

All API functions return typed data directly (no wrapper). TanStack Query hooks wrap these with `useQuery` / `useMutation` with appropriate `queryKey` invalidation on mutations.

---

## Critical Implementation Notes

1. **Field Value auto-creation on instance creation:** Backend auto-creates one `InstanceFieldValue` per template field (amount=0). Fetch field values via `GET /api/instances/:id/field-values` — don't assume empty.
2. **SINGLE fields:** Only one field value exists per field per instance. No "Add Entry" shown; the ✏ edit is always present.
3. **Fixed amounts split validation:** Frontend must validate that per-participant inputs sum to the total amount before submitting.
4. **Split rule % validation:** In wizard step 3, validate allocations sum to 100% before allowing save.
5. **Vite proxy:** Configure `vite.config.ts` to proxy `/api` → `http://localhost:8080` so no CORS issues in dev.
6. **Query invalidation strategy:** After any field value mutation, invalidate `['fieldValues', instanceId]` and `['participantTotals', instanceId]`.
7. **TypeScript enums:** Mirror backend enums — `FieldType`, `InstanceStatus`, `SplitMode` — in `src/types/index.ts`.

---

## Implementation Order
1. Scaffold Vite project, install deps (Tailwind, shadcn/ui init, TanStack Query, React Router, Axios)
2. `types/index.ts` — all entity types
3. `api/` layer — all API functions
4. `hooks/` — TanStack Query hooks
5. `AppShell` + `NavBar` + router
6. `TemplatesPage` + `TemplateWizard` (steps 1–4)
7. `InstancesPage` + `NewInstanceDialog` + `InstanceCard`
8. `InstanceDetailPage` — read-only view first
9. Inline editing in `FieldValueRow` + `SplitEditor`
10. `SettledPage`

---

## Verification
- `npm run dev` in `frontend/` starts Vite dev server; backend must be running on port 8080
- Walk through: create template → add participants → add split rules → add fields → create instance → edit amounts → change split mode → settle instance → view in history
- Verify totals bar updates after edits
- Verify fixed amount split validation prevents save when amounts don't sum to total
