// Enums mirroring backend
export type FieldType = "SINGLE" | "MULTIPLE"
export type InstanceStatus = "IN_PROGRESS" | "SETTLED"
export type SplitMode =
  | "TEMPLATE_FIELD_PERCENT_SPLIT"
  | "FIELD_VALUE_CUSTOM_PERCENT"
  | "FIELD_VALUE_FIXED_AMOUNTS"

// Entities
export interface Template {
  id: string
  userId: string
  name: string
  description?: string
  createdAt: string
}

export interface TemplateParticipant {
  id: string
  templateId: string
  name: string
  displayOrder: number
}

export interface SplitRule {
  id: string
  templateId: string
  name: string
}

export interface SplitRuleAllocation {
  id: string
  splitRuleId: string
  templateParticipantId: string
  percent: number
}

export interface TemplateField {
  id: string
  templateId: string
  label: string
  fieldType: FieldType
  defaultSplitRuleId?: string
  defaultAmount?: number
  displayOrder: number
}

export interface TemplateInstance {
  id: string
  templateId: string
  name: string
  status: InstanceStatus
  createdAt: string
}

export interface InstanceFieldValue {
  id: string
  instanceId: string
  templateFieldId: string
  amount: number
  note?: string
  entryDate?: string
  splitMode: SplitMode
  overrideSplitRuleId?: string
}

export interface ParticipantEntryAmount {
  id: string
  instanceFieldValueId: string
  templateParticipantId: string
  amount: number
}

// Request shapes
export interface AddFieldValueRequest {
  templateFieldId: string
  amount: number
  note?: string
  entryDate?: string
  splitMode: SplitMode
  overrideSplitRuleId?: string
  participantAmounts?: Record<string, number>
}
