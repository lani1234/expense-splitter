import { useState } from "react"
import { Check, X, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  useParticipants,
  useFields,
  useUpdateTemplate,
  useRenameParticipant,
  useRenameField,
} from "@/hooks/useTemplates"
import type { Template } from "@/types"

interface Props {
  template: Template
  open: boolean
  onClose: () => void
}

function EditableRow({
  label,
  onSave,
  badge,
}: {
  label: string
  onSave: (val: string) => Promise<unknown>
  badge?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === label) { setEditing(false); return }
    setSaving(true)
    try {
      await onSave(trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft(label)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel() }}
          className="h-7 text-sm"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSave} disabled={saving}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group py-0.5">
      <span className="text-sm text-foreground flex-1">{label}</span>
      {badge && (
        <Badge variant="outline" className="text-xs border-border text-muted-foreground px-1.5 py-0">
          {badge}
        </Badge>
      )}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function TemplateEditDialog({ template, open, onClose }: Props) {
  const { data: participants = [] } = useParticipants(template.id)
  const { data: fields = [] } = useFields(template.id)
  const updateTemplate = useUpdateTemplate()
  const renameParticipant = useRenameParticipant(template.id)
  const renameField = useRenameField(template.id)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Template name */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Template Name</p>
            <EditableRow
              label={template.name}
              onSave={(name) => updateTemplate.mutateAsync({ id: template.id, name, description: template.description })}
            />
          </div>

          {/* Participants */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</p>
            {participants.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No participants</p>
            ) : (
              <div className="space-y-0.5">
                {participants.map((p) => (
                  <EditableRow
                    key={p.id}
                    label={p.name}
                    onSave={(name) => renameParticipant.mutateAsync({ participantId: p.id, name })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fields</p>
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No fields</p>
            ) : (
              <div className="space-y-0.5">
                {fields.map((f) => (
                  <EditableRow
                    key={f.id}
                    label={f.label}
                    badge={f.fieldType}
                    onSave={(label) => renameField.mutateAsync({ fieldId: f.id, label })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
