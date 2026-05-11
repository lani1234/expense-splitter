import { useState } from "react"
import { LayoutTemplate, Plus, ReceiptText } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import InstanceCard from "@/components/instances/InstanceCard"
import NewInstanceDialog from "@/components/instances/NewInstanceDialog"
import { useAllInstances } from "@/hooks/useInstances"
import { useTemplates } from "@/hooks/useTemplates"

export default function InstancesPage() {
  const navigate = useNavigate()
  const { data: instances = [], isLoading } = useAllInstances()
  const { data: templates = [], isLoading: templatesLoading } = useTemplates()
  const [dialogOpen, setDialogOpen] = useState(false)

  const activeInstances = [...instances]
    .filter((i) => i.status === "IN_PROGRESS")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t.name]))
  const loading = isLoading || templatesLoading

  return (
    <div className="space-y-6">
      {activeInstances.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground/85">Active Splits</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Splits in progress
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Split
          </Button>
        </div>
      )}

      {loading ? null : activeInstances.length === 0 ? (
        templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <LayoutTemplate className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No templates yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-8">
              You need at least one template before you can start a split.
            </p>
            <Button size="lg" onClick={() => navigate("/templates")}>
              Go to Templates
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <ReceiptText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No active splits</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-8">
              Start a new split from one of your templates to begin tracking expenses.
            </p>
            <Button size="lg" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Split
            </Button>
          </div>
        )
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
