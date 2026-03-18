# Expense Splitter API Reference

**Base URL:** `http://localhost:8080/api` (development) | `https://api.expensesplitter.com/api` (production)

## Table of Contents
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Templates](#templates)
- [Participants](#participants)
- [Split Rules](#split-rules)
- [Fields](#fields)
- [Instances](#instances)
- [Field Values](#field-values)
- [Allocations](#allocations)

---

## Authentication

Currently no authentication is implemented. All endpoints are public.

**Future:** Will implement JWT-based authentication for multi-user support.

---

## Response Format

All API responses follow a standard envelope format:

```json
{
  "success": true,
  "data": { /* entity or array */ },
  "message": null
}
```

**Fields:**
- `success` (boolean): Whether the request succeeded
- `data` (object|array): The response payload (null on error)
- `message` (string|null): Error message or null on success

---

## Error Handling

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Example
```json
{
  "success": false,
  "message": "Amount must be greater than zero"
}
```

---

## Templates

Templates define the structure for expense tracking. They contain participants, fields, and split rules.

### Create Template

**Endpoint:** `POST /templates`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User creating the template |
| name | string | Yes | Template name (max 255 chars) |
| description | string | No | Template description |

**Example Request:**
```bash
POST /templates?userId=550e8400-e29b-41d4-a716-446655440000&name=Monthly+Expenses&description=Regular+shared+expenses
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "4ed10f8c-b737-4978-8255-40de30393610",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Monthly Expenses",
    "description": "Regular shared expenses",
    "createdAt": "2026-03-10T12:21:19.764744"
  }
}
```

---

### Get User's Templates

**Endpoint:** `GET /templates/user/{userId}`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | User ID |

**Example Request:**
```bash
GET /templates/user/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "4ed10f8c-b737-4978-8255-40de30393610",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Monthly Expenses",
      "description": "Regular shared expenses",
      "createdAt": "2026-03-10T12:21:19.764744"
    }
  ]
}
```

---

### Get Template

**Endpoint:** `GET /templates/{templateId}`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

---

## Participants

Participants are people who share expenses. They belong to a template and are referenced in split rules.

### Add Participant

**Endpoint:** `POST /templates/{templateId}/participants`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Participant name (max 255 chars) |
| displayOrder | integer | Yes | Order to display in UI (1, 2, 3, ...) |

**Example Request:**
```bash
POST /templates/4ed10f8c-b737-4978-8255-40de30393610/participants?name=Alice&displayOrder=1
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "cc6081ec-6877-49a8-89d4-5f88d3e2126e",
    "name": "Alice",
    "displayOrder": 1
  }
}
```

---

### Get Participants

**Endpoint:** `GET /templates/{templateId}/participants`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

---

## Split Rules

Split rules define how expenses are divided among participants. They are percentage-based and can be overridden per field value.

### Create Split Rule

**Endpoint:** `POST /templates/{templateId}/split-rules`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Split rule name (max 255 chars) |

**Example Request:**
```bash
POST /templates/4ed10f8c-b737-4978-8255-40de30393610/split-rules?name=60/40+Split
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "feeb961a-9076-4eb8-b98d-7a4952f0f579",
    "name": "60/40 Split",
    "template": { /* template data */ }
  }
}
```

---

### Add Allocation to Split Rule

**Endpoint:** `POST /templates/split-rules/{splitRuleId}/allocations`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| splitRuleId | UUID | Split rule ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| participantId | UUID | Yes | Participant ID |
| percent | decimal | Yes | Percentage allocation (0-100) |

**Example Request:**
```bash
POST /templates/split-rules/feeb961a-9076-4eb8-b98d-7a4952f0f579/allocations?participantId=cc6081ec-6877-49a8-89d4-5f88d3e2126e&percent=60.00
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "053895b3-a038-4134-8b54-a8f19eea91a3",
    "percent": 60.00,
    "splitRule": { /* split rule data */ },
    "templateParticipant": { /* participant data */ }
  }
}
```

---

### Get Split Rules

**Endpoint:** `GET /templates/{templateId}/split-rules`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

---

### Get Split Rule Allocations

**Endpoint:** `GET /templates/split-rules/{splitRuleId}/allocations`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| splitRuleId | UUID | Split rule ID |

---

## Fields

Fields define the categories of expenses in a template (e.g., Groceries, Mortgage, Utilities).

### Add Field

**Endpoint:** `POST /templates/{templateId}/fields`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| label | string | Yes | Field name (max 255 chars) |
| fieldType | enum | Yes | `SINGLE` or `MULTIPLE` |
| displayOrder | integer | Yes | Order to display in UI |
| defaultSplitRuleId | UUID | No | Split rule to use by default |
| defaultAmount | decimal | No | Default amount for this field (minimum 0) |

**Field Types:**
- `SINGLE` - Only one value per instance
- `MULTIPLE` - Multiple values per instance (e.g., multiple grocery trips)

**Example Request:**
```bash
POST /templates/4ed10f8c-b737-4978-8255-40de30393610/fields?label=Groceries&fieldType=MULTIPLE&defaultSplitRuleId=feeb961a-9076-4eb8-b98d-7a4952f0f579&displayOrder=1
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
    "label": "Groceries",
    "fieldType": "MULTIPLE",
    "displayOrder": 1,
    "defaultAmount": null,
    "defaultSplitRule": { /* split rule data */ }
  }
}
```

---

### Get Fields

**Endpoint:** `GET /templates/{templateId}/fields`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

---

## Instances

Instances are concrete expenses tracking sessions based on a template. When created, they auto-populate with all template fields.

### Create Instance

**Endpoint:** `POST /instances`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| templateId | UUID | Yes | Template to use |
| name | string | Yes | Instance name (max 255 chars) |

**Behavior:**
- Auto-creates field values for ALL template fields
- Sets field values to default amount or $0
- Calculates allocations for fields with amounts

**Example Request:**
```bash
POST /instances?templateId=4ed10f8c-b737-4978-8255-40de30393610&name=March+2026
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "abc12345-6789-0def-ghij-klmnopqrstuv",
    "template": { /* template data */ },
    "name": "March 2026",
    "status": "IN_PROGRESS",
    "createdAt": "2026-03-17T12:00:00.000000"
  }
}
```

---

### Get Instance

**Endpoint:** `GET /instances/{instanceId}`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| instanceId | UUID | Instance ID |

---

### Get All Instances for Template

**Endpoint:** `GET /instances/template/{templateId}`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |

---

### Get Instances by Status

**Endpoint:** `GET /instances/template/{templateId}/status/{status}`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | UUID | Template ID |
| status | enum | `IN_PROGRESS` or `SETTLED` |

---

## Field Values

Field values represent actual expenses in an instance. Each one tracks an amount, split rule, and optional notes.

### Add Field Value (Expense)

**Endpoint:** `POST /instances/{instanceId}/field-values`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| instanceId | UUID | Instance ID |

**Request Body:**
```json
{
  "templateFieldId": "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
  "amount": 75.50,
  "note": "Weekly groceries",
  "entryDate": "2026-03-17",
  "splitMode": "TEMPLATE_FIELD_PERCENT_SPLIT",
  "overrideSplitRuleId": null,
  "participantAmounts": null
}
```

**Field Value Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateFieldId | UUID | Yes | Which field this expense is for |
| amount | decimal | Yes | Expense amount (>0) |
| note | string | No | Optional note |
| entryDate | date | No | Date of expense (defaults to today) |
| splitMode | enum | No | How to split (defaults to TEMPLATE_FIELD_PERCENT_SPLIT) |
| overrideSplitRuleId | UUID | No | Custom split rule (for FIELD_VALUE_CUSTOM_PERCENT) |
| participantAmounts | object | No | Fixed amounts per participant (for FIELD_VALUE_FIXED_AMOUNTS) |

**Split Modes:**

| Mode | Description | Use Case |
|------|-------------|----------|
| `TEMPLATE_FIELD_PERCENT_SPLIT` | Use the field's default split rule | Standard expenses |
| `FIELD_VALUE_CUSTOM_PERCENT` | Custom percentages for this expense | One-off different split |
| `FIELD_VALUE_FIXED_AMOUNTS` | Fixed dollar amounts per person | Precise cost allocation |

**Example: Custom Percentages**
```json
{
  "templateFieldId": "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
  "amount": 100.00,
  "splitMode": "FIELD_VALUE_CUSTOM_PERCENT",
  "overrideSplitRuleId": "feeb961a-9076-4eb8-b98d-7a4952f0f579"
}
```

**Example: Fixed Amounts**
```json
{
  "templateFieldId": "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
  "amount": 109.00,
  "splitMode": "FIELD_VALUE_FIXED_AMOUNTS",
  "participantAmounts": {
    "cc6081ec-6877-49a8-89d4-5f88d3e2126e": 80.00,
    "32d3dddd-2619-4945-8e2f-906efd2c5ae4": 29.00
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "xyz98765-4321-0fed-cba-jihgfedcba98",
    "instance": { /* instance data */ },
    "templateField": { /* field data */ },
    "amount": 75.50,
    "note": "Weekly groceries",
    "entryDate": "2026-03-17",
    "splitMode": "TEMPLATE_FIELD_PERCENT_SPLIT",
    "overrideSplitRule": null
  }
}
```

---

### Get Field Values for Instance

**Endpoint:** `GET /instances/{instanceId}/field-values`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| instanceId | UUID | Instance ID |

---

### Update Field Value Amount

**Endpoint:** `PUT /instances/field-values/{fieldValueId}/amount`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| fieldValueId | UUID | Field value ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | decimal | Yes | New amount |

**Behavior:**
- Recalculates allocations based on current split rule
- Amount can be 0

**Example Request:**
```bash
PUT /instances/field-values/xyz98765-4321-0fed-cba-jihgfedcba98/amount?amount=85.00
```

---

### Update Field Value Split Rule

**Endpoint:** `PUT /instances/field-values/{fieldValueId}/split-rule`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| fieldValueId | UUID | Field value ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| splitRuleId | UUID | Yes | New split rule ID |

**Behavior:**
- Updates to FIELD_VALUE_CUSTOM_PERCENT mode
- Recalculates allocations with new split

**Example Request:**
```bash
PUT /instances/field-values/xyz98765-4321-0fed-cba-jihgfedcba98/split-rule?splitRuleId=feeb961a-9076-4eb8-b98d-7a4952f0f579
```

---

### Delete Field Value

**Endpoint:** `DELETE /instances/field-values/{fieldValueId}`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| fieldValueId | UUID | Field value ID |

**Behavior:**
- Cascades delete to related ParticipantEntryAmount records
- Updates instance totals

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Field value deleted successfully"
}
```

---

## Allocations

Allocations represent how much each participant owes for an expense.

### Get All Allocations

**Endpoint:** `GET /participant-entry-amounts`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "alloc-1",
      "instanceFieldValue": { /* field value data */ },
      "templateParticipant": { /* participant data */ },
      "amount": 45.30
    }
  ]
}
```

---

### Get Participant Total for Instance

**Endpoint:** `GET /participant-entry-amounts/instance/{instanceId}/participant/{participantId}/total`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| instanceId | UUID | Instance ID |
| participantId | UUID | Participant ID |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": 1722.50
}
```

This returns the total amount the participant owes across all expenses in the instance.

---

### Get Allocations for Field Value

**Endpoint:** `GET /participant-entry-amounts/field-value/{fieldValueId}`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| fieldValueId | UUID | Field value ID |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "alloc-1",
      "instanceFieldValue": { /* field value data */ },
      "templateParticipant": {
        "id": "cc6081ec-6877-49a8-89d4-5f88d3e2126e",
        "name": "Alice",
        "displayOrder": 1
      },
      "amount": 45.30
    },
    {
      "id": "alloc-2",
      "instanceFieldValue": { /* field value data */ },
      "templateParticipant": {
        "id": "32d3dddd-2619-4945-8e2f-906efd2c5ae4",
        "name": "Bob",
        "displayOrder": 2
      },
      "amount": 29.70
    }
  ]
}
```

---

## Common Workflows

### Creating a Monthly Expense Tracker

1. **Create Template**
   ```bash
   POST /templates?userId=YOUR_USER_ID&name=March+2026
   ```

2. **Add Participants**
   ```bash
   POST /templates/{templateId}/participants?name=Alice&displayOrder=1
   POST /templates/{templateId}/participants?name=Bob&displayOrder=2
   ```

3. **Create Split Rule**
   ```bash
   POST /templates/{templateId}/split-rules?name=Equal+Split
   POST /templates/split-rules/{splitRuleId}/allocations?participantId={aliceId}&percent=50
   POST /templates/split-rules/{splitRuleId}/allocations?participantId={bobId}&percent=50
   ```

4. **Add Fields**
   ```bash
   POST /templates/{templateId}/fields?label=Groceries&fieldType=MULTIPLE&defaultSplitRuleId={splitRuleId}&displayOrder=1
   POST /templates/{templateId}/fields?label=Mortgage&fieldType=SINGLE&defaultAmount=2500&defaultSplitRuleId={splitRuleId}&displayOrder=2
   ```

5. **Create Instance**
   ```bash
   POST /instances?templateId={templateId}&name=March+2026
   ```
   This auto-creates field values with defaults!

6. **Add Expenses**
   ```bash
   POST /instances/{instanceId}/field-values
   {
     "templateFieldId": "{groceriesFieldId}",
     "amount": 75.50,
     "note": "Weekly groceries"
   }
   ```

7. **Check Totals**
   ```bash
   GET /participant-entry-amounts/instance/{instanceId}/participant/{aliceId}/total
   ```

---

## Rate Limiting

Currently no rate limiting is implemented.

**Future:** Will implement rate limiting per user after authentication is added.

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Full CRUD for templates, participants, split rules, fields, instances, field values
- Flexible split modes (percentages, custom percentages, fixed amounts)
- Automatic field value creation and allocation calculation
