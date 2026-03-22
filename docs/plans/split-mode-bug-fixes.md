# Plan: Split Mode Bug Fixes

## Context

Editing a field value entry's split mode is broken in multiple ways. The backend already has a capable `PUT /instances/field-values/{fieldValueId}` endpoint that accepts `amount`, `note`, `splitMode`, and `overrideSplitRuleId` in one call — but the frontend ignores it entirely and uses two narrower endpoints (`/amount` and `/split-rule`) that together can't express a full update. As a result, split mode changes and fixed amount edits are silently dropped.

---

## Bugs

### Bug 1 — Split mode changes are never persisted

`handleSave` in `FieldValueRow.tsx` only calls `updateSplitRule` when `splitMode === "FIELD_VALUE_CUSTOM_PERCENT"` AND the rule ID changed. Switching to `TEMPLATE_FIELD_PERCENT_SPLIT` or `FIELD_VALUE_FIXED_AMOUNTS` sends nothing to the backend — the mode stays whatever it was before.

### Bug 2 — Fixed amounts are never saved on edit

`handleSave` validates that fixed amounts sum to the total but never calls anything to save them. No mutation exists for updating fixed amounts on an existing field value.

### Bug 3 — `SplitEditor` internal state doesn't reset on cancel

`SplitEditor` holds its own `selectedRuleId` state initialized from `currentSplitRuleId` on first render. When the user cancels, the parent resets its own state but `SplitEditor`'s `selectedRuleId` is stale — reopening the editor shows the previously selected (unsaved) rule.

---

## Fix

The backend's `PUT /instances/field-values/{fieldValueId}` already handles everything:
```
PUT /instances/field-values/{id}?amount=&note=&splitMode=&overrideSplitRuleId=
```
`InstanceService.updateFieldValue()` sets all fields and saves. The fix is to use this endpoint from the frontend instead of the two narrow ones.

**Note:** `updateFieldValue` in the service does NOT recalculate `ParticipantEntryAmount` records after saving — this will need to be addressed (see below).

---

## Changes

### 1. Add `updateFieldValue` API function (`frontend/src/api/instances.ts`)

```ts
export const updateFieldValue = (
  fieldValueId: string,
  params: {
    amount: number
    note?: string
    splitMode: SplitMode
    overrideSplitRuleId?: string
    participantAmounts?: Record<string, number>
  }
) =>
  client
    .put<InstanceFieldValue>(`/instances/field-values/${fieldValueId}`, null, {
      params: {
        amount: params.amount,
        note: params.note,
        splitMode: params.splitMode,
        overrideSplitRuleId: params.overrideSplitRuleId,
      },
    })
    .then((r) => r.data)
```

For `FIELD_VALUE_FIXED_AMOUNTS`, fixed amounts need a separate step — see item 3 below.

### 2. Add `useUpdateFieldValue` mutation (`frontend/src/hooks/useFieldValues.ts`)

```ts
export function useUpdateFieldValue(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      fieldValueId: string
      amount: number
      note?: string
      splitMode: SplitMode
      overrideSplitRuleId?: string
    }) => instanceApi.updateFieldValue(params.fieldValueId, params),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.fieldValues(instanceId) })
      qc.invalidateQueries({ queryKey: ["participant-entry-amounts", "field-value", vars.fieldValueId] })
      qc.invalidateQueries({ queryKey: ["participant-totals", instanceId] })
    },
  })
}
```

### 3. Handle fixed amounts on edit — backend gap

`InstanceService.updateFieldValue` saves the field value but does NOT delete and recreate `ParticipantEntryAmount` records when switching to/from `FIELD_VALUE_FIXED_AMOUNTS`. Need to add recalculation logic in the service:

**`InstanceService.updateFieldValue` additions:**
- Delete existing `ParticipantEntryAmount` records for this field value
- If new mode is `FIELD_VALUE_FIXED_AMOUNTS`: create new records from the provided map
- If new mode is percent-based: call `calculateAndCreateParticipantEntryAmounts(fieldValue)`

This requires adding a `participantAmounts` map parameter to the endpoint:
```
PUT /instances/field-values/{id}?amount=&splitMode=&...
Body (JSON): { "participantAmounts": { "participantId": 100.00, ... } }
```
Or pass fixed amounts as additional request params. JSON body is cleaner.

**Backend changes needed:**
- `InstanceController.updateFieldValue` — accept optional `@RequestBody Map<UUID, BigDecimal> participantAmounts`
- `InstanceService.updateFieldValue` — delete old `ParticipantEntryAmount` records, then recreate based on new mode

### 4. Rewrite `handleSave` in `FieldValueRow.tsx`

Replace the current piecemeal save logic with a single call to `useUpdateFieldValue`:

```ts
const handleSave = async () => {
  setSaving(true)
  try {
    const newAmount = parseFloat(amount)
    if (isNaN(newAmount) || newAmount < 0) {
      toast({ title: "Invalid amount", variant: "destructive" })
      return
    }

    if (splitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
      const fixedTotal = Object.values(fixedAmounts).reduce((s, v) => s + v, 0)
      if (Math.abs(fixedTotal - newAmount) > 0.01) {
        toast({ title: "Fixed amounts must sum to total", variant: "destructive" })
        return
      }
    }

    await updateFieldValue.mutateAsync({
      fieldValueId: fieldValue.id,
      amount: newAmount,
      note: note.trim() || undefined,
      splitMode,
      overrideSplitRuleId: splitMode === "FIELD_VALUE_CUSTOM_PERCENT" ? splitRuleId : undefined,
      participantAmounts: splitMode === "FIELD_VALUE_FIXED_AMOUNTS" ? fixedAmounts : undefined,
    })
    setEditing(false)
  } catch (e) {
    toast({ title: "Save failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" })
  } finally {
    setSaving(false)
  }
}
```

Remove `useUpdateFieldValueAmount` and `useUpdateFieldValueSplitRule` from this component (replaced by `useUpdateFieldValue`).

### 5. Fix `SplitEditor` stale state (Bug 3)

Remove `selectedRuleId` internal state from `SplitEditor`. The parent (`FieldValueRow`) already tracks `splitRuleId` state — pass it down and let the parent own it fully:

- Remove `const [selectedRuleId, setSelectedRuleId] = useState(...)` from `SplitEditor`
- `SplitEditor` already receives `currentSplitRuleId` prop — use it directly as the `Select` value
- `handleRuleChange` calls `onSplitModeChange("FIELD_VALUE_CUSTOM_PERCENT", ruleId)` which already updates parent state
- Parent's `handleCancel` resets `splitRuleId` to `fieldValue.overrideSplitRuleId ?? ""` which flows back down correctly

---

## Critical Files

**Backend:**
- `src/main/java/com/expensesplitter/controller/InstanceController.java` — add `@RequestBody` for participant amounts to `updateFieldValue`
- `src/main/java/com/expensesplitter/service/InstanceService.java` — recalculate `ParticipantEntryAmount` records in `updateFieldValue`

**Frontend:**
- `frontend/src/api/instances.ts` — add `updateFieldValue` function
- `frontend/src/hooks/useFieldValues.ts` — add `useUpdateFieldValue` mutation
- `frontend/src/components/instances/FieldValueRow.tsx` — rewrite `handleSave`, use `useUpdateFieldValue`
- `frontend/src/components/instances/SplitEditor.tsx` — remove internal `selectedRuleId` state

---

## Verification

1. Open an instance detail with a SINGLE field using template default split
2. Edit it → change split mode to "Custom Split Rule" → select a rule → Save → confirm pill badges update to reflect new percentages
3. Edit again → change to "Fixed Amounts" → enter amounts → Save → confirm pills show "Fixed" with correct amounts
4. Edit again → change back to "Template Default" → Save → confirm reverts correctly
5. Edit → make changes → Cancel → reopen editor → confirm no stale state
6. Confirm participant totals bar updates correctly after each save
