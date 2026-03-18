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
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Settled expense periods</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-surface animate-pulse" />
          ))}
        </div>
      ) : settled.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16">
          <p className="text-muted-foreground">No settled instances yet.</p>
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
