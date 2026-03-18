import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import InstanceCard from "@/components/instances/InstanceCard"
import NewInstanceDialog from "@/components/instances/NewInstanceDialog"
import { useAllInstances } from "@/hooks/useInstances"
import { useTemplates } from "@/hooks/useTemplates"

export default function InstancesPage() {
  const { data: instances = [], isLoading } = useAllInstances()
  const { data: templates = [] } = useTemplates()
  const [dialogOpen, setDialogOpen] = useState(false)

  const activeInstances = [...instances]
    .filter((i) => i.status === "IN_PROGRESS")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t.name]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Active Instances</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ongoing expense tracking periods
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Instance
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-surface animate-pulse" />
          ))}
        </div>
      ) : activeInstances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">No active instances.</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create an instance
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeInstances.map((inst) => (
            <InstanceCard
              key={inst.id}
              instance={inst}
              templateName={templateMap[inst.templateId]}
            />
          ))}
        </div>
      )}

      <NewInstanceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
