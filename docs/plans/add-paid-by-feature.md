# Payer Tracking Feature

## Context

Currently the app tracks each participant's share of expenses but assumes one person pays for everything. The user needs to track who physically paid for each entry so the app can compute a net settlement amount: a participant's net owed = their share − what they paid. This is critical for cases where the partner occasionally pays for something (e.g., a Costco run), which should reduce what they owe at month end.

**Example:** $3000 total, 50/50 split. User paid $2500, partner paid $500.
- Both owe $1500 (share)
- Partner's net = $1500 − $500 = **$1000** (not $1500)

---

## Implementation Plan

### 1. Database Migration

**Create** `src/main/resources/db/migration/V9__add_payer_to_instance_field_value.sql`:
```sql
ALTER TABLE instance_field_value
    ADD COLUMN payer_participant_id UUID REFERENCES template_participant(id);
```
Nullable, so existing rows get NULL and existing behavior is fully preserved.

---

### 2. Backend — Entity

**File:** `src/main/java/com/expensesplitter/entity/InstanceFieldValue.java`

Add a new lazy ManyToOne:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "payer_participant_id")
private TemplateParticipant payerParticipant;
```

---

### 3. Backend — DTOs

**File:** `src/main/java/com/expensesplitter/dto/InstanceFieldValueResponse.java`

Add `UUID payerParticipantId` to the record and populate it in `from()` via `e.getPayerParticipant() != null ? e.getPayerParticipant().getId() : null`.

**Create** `src/main/java/com/expensesplitter/dto/ParticipantTotalsResponse.java`:
```java
public record ParticipantTotalsResponse(
    boolean hasPayers,
    Map<UUID, BigDecimal> shares,   // participant → share owed
    Map<UUID, BigDecimal> paid,     // participant → amount paid
    Map<UUID, BigDecimal> net       // participant → net (share − paid)
) {}
```

---

### 4. Backend — Service Changes

**File:** `src/main/java/com/expensesplitter/service/InstanceService.java`

- In `addFieldValue`: after creating `InstanceFieldValue`, if `payerParticipantId != null`, fetch participant via `templateService.getParticipantById()` and set it.
- In `updateFieldValue`: add `UUID payerParticipantId` param. Always set (null clears the payer, UUID sets it).

**File:** `src/main/java/com/expensesplitter/service/ParticipantEntryAmountService.java`

Add `getInstanceTotals(UUID instanceId)` method that:
1. Fetches all field values for the instance
2. Checks `hasPayers` (any field value with non-null `payerParticipant`)
3. Sums `ParticipantEntryAmount` records into `shares` map per participant
4. Sums `fieldValue.amount` into `paid` map per payer participant
5. Computes `net = share − paid` for each participant
6. Returns `ParticipantTotalsResponse`

---

### 5. Backend — Controller Changes

**File:** `src/main/java/com/expensesplitter/controller/InstanceController.java`

- `updateFieldValue` endpoint: add `@RequestParam(required = false) UUID payerParticipantId` and thread it to the service.
- `addFieldValue` already deserializes from a request body — add `payerParticipantId` field to `AddFieldValueRequest`.

**File:** `src/main/java/com/expensesplitter/controller/ParticipantEntryAmountController.java`

Add new endpoint (existing `/total` endpoint untouched):
```java
@GetMapping("/instance/{instanceId}/totals")
public ResponseEntity<ApiResponse<ParticipantTotalsResponse>> getInstanceTotals(
        @PathVariable UUID instanceId) { ... }
```

---

### 6. Frontend — Types

**File:** `frontend/src/types/index.ts`

- Add `payerParticipantId?: string` to `InstanceFieldValue`
- Add `payerParticipantId?: string` to `AddFieldValueRequest` (and any update params)
- Add new type:
  ```typescript
  export interface ParticipantTotalsResponse {
    hasPayers: boolean
    shares: Record<string, number>
    paid: Record<string, number>
    net: Record<string, number>
  }
  ```

---

### 7. Frontend — API Layer

**File:** `frontend/src/api/participantAmounts.ts`

Add:
```typescript
export const getInstanceTotals = (instanceId: string) =>
  client.get<ParticipantTotalsResponse>(
    `/participant-entry-amounts/instance/${instanceId}/totals`
  ).then((r) => r.data)
```

**File:** `frontend/src/api/instances.ts`

Add `payerParticipantId?: string | null` to `updateFieldValue` params and pass as query param (undefined omits it from request).

---

### 8. Frontend — Hooks

**File:** `frontend/src/hooks/useFieldValues.ts`

- Add `useInstanceTotals(instanceId)` hook using the new API function
- Add `INSTANCE_TOTALS_KEY` query key
- Add `qc.invalidateQueries({ queryKey: INSTANCE_TOTALS_KEY(instanceId) })` to all mutations that currently invalidate participant totals (`useAddFieldValue`, `useUpdateFieldValue`, `useDeleteFieldValue`, `useUpdateFieldValueAmount`)
- Update `useUpdateFieldValue` mutation params to include `payerParticipantId?: string | null`

---

### 9. Frontend — ParticipantTotalsBar

**File:** `frontend/src/components/instances/ParticipantTotalsBar.tsx`

Replace per-participant `useParticipantTotal` calls with a single `useInstanceTotals` call.

- When `hasPayers = false`: render existing compact tile (just name + share amount, same look as today)
- When `hasPayers = true`: expand each tile to show three rows:
  ```
  Alice
  Share  $1,500.00
  Paid   $2,500.00
  ─────────────────
  Net    -$1,000.00  ← green (is owed)
  ```
  Net is green (`text-emerald-600`) when ≤ 0 (they're owed money), tile's standard color when > 0 (they owe).

---

### 10. Frontend — FieldValueRow (edit + display)

**File:** `frontend/src/components/instances/FieldValueRow.tsx`

**Display mode:** Add a "Paid by [Name]" pill badge after participant chips when `payerParticipantId` is set. Uses the already-fetched `participants` array — no extra request.
```tsx
{fieldValue.payerParticipantId && (
  <span className="text-xs rounded-full border px-2.5 py-0.5 bg-slate-100 border-slate-300 text-slate-500 whitespace-nowrap shrink-0">
    Paid by {participants.find(p => p.id === fieldValue.payerParticipantId)?.name}
  </span>
)}
```

**Edit mode:** Add `payerParticipantId` state (initialized from `fieldValue.payerParticipantId ?? ""`). Below the Amount/Note inputs, add a "Paid by" `<select>` with a `"— not tracked —"` blank option plus one option per participant. Pass `payerParticipantId: payerParticipantId || null` in `handleSave`.

---

### 11. Frontend — FieldSection (add form)

**File:** `frontend/src/components/instances/FieldSection.tsx`

Mirror the "Paid by" selector in the add-entry form. Add `newPayerParticipantId` state, the same `<select>` UI, and include it in `addFieldValue.mutateAsync(...)`. Reset to `""` on success.

Note: `FieldSection` may need to import and call `useParticipants` if it doesn't already have access to the participants list.

---

## Verification

1. Run backend: `mvn spring-boot:run` — Flyway V9 migration applies, app starts without error
2. Run frontend: `cd frontend && npm run dev`
3. Open an instance detail page
4. **Edit an existing entry** → confirm "Paid by" dropdown appears → select a participant → save → confirm "Paid by [Name]" badge shows on the row
5. **Check totals bar** — with payer set, tiles should expand to Show Share / Paid / Net. Net for the payer should be negative (green); net for the other participant should be positive.
6. **Add a new entry** → confirm "Paid by" selector in the add form → set payer → save → totals update correctly
7. **Clear payer** on an entry (select "— not tracked —") → save → badge disappears, totals recalculate
8. **No payer entries** — if all entries have no payer, totals bar collapses back to compact single-number tiles (existing UI)
9. Run backend tests: `mvn test`
