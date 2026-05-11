import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import TemplateFieldDefaultRow from "./TemplateFieldDefaultRow"
import { useDeleteField } from "@/hooks/useTemplates"
import type { TemplateField, TemplateParticipant, SplitRule, SplitRuleAllocation } from "@/types"

interface Props {
  field: TemplateField
  participants: TemplateParticipant[]
  splitRules: SplitRule[]
  allAllocations: Record<string, SplitRuleAllocation[]>
  templateId: string
}

export default function TemplateFieldSection({ field, participants, splitRules, allAllocations, templateId }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { mutate: deleteField, isPending } = useDeleteField(templateId)

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteField(field.id)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 pl-2 border-l-2 border-primary">
          <span className="text-sm font-medium text-foreground">{field.label}</span>
        </div>
        <Badge variant="outline" className="text-xs border-foreground/15 text-foreground/40 shrink-0">
          {field.fieldType}
        </Badge>
        {confirmDelete ? (
          <>
            <span className="text-xs text-destructive">Delete field?</span>
            <Button variant="destructive" size="sm" className="h-6 px-2 text-xs" onClick={handleDelete} disabled={isPending}>
              Yes
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setConfirmDelete(false)}>
              No
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="glass-card overflow-hidden" style={{ borderRadius: "0.875rem" }}>
        <TemplateFieldDefaultRow
          field={field}
          participants={participants}
          splitRules={splitRules}
          allAllocations={allAllocations}
          templateId={templateId}
        />
      </div>
    </div>
  )
}
