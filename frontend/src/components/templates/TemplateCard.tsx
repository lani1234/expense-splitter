import { useState } from "react"
import { Users, LayoutList, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParticipants, useFields, useDeleteTemplate } from "@/hooks/useTemplates"
import type { Template } from "@/types"

interface Props {
  template: Template
  onNewInstance: (templateId: string) => void
}

export default function TemplateCard({ template, onNewInstance }: Props) {
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
    <Card className="bg-surface border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base text-foreground">{template.name}</CardTitle>
            {template.description && (
              <p className="text-xs text-muted-foreground">{template.description}</p>
            )}
          </div>
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-destructive">Delete?</span>
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
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      {deleteError && (
        <div className="px-6 pb-1">
          <p className="text-xs text-destructive">{deleteError}</p>
        </div>
      )}
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {participants.map((p) => p.name).join(", ") || "No participants"}
          </span>
          <span className="flex items-center gap-1">
            <LayoutList className="h-3.5 w-3.5" />
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={() => onNewInstance(template.id)}
        >
          + New Instance
        </Button>
      </CardContent>
    </Card>
  )
}
