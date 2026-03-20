# Plan: Fix Instance Detail View via Response DTOs

## Context

The instance detail page renders only the title/status bar — no fields appear. The root cause is a **backend/frontend data shape mismatch**, and fixing it is the right time to introduce response DTOs across all endpoints.

### Root Causes

**Bug 1 — `TemplateInstance` serializes a nested `template` object, not a flat `templateId` UUID.**
- Entity: `private Template template` (LAZY `@ManyToOne`)
- JSON returned: `{ "id": "...", "template": { "id": "...", ... }, "name": "...", ... }`
- Frontend reads: `instance.templateId` → `undefined`
- Consequence: `useFields(undefined)` has `enabled: !!templateId = false` → **template fields never fetched → nothing renders**

**Bug 2 — `InstanceFieldValue` serializes nested objects, not flat UUIDs.**
- Entity has `private TemplateField templateField` and `private TemplateInstance instance` (both LAZY)
- JSON returned: `{ "templateField": { "id": "..." }, "instance": { "id": "..." }, ... }`
- Frontend reads: `fv.templateFieldId` → `undefined`
- Consequence: All field values group under `fvByField[undefined]` → field sections show empty even if fields DID load

**Same pattern affects:** `TemplateField.defaultSplitRule`, `TemplateParticipant.template`, `SplitRuleAllocation.splitRule`/`templateParticipant`, `ParticipantEntryAmount.instanceFieldValue`/`templateParticipant`.

### Why the wizard "mostly works"

`Template` is the root entity with no `@ManyToOne` relationships, so it serializes cleanly. Participants/fields are fetched by templateId from the URL context, and the frontend doesn't rely on their nested `templateId` field during wizard creation — so the mismatch is invisible there.

---

## Implementation Plan

### Step 1: Create Response DTOs as Java records

Create in `src/main/java/com/expensesplitter/dto/`:

**`TemplateInstanceResponse.java`**
```java
public record TemplateInstanceResponse(UUID id, UUID templateId, String name, InstanceStatus status, LocalDateTime createdAt) {
    public static TemplateInstanceResponse from(TemplateInstance e) {
        return new TemplateInstanceResponse(e.getId(), e.getTemplate().getId(), e.getName(), e.getStatus(), e.getCreatedAt());
    }
}
```

**`InstanceFieldValueResponse.java`**
```java
public record InstanceFieldValueResponse(UUID id, UUID instanceId, UUID templateFieldId, BigDecimal amount, String note, LocalDate entryDate, SplitMode splitMode, UUID overrideSplitRuleId) {
    public static InstanceFieldValueResponse from(InstanceFieldValue e) {
        return new InstanceFieldValueResponse(e.getId(), e.getInstance().getId(), e.getTemplateField().getId(), e.getAmount(), e.getNote(), e.getEntryDate(), e.getSplitMode(), e.getOverrideSplitRule() != null ? e.getOverrideSplitRule().getId() : null);
    }
}
```

**`TemplateFieldResponse.java`**
```java
public record TemplateFieldResponse(UUID id, UUID templateId, String label, FieldType fieldType, UUID defaultSplitRuleId, BigDecimal defaultAmount, int displayOrder) {
    public static TemplateFieldResponse from(TemplateField e) {
        return new TemplateFieldResponse(e.getId(), e.getTemplate().getId(), e.getLabel(), e.getFieldType(), e.getDefaultSplitRule() != null ? e.getDefaultSplitRule().getId() : null, e.getDefaultAmount(), e.getDisplayOrder());
    }
}
```

**`TemplateParticipantResponse.java`**
```java
public record TemplateParticipantResponse(UUID id, UUID templateId, String name, int displayOrder) {
    public static TemplateParticipantResponse from(TemplateParticipant e) {
        return new TemplateParticipantResponse(e.getId(), e.getTemplate().getId(), e.getName(), e.getDisplayOrder());
    }
}
```

**`SplitRuleResponse.java`**
```java
public record SplitRuleResponse(UUID id, UUID templateId, String name) {
    public static SplitRuleResponse from(SplitRule e) {
        return new SplitRuleResponse(e.getId(), e.getTemplate().getId(), e.getName());
    }
}
```

**`SplitRuleAllocationResponse.java`**
```java
public record SplitRuleAllocationResponse(UUID id, UUID splitRuleId, UUID templateParticipantId, BigDecimal percent) {
    public static SplitRuleAllocationResponse from(SplitRuleAllocation e) {
        return new SplitRuleAllocationResponse(e.getId(), e.getSplitRule().getId(), e.getTemplateParticipant().getId(), e.getPercent());
    }
}
```

**`ParticipantEntryAmountResponse.java`**
```java
public record ParticipantEntryAmountResponse(UUID id, UUID instanceFieldValueId, UUID templateParticipantId, BigDecimal amount) {
    public static ParticipantEntryAmountResponse from(ParticipantEntryAmount e) {
        return new ParticipantEntryAmountResponse(e.getId(), e.getInstanceFieldValue().getId(), e.getTemplateParticipant().getId(), e.getAmount());
    }
}
```

### Step 2: Map inside service methods (while `@Transactional` session is open)

The mapping **must happen inside the service layer**, not the controller — accessing LAZY-loaded fields (e.g. `e.getTemplate().getId()`) requires an open Hibernate session, which is guaranteed inside `@Transactional` service methods.

Update return types across all service methods:

| Service | Method | Old return | New return |
|---------|--------|------------|------------|
| `InstanceService` | `getInstance`, `createInstance`, `settleInstance`, `reopenInstance`, `updateInstanceName` | `TemplateInstance` | `TemplateInstanceResponse` |
| `InstanceService` | `getFieldValues`, `getFieldValuesByField`, `getFieldValue`, `addFieldValue`, `updateFieldValue`, `updateFieldValueAmount`, `updateFieldValueSplitRule` | `InstanceFieldValue` / `List<InstanceFieldValue>` | `InstanceFieldValueResponse` / `List<InstanceFieldValueResponse>` |
| `TemplateService` | `getFields`, `addField`, `updateField` | `TemplateField` / `List<TemplateField>` | `TemplateFieldResponse` / `List<TemplateFieldResponse>` |
| `TemplateService` | `getParticipants`, `addParticipant`, `updateParticipant` | `TemplateParticipant` / `List<TemplateParticipant>` | `TemplateParticipantResponse` / `List<TemplateParticipantResponse>` |
| `TemplateService` | `getSplitRules`, `addSplitRule`, `updateSplitRule` | `SplitRule` / `List<SplitRule>` | `SplitRuleResponse` / `List<SplitRuleResponse>` |
| `TemplateService` | `getSplitRuleAllocations`, `updateSplitRuleAllocations` | `SplitRuleAllocation` / `List<SplitRuleAllocation>` | `SplitRuleAllocationResponse` / `List<SplitRuleAllocationResponse>` |
| `ParticipantEntryAmountService` | all getters/mutators | `ParticipantEntryAmount` / `List<...>` | `ParticipantEntryAmountResponse` / `List<...>` |

`Template` itself is **not changed** — it already serializes correctly (no nested `@ManyToOne` relations with lazy UUIDs the frontend needs).

### Step 3: Update controllers to use new return types

Controllers pass through whatever the service returns — change the generic type parameter in `ApiResponse<T>` to match the new DTO types. The controller bodies themselves won't need logic changes.

### Step 4: No frontend changes needed

The frontend `types/index.ts` already defines the flat UUID shape (e.g., `templateId: string`, `templateFieldId: string`) — this was always the expected contract. The DTOs bring the backend into alignment with what the frontend was already expecting.

---

## Critical Files

- `src/main/java/com/expensesplitter/service/InstanceService.java`
- `src/main/java/com/expensesplitter/service/TemplateService.java`
- `src/main/java/com/expensesplitter/service/ParticipantEntryAmountService.java`
- `src/main/java/com/expensesplitter/controller/InstanceController.java`
- `src/main/java/com/expensesplitter/controller/TemplateController.java`
- `src/main/java/com/expensesplitter/controller/ParticipantEntryAmountController.java`
- New: `src/main/java/com/expensesplitter/dto/` (7 new record files)

---

## Verification

1. `mvn spring-boot:run` — confirm app starts with no errors
2. Open browser to instance detail page — fields should now render
3. In browser Network tab, verify:
   - `GET /api/instances/{id}` returns flat `templateId` UUID (not nested `template` object)
   - `GET /api/instances/{id}/field-values` returns flat `templateFieldId` and `instanceId`
   - `GET /api/templates/{id}/fields` returns flat `templateId` and `defaultSplitRuleId`
4. `mvn test` — confirm no regressions in existing tests
