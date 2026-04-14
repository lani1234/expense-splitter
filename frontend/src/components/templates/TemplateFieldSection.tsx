import { Badge } from "@/components/ui/badge"
import EditableRow from "./EditableRow"
import TemplateFieldDefaultRow from "./TemplateFieldDefaultRow"
import { useRenameField } from "@/hooks/useTemplates"
import type { TemplateField, TemplateParticipant, SplitRule, SplitRuleAllocation } from "@/types"

interface Props {
  field: TemplateField
  participants: TemplateParticipant[]
  splitRules: SplitRule[]
  allAllocations: Record<string, SplitRuleAllocation[]>
  templateId: string
}

export default function TemplateFieldSection({ field, participants, splitRules, allAllocations, templateId }: Props) {
  const renameField = useRenameField(templateId)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 pl-2 border-l-2 border-primary">
          <EditableRow
            label={field.label}
            onSave={(label) => renameField.mutateAsync({ fieldId: field.id, label })}
          />
        </div>
        <Badge variant="outline" className="text-xs border-border text-muted-foreground shrink-0">
          {field.fieldType}
        </Badge>
      </div>
      <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-sm">
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
