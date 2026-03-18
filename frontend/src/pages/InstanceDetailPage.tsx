import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, RotateCcw, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import ParticipantTotalsBar from "@/components/instances/ParticipantTotalsBar"
import FieldSection from "@/components/instances/FieldSection"
import { useInstance, useSettleInstance, useReopenInstance, useFieldValues } from "@/hooks/useInstances"
import { useFields } from "@/hooks/useTemplates"
import { renameInstance } from "@/api/instances"
import { useQueryClient } from "@tanstack/react-query"
import { INSTANCE_KEYS } from "@/hooks/useInstances"
import { useToast } from "@/hooks/use-toast"

export default function InstanceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: instance, isLoading: instanceLoading } = useInstance(id!)
  const { data: fieldValues = [], isLoading: fvLoading } = useFieldValues(id!)
  const { data: fields = [] } = useFields(instance?.templateId ?? "")

  const settle = useSettleInstance()
  const reopen = useReopenInstance()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")

  if (instanceLoading || fvLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="h-20 bg-surface rounded animate-pulse" />
        <div className="h-40 bg-surface rounded animate-pulse" />
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="text-center py-16 text-muted-foreground">Instance not found.</div>
    )
  }

  const isSettled = instance.status === "SETTLED"

  const handleSaveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    try {
      await renameInstance(instance.id, trimmed)
      qc.invalidateQueries({ queryKey: INSTANCE_KEYS.detail(instance.id) })
      setEditingName(false)
    } catch (e) {
      toast({ title: "Failed to rename", variant: "destructive" })
    }
  }

  const handleSettle = async () => {
    if (!confirm("Mark this instance as settled?")) return
    await settle.mutateAsync(instance.id)
  }

  const handleReopen = async () => {
    await reopen.mutateAsync(instance.id)
  }

  // Group field values by templateFieldId
  const fvByField = fieldValues.reduce<Record<string, typeof fieldValues>>((acc, fv) => {
    if (!acc[fv.templateFieldId]) acc[fv.templateFieldId] = []
    acc[fv.templateFieldId].push(fv)
    return acc
  }, {})

  // Sort fields by displayOrder
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
            onClick={() => navigate(-1)}
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
                <h1 className="text-2xl font-bold text-foreground">{instance.name}</h1>
                {!isSettled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                    onClick={() => {
                      setNameInput(instance.name)
                      setEditingName(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
            <Badge
              variant="outline"
              className={`mt-1 ${
                isSettled
                  ? "border-primary/50 text-primary bg-primary/10"
                  : "border-border text-muted-foreground"
              }`}
            >
              {isSettled ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : null}
              {isSettled ? "Settled" : "In Progress"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {isSettled ? (
            <Button variant="outline" size="sm" onClick={handleReopen} disabled={reopen.isPending}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reopen
            </Button>
          ) : (
            <Button size="sm" onClick={handleSettle} disabled={settle.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Settle
            </Button>
          )}
        </div>
      </div>

      {/* Totals bar */}
      <ParticipantTotalsBar instanceId={instance.id} templateId={instance.templateId} />

      <Separator className="bg-border" />

      {/* Fields */}
      <div className="space-y-6">
        {sortedFields.map((field) => (
          <FieldSection
            key={field.id}
            field={field}
            fieldValues={fvByField[field.id] ?? []}
            instanceId={instance.id}
            templateId={instance.templateId}
            isSettled={isSettled}
          />
        ))}
      </div>
    </div>
  )
}
