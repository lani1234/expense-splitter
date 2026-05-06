# Plan: Sub-Fields for MULTIPLE Template Fields

## Context

MULTIPLE fields currently serve as dynamic expense buckets (e.g. "Groceries" — no predefined amount, entries added throughout the month). There is no parent/child concept in the schema; all `template_field` rows are siblings.

The requested enhancement adds a second use case: **grouping**. A MULTIPLE field should be able to contain named child fields (e.g. "Quarterly Bills" → "Water", "Trash"), where each child is a predefined expense with its own defaults. When an instance is created, each child auto-generates an `InstanceFieldValue`, just like SINGLE fields do today.

**Backward compatibility rule:**
- MULTIPLE with no children → behaves exactly as today (one InstanceFieldValue created; more can be added dynamically in the instance view)
- MULTIPLE with children → acts as a container; each child gets its own InstanceFieldValue; the parent itself does not get one

---

## Files to Modify

### Backend
| File | Change |
|---|---|
| `src/main/resources/db/migration/V11__add_parent_field_to_template_field.sql` | New migration |
| `src/main/java/com/expensesplitter/entity/TemplateField.java` | Add `parentField` ManyToOne + `childFields` OneToMany |
| `src/main/java/com/expensesplitter/dto/TemplateFieldResponse.java` | Add `parentFieldId` field |
| `src/main/java/com/expensesplitter/service/TemplateService.java` | Accept `parentFieldId` in `addField()`; update `deleteField()` cascade |
| `src/main/java/com/expensesplitter/controller/TemplateController.java` | Accept `parentFieldId` query param on POST `/templates/{id}/fields` |
| `src/main/java/com/expensesplitter/service/InstanceService.java` | Update `createDefaultFieldValues()` to skip parent when children exist; create child field values |

### Frontend
| File | Change |
|---|---|
| `frontend/src/types/index.ts` | Add `parentFieldId?: string` to `TemplateField` |
| `frontend/src/api/templates.ts` | Add `parentFieldId?` param to `createField()` |
| `frontend/src/pages/TemplateDetailPage.tsx` | Separate top-level vs child fields; only map top-level into `TemplateFieldSection` |
| `frontend/src/components/templates/TemplateFieldSection.tsx` | Render child fields nested under MULTIPLE parent; add "Add sub-field" button |
| `frontend/src/components/templates/AddTemplateFieldForm.tsx` | When MULTIPLE selected, reveal inline sub-fields section (add/remove named items) |
| `frontend/src/components/templates/WizardStep3.tsx` | Same sub-fields UI as `AddTemplateFieldForm` when MULTIPLE selected |

---

## Implementation Steps

### 1. Database Migration
```sql
-- V11__add_parent_field_to_template_field.sql
ALTER TABLE template_field
  ADD COLUMN parent_field_id UUID REFERENCES template_field(id);
```

### 2. Backend — Entity + DTO

**`TemplateField.java`** — add:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "parent_field_id")
private TemplateField parentField;

@OneToMany(mappedBy = "parentField", fetch = FetchType.LAZY)
@OrderBy("displayOrder ASC")
private List<TemplateField> childFields = new ArrayList<>();
```

**`TemplateFieldResponse.java`** — add `UUID parentFieldId` and populate from `field.getParentField()?.getId()` in the `from()` factory.

### 3. Backend — Service

**`TemplateService.addField()`**
- Add `UUID parentFieldId` parameter
- If non-null, look up the parent field and set it; validate parent is in the same template and is type MULTIPLE

**`TemplateService.deleteField()`**
- When deleting a MULTIPLE parent that has children, delete child fields (and their InstanceFieldValues) first to avoid FK violations

**`TemplateService.getFieldsByTemplate()`**
- No change — returns all fields flat; frontend groups by `parentFieldId`

### 4. Backend — Controller

`TemplateController` POST `/templates/{templateId}/fields`:
- Add `@RequestParam(required = false) UUID parentFieldId`
- Pass through to `templateService.addField()`

### 5. Backend — Instance Creation

**`InstanceService.createDefaultFieldValues()`** — update logic:

```
for each top-level field (parentFieldId == null):
  if field is MULTIPLE and has children:
    skip (let children handle their own InstanceFieldValues)
  else:
    create InstanceFieldValue (existing behavior — covers SINGLE and childless MULTIPLE)

for each child field (parentFieldId != null):
  create InstanceFieldValue (same logic as SINGLE)
```

### 6. Frontend — Types + API

**`types/index.ts`**: add `parentFieldId?: string` to `TemplateField`

**`api/templates.ts`**: add optional `parentFieldId` to `createField()` params

**`hooks/useTemplates.ts`**: no changes needed

### 7. Frontend — TemplateDetailPage

```ts
const topLevelFields = sortedFields.filter(f => !f.parentFieldId)
const childFieldsByParentId = sortedFields
  .filter(f => f.parentFieldId)
  .reduce((acc, f) => ({
    ...acc,
    [f.parentFieldId!]: [...(acc[f.parentFieldId!] ?? []), f]
  }), {} as Record<string, TemplateField[]>)
```

Pass `childFields={childFieldsByParentId[field.id] ?? []}` into each `TemplateFieldSection`.

### 8. Frontend — TemplateFieldSection

When `field.fieldType === "MULTIPLE"`:
- Render each child field as a nested row (label + defaults chip, edit pencil, delete trash)
- Show an inline "Add sub-field" input at the bottom (label → Enter to save)
- Sub-field creation calls `createField()` with `parentFieldId = field.id`, `fieldType = "SINGLE"`
- Children still get their own `TemplateFieldDefaultRow` edit form for amount/split/payer

### 9. Frontend — AddTemplateFieldForm + WizardStep3

When "Multiple" radio is selected:
- Hide Default Amount / Default Payer / Split inputs (don't apply to the container)
- Show a "Sub-fields" section: list of pending sub-field rows, each with a label input
- On submit: create parent MULTIPLE field first, then `Promise.all` to create each child with `parentFieldId`

---

## Verification

1. **Unit test**: Confirm `InstanceService.createDefaultFieldValues()` creates InstanceFieldValues for child fields and skips MULTIPLE parents that have children.
2. **Manual — template editor**:
   - Create a MULTIPLE field "Quarterly Bills"; add sub-fields "Water" ($50) and "Trash" ($30)
   - Verify both appear nested under "Quarterly Bills"
   - Delete one sub-field; confirm it disappears
3. **Manual — instance creation**:
   - Create an instance; verify InstanceFieldValues exist for "Water" and "Trash" but NOT "Quarterly Bills"
   - Verify a childless MULTIPLE field (e.g. "Groceries") still gets one InstanceFieldValue
4. **Wizard**: Add a MULTIPLE field with sub-fields in WizardStep3 and confirm they save correctly
5. **Backward compatibility**: Existing templates with childless MULTIPLE fields continue to work as before
