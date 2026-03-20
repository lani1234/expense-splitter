import { useNavigate } from "react-router-dom"
import { Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useParticipants } from "@/hooks/useTemplates"
import { useParticipantTotal } from "@/hooks/useFieldValues"
import type { TemplateInstance } from "@/types"

interface ParticipantTotalProps {
  instanceId: string
  participantId: string
  participantName: string
}

function ParticipantTotal({ instanceId, participantId, participantName }: ParticipantTotalProps) {
  const { data: total } = useParticipantTotal(instanceId, participantId)
  return (
    <span className="text-xs text-muted-foreground">
      {participantName}: <span className="text-foreground font-medium">${(total ?? 0).toFixed(2)}</span>
    </span>
  )
}

interface Props {
  instance: TemplateInstance
  templateName?: string
}

export default function InstanceCard({ instance, templateName }: Props) {
  const navigate = useNavigate()
  const { data: participants = [] } = useParticipants(instance.templateId)
  const isSettled = instance.status === "SETTLED"

  const formattedDate = new Date(instance.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Card
      className="bg-surface border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
      onClick={() => navigate(`/instances/${instance.id}`)}
    >
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{instance.name}</h3>
            {templateName && (
              <p className="text-xs text-muted-foreground">{templateName}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={
              isSettled
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-border text-muted-foreground"
            }
          >
            {isSettled ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {isSettled ? "Settled" : "In Progress"}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          {participants.map((p) => (
            <ParticipantTotal
              key={p.id}
              instanceId={instance.id}
              participantId={p.id}
              participantName={p.name}
            />
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </CardContent>
    </Card>
  )
}
