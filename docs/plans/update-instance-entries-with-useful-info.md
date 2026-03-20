# Plan: Replace Split Label with Per-Participant Breakdown on Entry Rows

## Context

Each entry row currently shows `$amount — Default` (or "Fixed"), which is meaningless to the user. The goal is to replace the badge with a per-participant breakdown like **"Alice 65% $65.00 · Bob 35% $35.00"** for percentage splits, or **"Alice Fixed $76.00 · Bob Fixed $24.00"** for fixed-amount splits.

---

## Data Model

Each `InstanceFieldValue` has `ParticipantEntryAmount` records (one per participant) holding the calculated dollar amount. The `SplitRuleAllocation` records hold the configured percentages. `TemplateParticipant` records hold names.

To build the breakdown we need:
1. `ParticipantEntryAmount[]` for the field value — via existing `getAmountsByFieldValue(fieldValueId)` in `api/participantAmounts.ts`
2. `TemplateParticipant[]` — via existing `useParticipants(templateId)` hook
3. `SplitRuleAllocation[]` for the effective split rule — via existing `useAllocations(splitRuleId)` hook, **only for percent modes**

The effective split rule ID:
- `FIELD_VALUE_CUSTOM_PERCENT` → `fieldValue.overrideSplitRuleId`
- `TEMPLATE_FIELD_PERCENT_SPLIT` → `field.defaultSplitRuleId` (on the `TemplateField` — **not currently passed to `FieldValueRow`**)
- `FIELD_VALUE_FIXED_AMOUNTS` → none needed

---

## Files to Modify

1. `frontend/src/hooks/useFieldValues.ts`
2. `frontend/src/components/instances/FieldSection.tsx`
3. `frontend/src/components/instances/FieldValueRow.tsx`

---

## Step-by-Step Changes

### 1. `useFieldValues.ts` — add `useAmountsByFieldValue` hook

Add after the existing `useParticipantTotal`:

```ts
export function useAmountsByFieldValue(fieldValueId: string) {
  return useQuery({
    queryKey: ["participant-entry-amounts", "field-value", fieldValueId],
    queryFn: () => amountsApi.getAmountsByFieldValue(fieldValueId),
    enabled: !!fieldValueId,
  })
}
```

### 2. `FieldSection.tsx` — pass `defaultSplitRuleId` to `FieldValueRow`

Add `defaultSplitRuleId={field.defaultSplitRuleId}` to the `<FieldValueRow>` call (line 98-105):

```tsx
<FieldValueRow
  key={fv.id}
  fieldValue={fv}
  templateId={templateId}
  instanceId={instanceId}
  isDeletable={isMultiple}
  isSettled={isSettled}
  defaultSplitRuleId={field.defaultSplitRuleId}   // ← add this
/>
```

### 3. `FieldValueRow.tsx` — replace the split label badge with participant chips

**New imports to add:**
```ts
import { useAmountsByFieldValue } from "@/hooks/useFieldValues"
import { useParticipants, useAllocations } from "@/hooks/useTemplates"
```

**New prop:**
```ts
interface Props {
  // ... existing props ...
  defaultSplitRuleId?: string
}
```

**New data inside the component:**
```ts
const { data: participantEntryAmounts = [] } = useAmountsByFieldValue(fieldValue.id)
const { data: participants = [] } = useParticipants(templateId)

const effectiveSplitRuleId =
  fieldValue.splitMode === "FIELD_VALUE_CUSTOM_PERCENT"
    ? fieldValue.overrideSplitRuleId
    : fieldValue.splitMode === "TEMPLATE_FIELD_PERCENT_SPLIT"
    ? defaultSplitRuleId
    : undefined

const { data: allocations = [] } = useAllocations(effectiveSplitRuleId ?? "")
```

**Build participant chips:**
```ts
const participantChips = participantEntryAmounts.map((pea) => {
  const participant = participants.find((p) => p.id === pea.templateParticipantId)
  const name = participant?.name ?? "?"
  if (fieldValue.splitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
    return `${name} Fixed $${pea.amount.toFixed(2)}`
  }
  const allocation = allocations.find((a) => a.templateParticipantId === pea.templateParticipantId)
  const pct = allocation?.percent ?? (fieldValue.amount > 0 ? (pea.amount / fieldValue.amount) * 100 : 0)
  return `${name} ${Math.round(pct)}% $${pea.amount.toFixed(2)}`
})
```

**Replace the view-mode return's split label `<span>` with:**
```tsx
<div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-elevated group">
  <span className="w-28 text-sm font-semibold text-foreground">
    ${fieldValue.amount.toFixed(2)}
  </span>
  {fieldValue.note && (
    <span className="text-xs text-muted-foreground italic shrink-0">{fieldValue.note}</span>
  )}
  <span className="flex-1 flex items-center justify-end flex-wrap gap-x-2 gap-y-0.5">
    {participantChips.map((chip, i) => (
      <span key={i} className="text-xs text-muted-foreground whitespace-nowrap">
        {i > 0 && <span className="mr-2 opacity-40">·</span>}
        {chip}
      </span>
    ))}
  </span>
  {!isSettled && (/* existing edit/delete buttons unchanged */)}
</div>
```

Also **remove** the now-unused `currentRule` and `splitLabel` variables (lines 40-49).

---

## Verification

1. `cd frontend && npm run dev` — browse to an instance detail page
2. Each entry row should show "Alice 65% $65.00 · Bob 35% $35.00" for percent entries
3. Fixed entries should show "Alice Fixed $76.00 · Bob Fixed $24.00"
4. Zero-amount entries should show participant names with $0.00 (no divide-by-zero crash)
5. Notes, when present, should appear before the participant chips
6. Edit mode is unchanged
