import { useState } from "react"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SplitEditor from "./SplitEditor"
import { useUpdateFieldValueAmount, useUpdateFieldValueSplitRule, useDeleteFieldValue, useAmountsByFieldValue } from "@/hooks/useFieldValues"
import { useParticipants, useAllocations } from "@/hooks/useTemplates"
import type { InstanceFieldValue, SplitMode } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface Props {
  fieldValue: InstanceFieldValue
  templateId: string
  instanceId: string
  isDeletable: boolean
  isSettled: boolean
  defaultSplitRuleId?: string
}

export default function FieldValueRow({
  fieldValue,
  templateId,
  instanceId,
  isDeletable,
  isSettled,
  defaultSplitRuleId,
}: Props) {
  const { toast } = useToast()
  const updateAmount = useUpdateFieldValueAmount(instanceId)
  const updateSplitRule = useUpdateFieldValueSplitRule(instanceId)
  const deleteFieldValue = useDeleteFieldValue(instanceId)

  const { data: participantEntryAmounts = [] } = useAmountsByFieldValue(fieldValue.id)
  const { data: participants = [] } = useParticipants(templateId)

  const effectiveSplitRuleId =
    fieldValue.splitMode === "FIELD_VALUE_CUSTOM_PERCENT"
      ? fieldValue.overrideSplitRuleId
      : fieldValue.splitMode === "TEMPLATE_FIELD_PERCENT_SPLIT"
      ? defaultSplitRuleId
      : undefined

  const { data: allocations = [] } = useAllocations(effectiveSplitRuleId ?? "")

  const participantChips = participantEntryAmounts.map((pea) => {
    const participant = participants.find((p) => p.id === pea.templateParticipantId)
    const name = participant?.name ?? "?"
    if (fieldValue.splitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
      return `${name} Fixed $${pea.amount.toFixed(2)}`
    }
    const allocation = allocations.find((a) => a.templateParticipantId === pea.templateParticipantId)
    const pct = allocation?.percent ?? (fieldValue.amount > 0 ? (pea.amount / fieldValue.amount) * 100 : 0)
    return `${name} ${Math.round(pct)}% $${pea.amount.toFixed(2)}`
  })

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(fieldValue.amount))
  const [note, setNote] = useState(fieldValue.note ?? "")
  const [splitMode, setSplitMode] = useState<SplitMode>(fieldValue.splitMode)
  const [splitRuleId, setSplitRuleId] = useState(fieldValue.overrideSplitRuleId ?? "")
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const newAmount = parseFloat(amount)
      if (isNaN(newAmount) || newAmount < 0) {
        toast({ title: "Invalid amount", variant: "destructive" })
        setSaving(false)
        return
      }

      if (splitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
        const fixedTotal = Object.values(fixedAmounts).reduce((s, v) => s + v, 0)
        if (Math.abs(fixedTotal - newAmount) > 0.01) {
          toast({ title: "Fixed amounts must sum to total", variant: "destructive" })
          setSaving(false)
          return
        }
      }

      if (newAmount !== fieldValue.amount) {
        await updateAmount.mutateAsync({ fieldValueId: fieldValue.id, amount: newAmount })
      }

      if (
        splitMode === "FIELD_VALUE_CUSTOM_PERCENT" &&
        splitRuleId &&
        splitRuleId !== fieldValue.overrideSplitRuleId
      ) {
        await updateSplitRule.mutateAsync({ fieldValueId: fieldValue.id, splitRuleId })
      }

      setEditing(false)
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this entry?")) return
    await deleteFieldValue.mutateAsync(fieldValue.id)
  }

  const handleCancel = () => {
    setAmount(String(fieldValue.amount))
    setNote(fieldValue.note ?? "")
    setSplitMode(fieldValue.splitMode)
    setSplitRuleId(fieldValue.overrideSplitRuleId ?? "")
    setFixedAmounts({})
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg bg-surface-elevated p-3 space-y-3 border border-primary/30">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-border pl-6 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Note</label>
            <Input
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-background border-border h-8 text-sm"
            />
          </div>
        </div>

        <SplitEditor
          templateId={templateId}
          currentSplitMode={splitMode}
          currentSplitRuleId={splitRuleId}
          totalAmount={parseFloat(amount) || 0}
          onSplitModeChange={(mode, ruleId) => {
            setSplitMode(mode)
            setSplitRuleId(ruleId ?? "")
          }}
          onFixedAmountsChange={setFixedAmounts}
          fixedAmounts={fixedAmounts}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7">
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-7">
            <Check className="h-3.5 w-3.5 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-elevated group">
      <span className="w-28 text-sm font-semibold text-foreground shrink-0">
        ${fieldValue.amount.toFixed(2)}
      </span>
      {fieldValue.note && (
        <span className="text-xs text-muted-foreground italic shrink-0">{fieldValue.note}</span>
      )}
      <span className="flex-1 flex items-center justify-end flex-wrap gap-y-0.5">
        {participantChips.map((chip, i) => (
          <span key={i} className="text-xs text-muted-foreground whitespace-nowrap">
            {i > 0 && <span className="mx-1.5 opacity-40">·</span>}
            {chip}
          </span>
        ))}
      </span>
      {!isSettled && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {isDeletable && (
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
      )}
    </div>
  )
}
