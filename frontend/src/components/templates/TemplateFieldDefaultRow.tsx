import { useState, useEffect } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUpdateField } from "@/hooks/useTemplates"
import type { TemplateField, TemplateParticipant, SplitRule, SplitRuleAllocation } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface Props {
  field: TemplateField
  participants: TemplateParticipant[]
  splitRules: SplitRule[]
  allAllocations: Record<string, SplitRuleAllocation[]>
  templateId: string
}

function formatSplitLabel(
  splitRuleId: string,
  allAllocations: Record<string, SplitRuleAllocation[]>,
  participants: TemplateParticipant[]
): string {
  const allocations = allAllocations[splitRuleId] ?? []
  if (!allocations.length) return "—"
  const pcts = participants
    .map((p) => allocations.find((a) => a.templateParticipantId === p.id))
    .filter(Boolean)
    .map((a) => `${Math.round(a!.percent)}%`)
  return pcts.length ? pcts.join(" / ") : "—"
}

export default function TemplateFieldDefaultRow({ field, participants, splitRules, allAllocations, templateId }: Props) {
  const { toast } = useToast()
  const updateField = useUpdateField(templateId)

  const defaultSplitRule = splitRules.find((r) => r.id === field.defaultSplitRuleId)
  const defaultPayer = participants.find((p) => p.id === field.defaultPayerParticipantId)

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(field.defaultAmount != null ? String(field.defaultAmount) : "")
  const [splitRuleId, setSplitRuleId] = useState(field.defaultSplitRuleId ?? "")
  const [payerParticipantId, setPayerParticipantId] = useState(field.defaultPayerParticipantId ?? "")
  const [saving, setSaving] = useState(false)

  // Sync local state when server data updates (e.g. after a save)
  useEffect(() => {
    if (!editing) {
      setAmount(field.defaultAmount != null ? String(field.defaultAmount) : "")
      setSplitRuleId(field.defaultSplitRuleId ?? "")
      setPayerParticipantId(field.defaultPayerParticipantId ?? "")
    }
  }, [field.defaultAmount, field.defaultSplitRuleId, field.defaultPayerParticipantId, editing])

  const handleSave = async () => {
    const parsedAmount = amount.trim() === "" ? null : parseFloat(amount)
    if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount < 0)) {
      toast({ title: "Invalid amount", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const params: Parameters<typeof updateField.mutateAsync>[0] = { fieldId: field.id }

      if (parsedAmount === null && field.defaultAmount != null) {
        params.clearDefaultAmount = true
      } else if (parsedAmount !== null) {
        params.defaultAmount = parsedAmount
      }

      if (splitRuleId === "" && field.defaultSplitRuleId) {
        params.clearDefaultSplitRule = true
      } else if (splitRuleId !== "") {
        params.defaultSplitRuleId = splitRuleId
      }

      if (payerParticipantId === "" && field.defaultPayerParticipantId) {
        params.clearDefaultPayer = true
      } else if (payerParticipantId !== "") {
        params.defaultPayerParticipantId = payerParticipantId
      }

      await updateField.mutateAsync(params)
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

  const handleCancel = () => {
    setAmount(field.defaultAmount != null ? String(field.defaultAmount) : "")
    setSplitRuleId(field.defaultSplitRuleId ?? "")
    setPayerParticipantId(field.defaultPayerParticipantId ?? "")
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg bg-surface-elevated p-3 space-y-3 border border-primary/30">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-border pl-6 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Split Rule</label>
            <select
              value={splitRuleId}
              onChange={(e) => setSplitRuleId(e.target.value)}
              className="h-8 text-sm w-full rounded-md border border-border bg-background px-2"
            >
              <option value="">— none —</option>
              {splitRules.map((r) => (
                <option key={r.id} value={r.id}>{formatSplitLabel(r.id, allAllocations, participants)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Default Payer</label>
          <select
            value={payerParticipantId}
            onChange={(e) => setPayerParticipantId(e.target.value)}
            className="h-8 text-sm w-full rounded-md border border-border bg-background px-2"
          >
            <option value="">— not tracked —</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
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

  const hasAnyDefault = field.defaultAmount != null || field.defaultSplitRuleId || field.defaultPayerParticipantId

  return (
    <div className="flex items-center gap-3 px-3 py-3 hover:bg-surface-elevated group">
      <div className="shrink-0 w-[7rem]">
        {field.defaultAmount != null ? (
          <span className="text-sm font-semibold text-foreground tabular-nums">
            ${field.defaultAmount.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground italic">No amount</span>
        )}
      </div>
      <div className="flex-1 flex flex-wrap gap-1.5 items-center">
        {defaultSplitRule ? (
          <span className="text-xs rounded-full border px-2.5 py-0.5 bg-blue-50 border-blue-200 text-blue-700 whitespace-nowrap">
            {formatSplitLabel(defaultSplitRule.id, allAllocations, participants)}
          </span>
        ) : null}
        {defaultPayer ? (
          <span className="text-xs rounded-full border px-2.5 py-0.5 bg-slate-100 border-slate-300 text-slate-500 whitespace-nowrap">
            Paid by {defaultPayer.name}
          </span>
        ) : null}
        {!hasAnyDefault && (
          <span className="text-xs text-muted-foreground italic">No defaults — hover to configure</span>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
