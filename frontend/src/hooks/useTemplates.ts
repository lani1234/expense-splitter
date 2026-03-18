import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api/templates"
import { CURRENT_USER_ID } from "@/config/constants"

export const TEMPLATE_KEYS = {
  all: ["templates"] as const,
  byUser: () => ["templates", "user", CURRENT_USER_ID] as const,
  detail: (id: string) => ["templates", id] as const,
  participants: (templateId: string) => ["templates", templateId, "participants"] as const,
  splitRules: (templateId: string) => ["templates", templateId, "split-rules"] as const,
  allocations: (splitRuleId: string) => ["split-rules", splitRuleId, "allocations"] as const,
  fields: (templateId: string) => ["templates", templateId, "fields"] as const,
}

export function useTemplates() {
  return useQuery({
    queryKey: TEMPLATE_KEYS.byUser(),
    queryFn: () => api.getTemplatesByUser(CURRENT_USER_ID),
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.detail(id),
    queryFn: () => api.getTemplate(id),
    enabled: !!id,
  })
}

export function useParticipants(templateId: string) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.participants(templateId),
    queryFn: () => api.getParticipants(templateId),
    enabled: !!templateId,
  })
}

export function useSplitRules(templateId: string) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.splitRules(templateId),
    queryFn: () => api.getSplitRules(templateId),
    enabled: !!templateId,
  })
}

export function useAllocations(splitRuleId: string) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.allocations(splitRuleId),
    queryFn: () => api.getAllocations(splitRuleId),
    enabled: !!splitRuleId,
  })
}

export function useFields(templateId: string) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.fields(templateId),
    queryFn: () => api.getFields(templateId),
    enabled: !!templateId,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      api.createTemplate(CURRENT_USER_ID, name, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.byUser() }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.byUser() }),
  })
}
