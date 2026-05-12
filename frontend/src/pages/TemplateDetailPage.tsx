import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQueries } from "@tanstack/react-query"
import { ArrowLeft, Pencil, Check, X, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import NewInstanceDialog from "@/components/instances/NewInstanceDialog"
import EditableRow from "@/components/templates/EditableRow"
import TemplateFieldSection from "@/components/templates/TemplateFieldSection"
import AddTemplateFieldForm from "@/components/templates/AddTemplateFieldForm"
import {
  useTemplate,
  useParticipants,
  useFields,
  useSplitRules,
  useUpdateTemplate,
  useAddParticipant,
  useRenameParticipant,
  useDeleteTemplate,
  TEMPLATE_KEYS,
} from "@/hooks/useTemplates"
import { getAllocations } from "@/api/templates"
import type { SplitRuleAllocation } from "@/types"
import { useToast } from "@/hooks/use-toast"

export default function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: template, isLoading: templateLoading } = useTemplate(templateId!)
  const { data: participants = [], isLoading: participantsLoading } = useParticipants(templateId!)
  const { data: fields = [], isLoading: fieldsLoading } = useFields(templateId!)
  const { data: splitRules = [] } = useSplitRules(templateId!)

  // Fetch allocations for every split rule in parallel so we can display percentages
  const allocationResults = useQueries({
    queries: splitRules.map((rule) => ({
      queryKey: TEMPLATE_KEYS.allocations(rule.id),
      queryFn: () => getAllocations(rule.id),
    })),
  })
  const allAllocations: Record<string, SplitRuleAllocation[]> = {}
  splitRules.forEach((rule, i) => {
    allAllocations[rule.id] = allocationResults[i]?.data ?? []
  })

  const updateTemplate = useUpdateTemplate()
  const addParticipant = useAddParticipant(templateId!)
  const renameParticipant = useRenameParticipant(templateId!)
  const { mutate: deleteTemplate } = useDeleteTemplate()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState("")
  const [addingField, setAddingField] = useState(false)
  const [newInstanceOpen, setNewInstanceOpen] = useState(false)

  if (templateLoading || participantsLoading || fieldsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 glass-card rounded-xl animate-pulse" />
        <div className="h-20 glass-card rounded-xl animate-pulse" />
        <div className="h-40 glass-card rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-16 text-muted-foreground">Template not found.</div>
    )
  }

  const handleSaveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    try {
      await updateTemplate.mutateAsync({ id: template.id, name: trimmed, description: template.description })
      setEditingName(false)
    } catch {
      toast({ title: "Failed to rename template", variant: "destructive" })
    }
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteTemplate(template.id, {
      onSuccess: () => navigate("/templates"),
    })
  }

  const sortedParticipants = [...participants].sort((a, b) => a.displayOrder - b.displayOrder)
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 text-muted-foreground"
            onClick={() => navigate("/templates")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-surface-elevated border-border h-8 text-lg font-bold w-60"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName()
                    if (e.key === "Escape") setEditingName(false)
                  }}
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveName}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingName(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold text-foreground/85">{template.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                  onClick={() => {
                    setNameInput(template.name)
                    setEditingName(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {template.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Button size="sm" onClick={() => setNewInstanceOpen(true)}>
            + Start New Split
          </Button>
          {confirmDelete ? (
            <>
              <span className="text-xs text-destructive">Delete template?</span>
              <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleDelete}>
                Yes
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setConfirmDelete(false)}>
                No
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</p>
        <div className="glass-card px-3 py-2 space-y-0.5" style={{ borderRadius: "0.875rem" }}>
          {sortedParticipants.map((p) => (
            <EditableRow
              key={p.id}
              label={p.name}
              onSave={(name) => renameParticipant.mutateAsync({ participantId: p.id, name })}
            />
          ))}
          {/* Inline add participant */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Add participant…"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const name = newParticipantName.trim()
                  if (!name) return
                  await addParticipant.mutateAsync({ name, displayOrder: sortedParticipants.length + 1 })
                  setNewParticipantName("")
                }
              }}
              className="h-7 text-sm bg-white/80 border-black/12 flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={!newParticipantName.trim() || addParticipant.isPending}
              onClick={async () => {
                const name = newParticipantName.trim()
                if (!name) return
                await addParticipant.mutateAsync({ name, displayOrder: sortedParticipants.length + 1 })
                setNewParticipantName("")
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Fields */}
      <div className="space-y-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -mb-4">Fields</p>
        {sortedFields.length === 0 && !addingField && (
          <p className="text-sm text-muted-foreground italic">No fields</p>
        )}
        {sortedFields.map((field) => (
          <TemplateFieldSection
            key={field.id}
            field={field}
            participants={sortedParticipants}
            splitRules={splitRules}
            allAllocations={allAllocations}
            templateId={templateId!}
          />
        ))}
        {sortedParticipants.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-1">
            Add at least one participant before adding fields.
          </p>
        ) : addingField ? (
          <AddTemplateFieldForm
            templateId={templateId!}
            participants={sortedParticipants}
            fieldCount={sortedFields.length}
            onClose={() => setAddingField(false)}
          />
        ) : (
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors"
            onClick={() => setAddingField(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Field
          </button>
        )}
      </div>

      <NewInstanceDialog
        key={newInstanceOpen ? template.id : ""}
        open={newInstanceOpen}
        defaultTemplateId={template.id}
        onClose={() => setNewInstanceOpen(false)}
      />
    </div>
  )
}
