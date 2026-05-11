import InstanceCard from "@/components/instances/InstanceCard"
import { useAllInstances } from "@/hooks/useInstances"
import { useTemplates } from "@/hooks/useTemplates"

export default function SettledPage() {
  const { data: instances = [], isLoading } = useAllInstances()
  const { data: templates = [] } = useTemplates()

  const settled = [...instances]
    .filter((i) => i.status === "SETTLED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t.name]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground/85" style={{ fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}>History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Settled splits</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-surface animate-pulse" />
          ))}
        </div>
      ) : settled.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl py-16" style={{ border: "1px dashed rgba(28,22,46,0.15)" }}>
          <p className="text-foreground/45">No settled splits yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settled.map((inst) => (
            <InstanceCard
              key={inst.id}
              instance={inst}
              templateName={templateMap[inst.templateId]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
