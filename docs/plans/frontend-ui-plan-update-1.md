# Plan: Rework Template Creation Wizard (Split Rules → Inline per Field)

## Context
The current 4-step wizard has a dedicated "Define Split Rules" step (Step 3) that:
- Creates named split rules independently of fields
- Requires a separate save action per rule before moving on
- Then shows those rules in a dropdown on the Fields step (Step 4) — which was broken (empty dropdown)

This is not intuitive because a split rule is really a property of a field, not a standalone concept. The user wants to define how each field is split *while* defining the field.

**Goal:** Collapse into a 3-step wizard. Remove Step 3 entirely. In the Fields step (now Step 3), each field gets an expandable "Split" shelf where percentages per participant are defined inline.

---

## Files to Change
- `frontend/src/components/templates/TemplateWizard.tsx` — change 4→3 steps, remove Step 3, rename Step 4→Step 3
- `frontend/src/components/templates/WizardStep3.tsx` — **rewrite** as the new Fields step (with inline split)
- `frontend/src/components/templates/WizardStep4.tsx` — **delete** (logic absorbed into new WizardStep3)

---

## New Wizard Structure

| Step | Label | Component |
|------|-------|-----------|
| 1 | Basic Info | WizardStep1 (unchanged) |
| 2 | Participants | WizardStep2 (unchanged) |
| 3 | Add Fields | WizardStep3 (rewritten) |

---

## New WizardStep3 — Fields with Inline Split

### Field draft state
```typescript
interface FieldDraft {
  label: string
  fieldType: FieldType           // "SINGLE" | "MULTIPLE"
  defaultAmount: string
  splitOpen: boolean             // whether the split shelf is expanded
  percents: Record<string, string>  // participantId → "%" string input
}
```

### Add-field form layout
```
┌─ New Field ─────────────────────────────────┐
│  Label *  [________________]                │
│  Type     [Single ▼]   Amount  [$_______]   │
│                                             │
│  Split *  (always visible, required)        │
│    Alice  [60] %                            │
│    Bob    [40] %                            │
│    Total: 100% ✓  (red if ≠ 100)           │
│                          [ + Add Field ]    │
└─────────────────────────────────────────────┘
```
- Participants fetched via `useParticipants(templateId)` (already in hooks)
- Split section is **always expanded and required** — a field cannot be added without a valid split
- Amount is optional (can be left blank / 0)

### On "Add Field" click — sequence of API calls
Split is always defined, so every field add follows the same path:
1. Validate percents sum to 100 ± 0.01; show inline error if not
2. `createSplitRule(templateId, label)` — field label used as rule name
3. `createAllocation(rule.id, participantId, percent)` for each participant
4. `createField(templateId, label, fieldType, order, rule.id, amount)`

### Existing fields list (read-only rows above the form)
Each saved field row shows: label, type badge, amount (if set), and split summary derived from the rule allocations (e.g., "Alice 60% / Bob 40%").

### Validation
- "Add Field" button disabled if label is empty
- "Add Field" button disabled if percents do not sum to 100% (show live total below inputs)
- "Finish" button disabled if `fields.length === 0`

---

## TemplateWizard.tsx Changes
- Step count: 4 → 3
- Step labels array: `["Basic Info", "Participants", "Fields"]`
- Remove `WizardStep3` import (old split rules step); import new `WizardStep3` (fields)
- Remove `WizardStep4` import entirely
- Render block: replace `step === 3 → <WizardStep3>` and `step === 4 → <WizardStep4>` with single `step === 3 → <WizardStep3>`
- Back on Step 3 now goes to Step 2
- Cancel cleanup: delete template if `step < 3` (was `< 4`)

---

## Bug Fix: Step 3 Only Shows One Participant

**Root cause:** `WizardStep3` mounts and calls `useParticipants(templateId)`, but React Query serves stale cache. If the last `createParticipant` + invalidate + refetch cycle in Step 2 hadn't fully settled before the user clicked "Next", Step 3 gets cache with only 1 participant.

**Fix:** In `WizardStep3`, replace the `useParticipants` hook call with a direct `useQuery` that overrides `refetchOnMount: "always"`. Same query key — just forces a fresh GET every time Step 3 mounts.

```typescript
// WizardStep3.tsx — replace useParticipants(templateId) with:
const { data: participants = [] } = useQuery({
  queryKey: TEMPLATE_KEYS.participants(templateId),
  queryFn: () => getParticipants(templateId),
  refetchOnMount: "always",
})
```

---

## Verification
- Run wizard → fill name → add 2 participants → reach Fields step
- Add a field without filling split percents → "Add Field" blocked
- Add a field with percents that don't sum to 100 → "Add Field" blocked with error
- Add a field with valid 100% split → appears in list with "Alice 60% / Bob 40%" summary
- Finish → template on Templates page
- Confirm via backend: `GET /api/templates/:id/split-rules` shows one rule per field
- Confirm via backend: `GET /api/templates/split-rules/:id/allocations` has correct percentages
