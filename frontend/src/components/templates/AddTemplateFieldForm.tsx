import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createField,
  createSplitRule,
  createAllocation,
  getSplitRules,
  getAllocations,
} from "@/api/templates"
import { useQueryClient } from "@tanstack/react-query"
import { TEMPLATE_KEYS } from "@/hooks/useTemplates"
import type { TemplateParticipant, FieldType } from "@/types"

interface Props {
  templateId: string
  participants: TemplateParticipant[]
  fieldCount: number
  onClose: () => void
}

export default function AddTemplateFieldForm({ templateId, participants, fieldCount, onClose }: Props) {
  const qc = useQueryClient()

  const [label, setLabel] = useState("")
  const [fieldType, setFieldType] = useState<FieldType>("SINGLE")
  const [defaultAmount, setDefaultAmount] = useState("")
  const [defaultPayerParticipantId, setDefaultPayerParticipantId] = useState("")
  const [percents, setPercents] = useState<Record<string, string>>(
    Object.fromEntries(participants.map((p) => [p.id, ""]))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const percentTotal = participants.reduce(
    (sum, p) => sum + (parseFloat(percents[p.id] ?? "") || 0),
    0
  )
  const percentsValid = Math.abs(percentTotal - 100) < 0.01

  const handleAdd = async () => {
    if (!label.trim()) { setError("Label is required"); return }
    if (fieldType === "SINGLE" && !percentsValid) {
      setError(`Percentages must sum to 100 (currently ${percentTotal.toFixed(1)})`)
      return
    }

    setLoading(true)
    setError("")
    try {
      let resolvedRuleId: string | null = null

      if (fieldType === "SINGLE") {
        // Build desired percentages
        const wantedPercents: Record<string, number> = {}
        for (const p of participants) {
          wantedPercents[p.id] = parseFloat(percents[p.id] ?? "0") || 0
        }

        // Check if a matching split rule already exists — reuse it if so
        const existingRules = await getSplitRules(templateId)

        for (const rule of existingRules) {
          const allocations = await getAllocations(rule.id)
          const matches = participants.every((p) => {
            const existing = allocations.find((a) => a.templateParticipantId === p.id)?.percent ?? 0
            return Math.abs(existing - wantedPercents[p.id]) < 0.01
          })
          if (matches) { resolvedRuleId = rule.id; break }
        }

        // Create a new split rule if no match found
        if (!resolvedRuleId) {
          const pctLabel = participants.map((p) => `${Math.round(wantedPercents[p.id])}%`).join(" / ")
          const rule = await createSplitRule(templateId, pctLabel)
          for (const p of participants) {
            await createAllocation(rule.id, p.id, wantedPercents[p.id])
          }
          resolvedRuleId = rule.id
        }
      }

      await createField(
        templateId,
        label.trim(),
        fieldType,
        fieldCount + 1,
        resolvedRuleId ?? undefined,
        fieldType === "SINGLE" && defaultAmount ? parseFloat(defaultAmount) : undefined,
        fieldType === "SINGLE" && defaultPayerParticipantId ? defaultPayerParticipantId : undefined
      )

      qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.fields(templateId) })
      qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.splitRules(templateId) })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add field")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-surface-elevated p-4 space-y-4">
      {/* Label + Type */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs text-muted-foreground">Label *</label>
          <Input
            placeholder="e.g. Cable Bill"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose() }}
            className="bg-background border-border h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Type</label>
          <div className="flex gap-3 h-8 items-center">
            {(["SINGLE", "MULTIPLE"] as FieldType[]).map((type) => (
              <label key={type} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="fieldType-add"
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

      {/* Default Amount + Default Payer — hidden for MULTIPLE fields */}
      {fieldType === "SINGLE" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Default Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                className="bg-background border-border h-8 text-sm pl-6"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Default Payer</label>
            <select
              value={defaultPayerParticipantId}
              onChange={(e) => setDefaultPayerParticipantId(e.target.value)}
              className="h-8 text-sm w-full rounded-md border border-border bg-background px-2"
            >
              <option value="">— not set —</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Split percentages — hidden for MULTIPLE fields */}
      {fieldType === "SINGLE" && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Split *</label>
          <div className="space-y-2">
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
          </div>
          <p className={`text-xs font-medium ${percentsValid ? "text-primary" : "text-muted-foreground"}`}>
            Total: {percentTotal.toFixed(1)}%{percentsValid ? " ✓" : participants.length >= 3 ? ` · ${(100 - percentTotal).toFixed(1)}% remaining` : " (need 100%)"}
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7">
          <X className="h-3.5 w-3.5 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={loading || !label.trim() || (fieldType === "SINGLE" && !percentsValid)}
          className="h-7"
        >
          {loading ? (
            "Adding..."
          ) : (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Add Field
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
