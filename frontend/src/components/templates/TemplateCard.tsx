import { useState } from "react"
import { Users, LayoutList, Trash2, Pencil } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useParticipants, useFields, useDeleteTemplate } from "@/hooks/useTemplates"
import type { Template } from "@/types"

interface Props {
  template: Template
  onNewInstance: (templateId: string) => void
}

export default function TemplateCard({ template, onNewInstance }: Props) {
  const navigate = useNavigate()
  const { data: participants = [] } = useParticipants(template.id)
  const { data: fields = [] } = useFields(template.id)
  const deleteTemplate = useDeleteTemplate()
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleteError("")
    try {
      await deleteTemplate.mutateAsync(template.id)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed")
      setConfirming(false)
    }
  }

  return (
    <div className="glass-card glass-card-hover p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground leading-tight">{template.name}</h3>
          {template.description && (
            <p className="text-xs text-foreground/45 mt-0.5">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground/30 hover:text-foreground/70"
            onClick={() => navigate(`/templates/${template.id}`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {confirming ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleDelete}
                disabled={deleteTemplate.isPending}
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setConfirming(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-foreground/30 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

      <div className="flex items-center gap-4 text-xs text-foreground/45">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {participants.map((p) => p.name).join(", ") || "No participants"}
        </span>
        <span className="flex items-center gap-1.5">
          <LayoutList className="h-3.5 w-3.5" />
          {fields.length} field{fields.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Button size="sm" className="w-full mt-auto" onClick={() => onNewInstance(template.id)}>
        + Start New Split
      </Button>
    </div>
  )
}
