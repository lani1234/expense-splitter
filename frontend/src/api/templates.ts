import client from "./client"
import type {
  Template,
  TemplateParticipant,
  SplitRule,
  SplitRuleAllocation,
  TemplateField,
  FieldType,
} from "@/types"

// Templates
export const getTemplatesByUser = (userId: string) =>
  client.get<Template[]>(`/templates/user/${userId}`).then((r) => r.data)

export const getTemplate = (id: string) =>
  client.get<Template>(`/templates/${id}`).then((r) => r.data)

export const createTemplate = (userId: string, name: string, description?: string) =>
  client
    .post<Template>(`/templates`, null, { params: { userId, name, description } })
    .then((r) => r.data)

export const updateTemplate = (id: string, name: string, description?: string) =>
  client
    .put<Template>(`/templates/${id}`, null, { params: { name, description } })
    .then((r) => r.data)

export const deleteTemplate = (id: string) =>
  client.delete(`/templates/${id}`)

// Participants
export const getParticipants = (templateId: string) =>
  client
    .get<TemplateParticipant[]>(`/templates/${templateId}/participants`)
    .then((r) => r.data)

export const createParticipant = (templateId: string, name: string, displayOrder: number) =>
  client
    .post<TemplateParticipant>(`/templates/${templateId}/participants`, null, {
      params: { name, displayOrder },
    })
    .then((r) => r.data)

export const deleteParticipant = (participantId: string) =>
  client.delete(`/templates/participants/${participantId}`)

// Split Rules
export const getSplitRules = (templateId: string) =>
  client
    .get<SplitRule[]>(`/templates/${templateId}/split-rules`)
    .then((r) => r.data)

export const createSplitRule = (templateId: string, name: string) =>
  client
    .post<SplitRule>(`/templates/${templateId}/split-rules`, null, {
      params: { name },
    })
    .then((r) => r.data)

export const deleteSplitRule = (splitRuleId: string) =>
  client.delete(`/templates/split-rules/${splitRuleId}`)

// Split Rule Allocations
export const getAllocations = (splitRuleId: string) =>
  client
    .get<SplitRuleAllocation[]>(`/templates/split-rules/${splitRuleId}/allocations`)
    .then((r) => r.data)

export const createAllocation = (
  splitRuleId: string,
  participantId: string,
  percent: number
) =>
  client
    .post<SplitRuleAllocation>(
      `/templates/split-rules/${splitRuleId}/allocations`,
      null,
      { params: { participantId, percent } }
    )
    .then((r) => r.data)

export const deleteAllocation = (allocationId: string) =>
  client.delete(`/templates/allocations/${allocationId}`)

// Fields
export const getFields = (templateId: string) =>
  client
    .get<TemplateField[]>(`/templates/${templateId}/fields`)
    .then((r) => r.data)

export const createField = (
  templateId: string,
  label: string,
  fieldType: FieldType,
  displayOrder: number,
  defaultSplitRuleId?: string,
  defaultAmount?: number
) =>
  client
    .post<TemplateField>(`/templates/${templateId}/fields`, null, {
      params: { label, fieldType, displayOrder, defaultSplitRuleId, defaultAmount },
    })
    .then((r) => r.data)

export const deleteField = (fieldId: string) =>
  client.delete(`/templates/fields/${fieldId}`)
