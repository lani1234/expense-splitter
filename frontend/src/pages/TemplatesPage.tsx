import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import TemplateCard from "@/components/templates/TemplateCard"
import TemplateWizard from "@/components/templates/TemplateWizard"
import NewInstanceDialog from "@/components/instances/NewInstanceDialog"
import { useTemplates } from "@/hooks/useTemplates"

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [newInstanceTemplateId, setNewInstanceTemplateId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define reusable expense structures
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-lg bg-surface animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">No templates yet.</p>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create your first template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onNewInstance={(id) => setNewInstanceTemplateId(id)}
            />
          ))}
        </div>
      )}

      <TemplateWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      <NewInstanceDialog
        open={!!newInstanceTemplateId}
        defaultTemplateId={newInstanceTemplateId ?? undefined}
        onClose={() => setNewInstanceTemplateId(null)}
      />
    </div>
  )
}
