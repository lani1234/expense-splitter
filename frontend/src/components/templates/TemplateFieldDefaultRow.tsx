import { useState, useEffect } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUpdateField, TEMPLATE_KEYS } from "@/hooks/useTemplates"
import { createSplitRule, createAllocation } from "@/api/templates"
import { useQueryClient } from "@tanstack/react-query"
import type { TemplateField, TemplateParticipant, SplitRule, SplitRuleAllocation, FieldType } from "@/types"
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

function percentsFromAllocations(
  splitRuleId: string | undefined,
  allAllocations: Record<string, SplitRuleAllocation[]>,
  participants: TemplateParticipant[]
): Record<string, string> {
  const allocations = allAllocations[splitRuleId ?? ""] ?? []
  return Object.fromEntries(
    participants.map((p) => {
      const alloc = allocations.find((a) => a.templateParticipantId === p.id)
      return [p.id, alloc != null ? String(alloc.percent) : ""]
    })
  )
}

export default function TemplateFieldDefaultRow({ field, participants, splitRules, allAllocations, templateId }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const updateField = useUpdateField(templateId)

  const defaultSplitRule = splitRules.find((r) => r.id === field.defaultSplitRuleId)
  const defaultPayer = participants.find((p) => p.id === field.defaultPayerParticipantId)

  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(field.label)
  const [amount, setAmount] = useState(field.defaultAmount != null ? String(field.defaultAmount) : "")
  const [percents, setPercents] = useState<Record<string, string>>(() =>
    percentsFromAllocations(field.defaultSplitRuleId, allAllocations, participants)
  )
  const [payerParticipantId, setPayerParticipantId] = useState(field.defaultPayerParticipantId ?? "")
  const [fieldType, setFieldType] = useState<FieldType>(field.fieldType)
  const [saving, setSaving] = useState(false)

  // Sync local state when server data updates (after a save or when allAllocations loads)
  useEffect(() => {
    if (!editing) {
      setLabel(field.label)
      setAmount(field.defaultAmount != null ? String(field.defaultAmount) : "")
      setPercents(percentsFromAllocations(field.defaultSplitRuleId, allAllocations, participants))
      setPayerParticipantId(field.defaultPayerParticipantId ?? "")
      setFieldType(field.fieldType)
    }
  }, [field.label, field.defaultAmount, field.defaultSplitRuleId, field.defaultPayerParticipantId, field.fieldType, allAllocations, editing])

  const percentTotal = participants.reduce((sum, p) => sum + (parseFloat(percents[p.id] ?? "") || 0), 0)
  const allPercentsEmpty = participants.every((p) => !(parseFloat(percents[p.id] ?? "") > 0))
  const percentsValid = allPercentsEmpty || Math.abs(percentTotal - 100) < 0.01

  const handleSave = async () => {
    if (!label.trim()) {
      toast({ title: "Label is required", variant: "destructive" })
      return
    }
    const parsedAmount = amount.trim() === "" ? null : parseFloat(amount)
    if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount < 0)) {
      toast({ title: "Invalid amount", variant: "destructive" })
      return
    }
    if (!percentsValid) {
      toast({ title: `Split must sum to 100% (currently ${percentTotal.toFixed(1)}%)`, variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const params: Parameters<typeof updateField.mutateAsync>[0] = { fieldId: field.id, label: label.trim(), fieldType }

      // Amount
      if (parsedAmount === null && field.defaultAmount != null) {
        params.clearDefaultAmount = true
      } else if (parsedAmount !== null) {
        params.defaultAmount = parsedAmount
      }

      // Split rule — find/create based on percentages
      if (allPercentsEmpty) {
        if (field.defaultSplitRuleId) params.clearDefaultSplitRule = true
      } else {
        const wantedPercents: Record<string, number> = {}
        for (const p of participants) {
          wantedPercents[p.id] = parseFloat(percents[p.id] ?? "") || 0
        }

        // Check existing rules for a match (only rules that cover ALL current participants)
        let resolvedRuleId: string | null = null
        for (const rule of splitRules) {
          const allocations = allAllocations[rule.id] ?? []
          const coversAll = participants.every((p) => allocations.some((a) => a.templateParticipantId === p.id))
          if (!coversAll) continue
          const matches = participants.every((p) => {
            const existing = allocations.find((a) => a.templateParticipantId === p.id)?.percent ?? 0
            return Math.abs(existing - wantedPercents[p.id]) < 0.01
          })
          if (matches) { resolvedRuleId = rule.id; break }
        }

        // Create a new rule if no match found
        if (!resolvedRuleId) {
          const pctLabel = participants.map((p) => `${Math.round(wantedPercents[p.id])}%`).join(" / ")
          const rule = await createSplitRule(templateId, pctLabel)
          for (const p of participants) {
            await createAllocation(rule.id, p.id, wantedPercents[p.id])
          }
          resolvedRuleId = rule.id
          qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.splitRules(templateId) })
          qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.allocations(resolvedRuleId) })
        }

        params.defaultSplitRuleId = resolvedRuleId
      }

      // Payer
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
    setLabel(field.label)
    setAmount(field.defaultAmount != null ? String(field.defaultAmount) : "")
    setPercents(percentsFromAllocations(field.defaultSplitRuleId, allAllocations, participants))
    setPayerParticipantId(field.defaultPayerParticipantId ?? "")
    setFieldType(field.fieldType)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg bg-surface-elevated p-3 space-y-3 border border-primary/30">
        {/* Label + Type */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Label *</label>
            <Input
              placeholder="e.g. Cable Bill"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-background border-border h-8 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <div className="flex gap-3 h-8 items-center">
              {(["SINGLE", "MULTIPLE"] as FieldType[]).map((type) => (
                <label key={type} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`fieldType-edit-${field.id}`}
                    value={type}
                    checked={fieldType === type}
                    onChange={() => setFieldType(type)}
                    className="accent-primary"
                  />
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Default Amount + Default Payer */}
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
              />
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
        </div>

        {/* Split percentages */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">Split</label>
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-24 text-sm text-muted-foreground truncate">{p.name}</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                value={percents[p.id] ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setPercents((prev) => {
                    const next = { ...prev, [p.id]: val }
                    if (participants.length === 2) {
                      const other = participants.find((o) => o.id !== p.id)!
                      const remainder = 100 - (parseFloat(val) || 0)
                      next[other.id] = remainder > 0 ? String(Math.round(remainder * 10) / 10) : "0"
                    }
                    return next
                  })
                }}
                className="w-20 bg-background border-border h-8 text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          ))}
          <p className={`text-xs font-medium ${percentsValid ? "text-primary" : "text-muted-foreground"}`}>
            {allPercentsEmpty
              ? "No split defined"
              : `Total: ${percentTotal.toFixed(1)}%${percentsValid ? " ✓" : participants.length >= 3 ? ` · ${(100 - percentTotal).toFixed(1)}% remaining` : " (need 100%)"}`
            }
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7">
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !label.trim() || !percentsValid} className="h-7">
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
