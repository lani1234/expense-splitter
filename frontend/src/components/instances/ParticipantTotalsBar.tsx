import { useParticipants } from "@/hooks/useTemplates"
import { useInstanceTotals } from "@/hooks/useFieldValues"
import { participantGradient } from "@/lib/participantColors"

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
        <div className="glass-card flex flex-col justify-center px-4 py-3 min-w-[110px]" style={{ borderRadius: "0.875rem" }}>
          <span className="text-xs text-foreground/40 mb-1">Total</span>
          <span className="text-lg font-bold text-foreground/75" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ${grandTotal.toFixed(2)}
          </span>
        </div>
      )}
      {participants.map((p, i) => {
        const share = totals?.shares[p.id] ?? 0
        const paid = totals?.paid[p.id] ?? 0
        const net = totals?.net[p.id] ?? 0

        return (
          <div key={p.id} className="glass-card flex flex-col px-4 py-3 min-w-[110px]" style={{ borderRadius: "0.875rem" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: participantGradient(i),
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
                }}
              >
                {i + 1}
              </span>
              <span className="text-xs text-foreground/55 font-medium">{p.name}</span>
            </div>

            {hasPayers ? (
              <div className="space-y-0.5">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-foreground/40">Share</span>
                  <span className="font-medium tabular-nums text-foreground/65" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {isLoading ? "—" : `$${share.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-foreground/40">Paid</span>
                  <span className="font-medium tabular-nums text-foreground/65" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {isLoading ? "—" : `$${paid.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-xs border-t border-black/[0.06] pt-0.5 mt-0.5">
                  <span className="text-foreground/50 font-medium">Net</span>
                  <span
                    className="font-bold tabular-nums text-sm"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: net <= 0 ? "#059669" : "#c2410c",
                    }}
                  >
                    {isLoading ? "—" : net < 0 ? `-$${Math.abs(net).toFixed(2)}` : `$${net.toFixed(2)}`}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-foreground/75" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {isLoading ? "—" : `$${share.toFixed(2)}`}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
