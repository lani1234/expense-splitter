import { useParticipants } from "@/hooks/useTemplates"
import { useParticipantTotal } from "@/hooks/useFieldValues"

const TILE_COLORS = [
  { bg: "bg-blue-50 border-blue-200",       amount: "text-blue-600"    },
  { bg: "bg-violet-50 border-violet-200",   amount: "text-violet-600"  },
  { bg: "bg-emerald-50 border-emerald-200", amount: "text-emerald-600" },
  { bg: "bg-orange-50 border-orange-200",   amount: "text-orange-600"  },
]

interface ParticipantTileProps {
  instanceId: string
  participantId: string
  participantName: string
  colorIndex: number
}

function ParticipantTile({ instanceId, participantId, participantName, colorIndex }: ParticipantTileProps) {
  const { data: total, isLoading } = useParticipantTotal(instanceId, participantId)
  const colors = TILE_COLORS[colorIndex % TILE_COLORS.length]
  return (
    <div className={`flex flex-col items-center rounded-xl border px-5 py-3 min-w-[100px] shadow-sm ${colors.bg}`}>
      <span className="text-xs text-muted-foreground mb-1">{participantName}</span>
      <span className={`text-lg font-bold ${colors.amount}`}>
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
      {participants.map((p, i) => (
        <ParticipantTile
          key={p.id}
          instanceId={instanceId}
          participantId={p.id}
          participantName={p.name}
          colorIndex={i}
        />
      ))}
    </div>
  )
}
