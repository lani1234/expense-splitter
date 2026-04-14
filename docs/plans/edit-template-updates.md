# Plan: Template Detail / Edit Page

## Context
Templates currently have no good "view" experience — clicking the pencil on a template card opens a narrow dialog (`TemplateEditDialog.tsx`) that only lets you rename the template name, participant names, and field labels. There is no way to see or change a field's default amount, default payer, or default split rule after creation. The user wants a full-page template detail view (similar to the instance detail page) where all of this is visible and editable — so that, for example, updating a recurring cable bill from $150 to $160 is a simple edit on the template rather than deleting and recreating it.

## Approach

Replace the dialog with a new route `/templates/:templateId` — a `TemplateDetailPage` that shows the template structure richly and supports inline editing of all field defaults. The pencil button on `TemplateCard` will navigate to this page instead of opening the dialog. The dialog file is deleted.

---

## Backend Changes

### 1. `TemplateService.java` — add `updateField()`
After the existing `renameField()` method. Supports partial updates (null = leave unchanged) and explicit clear flags for nullable FKs:
```java
public TemplateField updateField(UUID fieldId, String label, BigDecimal defaultAmount,
                                  UUID defaultSplitRuleId, UUID defaultPayerParticipantId,
                                  boolean clearDefaultAmount, boolean clearDefaultSplitRule,
                                  boolean clearDefaultPayer) { ... }
```

### 2. `TemplateController.java` — add `PUT /api/templates/fields/{fieldId}`
```
@RequestParam(required = false) String label
@RequestParam(required = false) BigDecimal defaultAmount
@RequestParam(required = false) UUID defaultSplitRuleId
@RequestParam(required = false) UUID defaultPayerParticipantId
@RequestParam(defaultValue = "false") boolean clearDefaultAmount
@RequestParam(defaultValue = "false") boolean clearDefaultSplitRule
@RequestParam(defaultValue = "false") boolean clearDefaultPayer
```

No other backend files change — entity, DTO, and repository are already correct.

---

## Frontend Changes

### 3. `frontend/src/api/templates.ts` — add `updateField`
```typescript
export const updateField = (fieldId: string, params: {
  label?: string; defaultAmount?: number;
  defaultSplitRuleId?: string; defaultPayerParticipantId?: string;
  clearDefaultAmount?: boolean; clearDefaultSplitRule?: boolean; clearDefaultPayer?: boolean;
}) => client.put<TemplateField>(`/templates/fields/${fieldId}`, null, { params }).then(r => r.data)
```

### 4. `frontend/src/hooks/useTemplates.ts` — add `useUpdateField` + update `useUpdateTemplate`
`useUpdateField` invalidates `TEMPLATE_KEYS.fields(templateId)` on success.

`useUpdateTemplate` was updated to also invalidate `TEMPLATE_KEYS.detail(id)` (in addition to `byUser`) so the template name reflects immediately on `TemplateDetailPage`.

### 5. Extract `EditableRow` — new `frontend/src/components/templates/EditableRow.tsx`
The `EditableRow` component currently lives inside `TemplateEditDialog.tsx` (lines 22–88). Extract it to its own file so the new page can import it. Interface: `{ label, onSave, badge? }` — no changes to logic needed.

### 6. New `frontend/src/components/templates/TemplateFieldDefaultRow.tsx`
The template equivalent of `FieldValueRow.tsx`. Props: `{ field, participants, splitRules, allAllocations, templateId }`.

**View mode:** shows `$XX.XX` (or `—`), split percentages as `"50% / 50%"` (or `—`), payer name (or `—`), with a hover-reveal pencil button.

**Edit mode:** bordered card (same pattern as `FieldValueRow` edit mode) with:
- `<Input type="number">` for default amount with `$` prefix
- `<select>` for default payer (list of participants + "— none —")
- `<select>` for default split rule — options display as `"50% / 50%"` derived from allocation data, not the stored rule name
- Save / Cancel buttons

On save: calls `useUpdateField` mutation. Supports clearing nullable fields via `clearDefaultAmount`, `clearDefaultSplitRule`, `clearDefaultPayer` boolean params.

Split label formatting uses a `formatSplitLabel(splitRuleId, allAllocations, participants)` helper that maps participants in display order to their allocation percentages — same pattern as `SplitEditor`'s `templateDefaultLabel`.

### 7. New `frontend/src/components/templates/TemplateFieldSection.tsx`
Template equivalent of `FieldSection.tsx`. Props: `{ field, participants, splitRules, allAllocations, templateId }`.

**Layout:**
- Section header: left-border accent + field label (editable via `EditableRow`) + `SINGLE`/`MULTIPLE` badge
- Card body: a single `TemplateFieldDefaultRow` showing the field's defaults

Calls `useRenameField(templateId)` for label edits, threads `allAllocations` down to the row.

### 8. New `frontend/src/pages/TemplateDetailPage.tsx`
Route: `/templates/:templateId`

**Structure (mirroring `InstanceDetailPage`):**
1. **Header:** Back-arrow → `/templates`, inline-editable template name (group/hover pencil pattern), delete button with confirm step
2. **Participants section:** section heading + one `EditableRow` per participant (sorted by displayOrder)
3. **Fields section:** one `TemplateFieldSection` per field (sorted by displayOrder)

**Data:** `useTemplate(id)`, `useParticipants(id)`, `useFields(id)`, `useSplitRules(id)`, plus `useQueries` to fetch allocations for all split rules in parallel → builds `Record<splitRuleId, SplitRuleAllocation[]>` passed to each `TemplateFieldSection`.

**Mutations:** `useUpdateTemplate()`, `useRenameParticipant(id)`, `useRenameField(id)`, `useUpdateField(id)`

Loading skeleton: same `animate-pulse` pattern as `InstanceDetailPage`. Not-found guard: same pattern.

### 9. `frontend/src/App.tsx` — add route
```typescript
import TemplateDetailPage from "@/pages/TemplateDetailPage"
// inside route children:
{ path: "templates/:templateId", element: <TemplateDetailPage /> }
```

### 10. `frontend/src/components/templates/TemplateCard.tsx` — navigate instead of dialog
- Add `useNavigate` from `react-router-dom`
- Remove `import TemplateEditDialog` and `[editing, setEditing]` state
- Change pencil button `onClick` to `() => navigate(\`/templates/${template.id}\`)`
- Remove `<TemplateEditDialog ... />` at the bottom

### 11. Delete `frontend/src/components/templates/TemplateEditDialog.tsx`
No longer needed once `TemplateCard` no longer imports it.

---

## Implementation Order
1. Backend: `TemplateService.java` → `TemplateController.java`
2. Frontend data layer: `api/templates.ts` → `hooks/useTemplates.ts`
3. Extract `EditableRow.tsx`
4. New components: `TemplateFieldDefaultRow.tsx` → `TemplateFieldSection.tsx`
5. New page: `TemplateDetailPage.tsx`
6. Wire routing: `App.tsx`
7. Update `TemplateCard.tsx` + delete `TemplateEditDialog.tsx`

---

## Verification
1. Run backend (`mvn spring-boot:run`) and confirm `PUT /api/templates/fields/{id}?defaultAmount=160` returns updated DTO
2. Run frontend (`cd frontend && npm run dev`)
3. Navigate to `/templates` → click pencil on a card → should navigate to `/templates/:id`
4. Verify all template data is visible: name, participants, fields with defaults
5. Edit a field's default amount → save → confirm it persists after page refresh
6. Edit template name and participant name inline → confirm they save
7. Start a new instance from the template → confirm the instance field pre-populates with the updated default amount
8. Run `mvn test` to confirm no backend regressions
