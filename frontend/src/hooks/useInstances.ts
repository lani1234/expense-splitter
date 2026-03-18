import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api/instances"

export const INSTANCE_KEYS = {
  all: ["instances"] as const,
  detail: (id: string) => ["instances", id] as const,
  fieldValues: (instanceId: string) => ["instances", instanceId, "field-values"] as const,
}

export function useAllInstances() {
  return useQuery({
    queryKey: INSTANCE_KEYS.all,
    queryFn: api.getAllInstances,
  })
}

export function useInstance(id: string) {
  return useQuery({
    queryKey: INSTANCE_KEYS.detail(id),
    queryFn: () => api.getInstance(id),
    enabled: !!id,
  })
}

export function useFieldValues(instanceId: string) {
  return useQuery({
    queryKey: INSTANCE_KEYS.fieldValues(instanceId),
    queryFn: () => api.getFieldValues(instanceId),
    enabled: !!instanceId,
  })
}

export function useCreateInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) =>
      api.createInstance(templateId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSTANCE_KEYS.all }),
  })
}

export function useSettleInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.settleInstance(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.all })
    },
  })
}

export function useReopenInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.reopenInstance(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.all })
    },
  })
}

export function useDeleteInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteInstance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSTANCE_KEYS.all }),
  })
}
