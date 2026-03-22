import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as instanceApi from "@/api/instances"
import * as amountsApi from "@/api/participantAmounts"
import type { AddFieldValueRequest, SplitMode } from "@/types"
import { INSTANCE_KEYS } from "./useInstances"

export const TOTALS_KEY = (instanceId: string, participantId: string) =>
  ["participant-totals", instanceId, participantId] as const

export function useParticipantTotal(instanceId: string, participantId: string) {
  return useQuery({
    queryKey: TOTALS_KEY(instanceId, participantId),
    queryFn: () => amountsApi.getParticipantTotal(instanceId, participantId),
    enabled: !!instanceId && !!participantId,
  })
}

export function useAmountsByFieldValue(fieldValueId: string) {
  return useQuery({
    queryKey: ["participant-entry-amounts", "field-value", fieldValueId],
    queryFn: () => amountsApi.getAmountsByFieldValue(fieldValueId),
    enabled: !!fieldValueId,
  })
}

export function useAddFieldValue(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: AddFieldValueRequest) =>
      instanceApi.addFieldValue(instanceId, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.fieldValues(instanceId) })
      qc.invalidateQueries({ queryKey: ["participant-totals", instanceId] })
    },
  })
}

export function useUpdateFieldValueAmount(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fieldValueId, amount }: { fieldValueId: string; amount: number }) =>
      instanceApi.updateFieldValueAmount(fieldValueId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.fieldValues(instanceId) })
      qc.invalidateQueries({ queryKey: ["participant-totals", instanceId] })
    },
  })
}

export function useUpdateFieldValueSplitRule(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      fieldValueId,
      splitRuleId,
    }: {
      fieldValueId: string
      splitRuleId: string
    }) => instanceApi.updateFieldValueSplitRule(fieldValueId, splitRuleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.fieldValues(instanceId) })
      qc.invalidateQueries({ queryKey: ["participant-totals", instanceId] })
    },
  })
}

export function useUpdateFieldValue(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      fieldValueId: string
      amount: number
      note?: string
      splitMode: SplitMode
      overrideSplitRuleId?: string
      participantAmounts?: Record<string, number>
    }) => instanceApi.updateFieldValue(params.fieldValueId, params),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.fieldValues(instanceId) })
      qc.invalidateQueries({ queryKey: ["participant-entry-amounts", "field-value", vars.fieldValueId] })
      qc.invalidateQueries({ queryKey: ["participant-totals", instanceId] })
    },
  })
}

export function useDeleteFieldValue(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fieldValueId: string) => instanceApi.deleteFieldValue(fieldValueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.fieldValues(instanceId) })
      qc.invalidateQueries({ queryKey: ["participant-totals", instanceId] })
    },
  })
}
