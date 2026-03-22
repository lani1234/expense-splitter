import client from "./client"
import type {
  TemplateInstance,
  InstanceStatus,
  InstanceFieldValue,
  AddFieldValueRequest,
  SplitMode,
} from "@/types"

// Instances
export const createInstance = (templateId: string, name: string) =>
  client
    .post<TemplateInstance>(`/instances`, null, { params: { templateId, name } })
    .then((r) => r.data)

export const getInstance = (id: string) =>
  client.get<TemplateInstance>(`/instances/${id}`).then((r) => r.data)

export const getInstancesByTemplate = (templateId: string) =>
  client
    .get<TemplateInstance[]>(`/instances/template/${templateId}`)
    .then((r) => r.data)

export const getInstancesByStatus = (templateId: string, status: InstanceStatus) =>
  client
    .get<TemplateInstance[]>(`/instances/template/${templateId}/status/${status}`)
    .then((r) => r.data)

export const getAllInstances = () =>
  client.get<TemplateInstance[]>(`/instances`).then((r) => r.data)

export const renameInstance = (id: string, name: string) =>
  client
    .put<TemplateInstance>(`/instances/${id}/name`, null, { params: { name } })
    .then((r) => r.data)

export const settleInstance = (id: string) =>
  client.put<TemplateInstance>(`/instances/${id}/settle`).then((r) => r.data)

export const reopenInstance = (id: string) =>
  client.put<TemplateInstance>(`/instances/${id}/reopen`).then((r) => r.data)

export const deleteInstance = (id: string) =>
  client.delete(`/instances/${id}`)

// Field Values
export const getFieldValues = (instanceId: string) =>
  client
    .get<InstanceFieldValue[]>(`/instances/${instanceId}/field-values`)
    .then((r) => r.data)

export const getFieldValuesByField = (instanceId: string, templateFieldId: string) =>
  client
    .get<InstanceFieldValue[]>(
      `/instances/${instanceId}/field-values/field/${templateFieldId}`
    )
    .then((r) => r.data)

export const addFieldValue = (instanceId: string, request: AddFieldValueRequest) =>
  client
    .post<InstanceFieldValue>(`/instances/${instanceId}/field-values`, request)
    .then((r) => r.data)

export const updateFieldValueAmount = (fieldValueId: string, amount: number) =>
  client
    .put<InstanceFieldValue>(`/instances/field-values/${fieldValueId}/amount`, null, {
      params: { amount },
    })
    .then((r) => r.data)

export const updateFieldValueSplitRule = (fieldValueId: string, splitRuleId: string) =>
  client
    .put<InstanceFieldValue>(
      `/instances/field-values/${fieldValueId}/split-rule`,
      null,
      { params: { splitRuleId } }
    )
    .then((r) => r.data)

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
    .put<InstanceFieldValue>(`/instances/field-values/${fieldValueId}`, params.participantAmounts ?? null, {
      params: {
        amount: params.amount,
        note: params.note,
        splitMode: params.splitMode,
        overrideSplitRuleId: params.overrideSplitRuleId,
      },
    })
    .then((r) => r.data)

export const deleteFieldValue = (fieldValueId: string) =>
  client.delete(`/instances/field-values/${fieldValueId}`)
