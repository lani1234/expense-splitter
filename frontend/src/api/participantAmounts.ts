import client from "./client"
import type { ParticipantEntryAmount } from "@/types"

export const getAmountsByFieldValue = (fieldValueId: string) =>
  client
    .get<ParticipantEntryAmount[]>(`/participant-entry-amounts/field-value/${fieldValueId}`)
    .then((r) => r.data)

export const getParticipantTotal = (instanceId: string, participantId: string) =>
  client
    .get<number>(
      `/participant-entry-amounts/instance/${instanceId}/participant/${participantId}/total`
    )
    .then((r) => r.data)

export const updateParticipantEntryAmount = (id: string, amount: number) =>
  client
    .put<ParticipantEntryAmount>(`/participant-entry-amounts/${id}`, null, {
      params: { amount },
    })
    .then((r) => r.data)
