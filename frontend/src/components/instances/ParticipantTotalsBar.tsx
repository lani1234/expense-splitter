import { useParticipants } from "@/hooks/useTemplates"
import { useInstanceTotals } from "@/hooks/useFieldValues"

const TILE_COLORS = [
  { bg: "bg-blue-50 border-blue-200",       amount: "text-blue-600"    },
  { bg: "bg-violet-50 border-violet-200",   amount: "text-violet-600"  },
  { bg: "bg-emerald-50 border-emerald-200", amount: "text-emerald-600" },
  { bg: "bg-orange-50 border-orange-200",   amount: "text-orange-600"  },
]

interface Props {
  instanceId: string
  templateId: string
  grandTotal?: number
}

export default function ParticipantTotalsBar({ instanceId, templateId, grandTotal }: Props) {
  const { data: participants = [] } = useParticipants(templateId)
  const { data: totals, isLoading } = useInstanceTotals(instanceId)

  if (participants.length === 0) return null

  const hasPayers = totals?.hasPayers ?? false

  return (
    <div className="flex items-stretch gap-3 flex-wrap">
      {grandTotal !== undefined && (
        <div className="flex flex-col justify-center rounded-xl border px-4 py-2 min-w-[110px] shadow-sm bg-slate-50 border-slate-200">
          <span className="text-xs text-muted-foreground mb-1">Total</span>
          <span className="text-lg font-bold text-slate-700">${grandTotal.toFixed(2)}</span>
        </div>
      )}
      {participants.map((p, i) => {
        const colors = TILE_COLORS[i % TILE_COLORS.length]
        const share = totals?.shares[p.id] ?? 0
        const paid = totals?.paid[p.id] ?? 0
        const net = totals?.net[p.id] ?? 0

        return (
          <div
            key={p.id}
            className={`flex flex-col rounded-xl border px-4 py-2 min-w-[110px] shadow-sm ${colors.bg}`}
          >
            <span className="text-xs text-muted-foreground mb-1">{p.name}</span>

            {hasPayers ? (
              <div className="space-y-0.5">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Share</span>
                  <span className={`font-medium tabular-nums ${colors.amount}`}>
                    {isLoading ? "—" : `$${share.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Paid</span>
                  <span className={`font-medium tabular-nums ${colors.amount}`}>
                    {isLoading ? "—" : `$${paid.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-xs border-t border-current/20 pt-0.5 mt-0.5">
                  <span className="text-muted-foreground font-medium">Net</span>
                  <span
                    className={`font-bold tabular-nums text-sm ${
                      net <= 0 ? "text-emerald-600" : colors.amount
                    }`}
                  >
                    {isLoading ? "—" : (net < 0 ? `-$${Math.abs(net).toFixed(2)}` : `$${net.toFixed(2)}`)}
                  </span>
                </div>
              </div>
            ) : (
              <span className={`text-lg font-bold ${colors.amount}`}>
                {isLoading ? "—" : `$${share.toFixed(2)}`}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
