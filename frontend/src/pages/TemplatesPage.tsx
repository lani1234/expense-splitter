import { useState } from "react"
import { LayoutTemplate, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import TemplateCard from "@/components/templates/TemplateCard"
import TemplateWizard from "@/components/templates/TemplateWizard"
import NewInstanceDialog from "@/components/instances/NewInstanceDialog"
import { useTemplates } from "@/hooks/useTemplates"
import { useAuth } from "@/context/AuthContext"

export default function TemplatesPage() {
  const { isLoading: authLoading } = useAuth()
  const { data: templates = [], isLoading: templatesLoading } = useTemplates()
  const isLoading = authLoading || templatesLoading
  const [wizardOpen, setWizardOpen] = useState(false)
  const [newInstanceTemplateId, setNewInstanceTemplateId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {templates.length > 0 && (
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
      )}

      {isLoading ? null : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <LayoutTemplate className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Create your first template</h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-8">
            Define the structure once — participants, expense fields, and how costs split — then reuse it as many times as you need.
          </p>
          <Button size="lg" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
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
        key={newInstanceTemplateId ?? ""}
        open={!!newInstanceTemplateId}
        defaultTemplateId={newInstanceTemplateId ?? undefined}
        onClose={() => setNewInstanceTemplateId(null)}
      />
    </div>
  )
}
