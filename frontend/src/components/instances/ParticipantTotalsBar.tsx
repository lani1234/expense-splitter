import { useParticipants } from "@/hooks/useTemplates"
import { useParticipantTotal } from "@/hooks/useFieldValues"

interface ParticipantTileProps {
  instanceId: string
  participantId: string
  participantName: string
}

function ParticipantTile({ instanceId, participantId, participantName }: ParticipantTileProps) {
  const { data: total, isLoading } = useParticipantTotal(instanceId, participantId)
  return (
    <div className="flex flex-col items-center rounded-lg bg-surface-elevated px-5 py-3 min-w-[100px]">
      <span className="text-xs text-muted-foreground mb-1">{participantName}</span>
      <span className="text-lg font-bold text-primary">
        {isLoading ? "—" : `$${(total ?? 0).toFixed(2)}`}
      </span>
    </div>
  )
}

interface Props {
  instanceId: string
  templateId: string
}

export default function ParticipantTotalsBar({ instanceId, templateId }: Props) {
  const { data: participants = [] } = useParticipants(templateId)

  if (participants.length === 0) return null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Totals</span>
      {participants.map((p) => (
        <ParticipantTile
          key={p.id}
          instanceId={instanceId}
          participantId={p.id}
          participantName={p.name}
        />
      ))}
    </div>
  )
}
