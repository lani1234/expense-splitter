import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createField, createSplitRule, createAllocation, getParticipants } from "@/api/templates"
import { useFields, TEMPLATE_KEYS } from "@/hooks/useTemplates"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { FieldType } from "@/types"

interface Props {
  templateId: string
  onFinish: () => void
  onBack: () => void
}

interface FieldDraft {
  label: string
  fieldType: FieldType
  defaultAmount: string
  defaultPayerParticipantId: string
  percents: Record<string, string>
}

const emptyDraft = (participantIds: string[]): FieldDraft => ({
  label: "",
  fieldType: "SINGLE",
  defaultAmount: "",
  defaultPayerParticipantId: "",
  percents: Object.fromEntries(participantIds.map((id) => [id, ""])),
})

export default function WizardStep3({ templateId, onFinish, onBack }: Props) {
  const qc = useQueryClient()
  const { data: fields = [] } = useFields(templateId)
  const { data: participants = [] } = useQuery({
    queryKey: TEMPLATE_KEYS.participants(templateId),
    queryFn: () => getParticipants(templateId),
    refetchOnMount: "always",
  })

  const [draft, setDraft] = useState<FieldDraft>(() =>
    emptyDraft(participants.map((p) => p.id))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const percentTotal = participants.reduce(
    (sum, p) => sum + (parseFloat(draft.percents[p.id] ?? "") || 0),
    0
  )
  const percentsValid = Math.abs(percentTotal - 100) < 0.01

  const addField = async () => {
    if (!draft.label.trim()) {
      setError("Label is required")
      return
    }
    if (!percentsValid) {
      setError(`Percentages must sum to 100 (currently ${percentTotal.toFixed(1)})`)
      return
    }

    setLoading(true)
    setError("")
    try {
      // 1. Create the split rule (named after the field label)
      const rule = await createSplitRule(templateId, draft.label.trim())

      // 2. Create an allocation for each participant
      for (const p of participants) {
        const pct = parseFloat(draft.percents[p.id] ?? "0") || 0
        await createAllocation(rule.id, p.id, pct)
      }

      // 3. Create the field, linking it to the new split rule
      await createField(
        templateId,
        draft.label.trim(),
        draft.fieldType,
        fields.length + 1,
        rule.id,
        draft.defaultAmount ? parseFloat(draft.defaultAmount) : undefined,
        draft.defaultPayerParticipantId || undefined
      )

      qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.fields(templateId) })
      qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.splitRules(templateId) })

      // Reset draft, preserving participant keys
      setDraft(emptyDraft(participants.map((p) => p.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add field")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add expense fields and define how each will be split between participants.
      </p>

      {/* Existing fields */}
      {fields.length > 0 && (
        <div className="space-y-1.5">
          {fields.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-lg bg-surface-elevated px-3 py-2"
            >
              <span className="text-sm font-medium flex-1">{f.label}</span>
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                {f.fieldType}
              </Badge>
              {f.defaultAmount != null && f.defaultAmount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ${f.defaultAmount.toFixed(2)}
                </span>
              )}
              {f.defaultPayerParticipantId && (
                <span className="text-xs text-slate-500">
                  Paid by {participants.find((p) => p.id === f.defaultPayerParticipantId)?.name ?? "?"}
                </span>
              )}
              {f.defaultSplitRuleId && (
                <span className="text-xs text-primary">Split ✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New field form */}
      <div className="rounded-lg border border-border bg-surface-elevated p-4 space-y-4">
        {/* Label + Type + Amount row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 space-y-1.5">
            <Label className="text-xs">Label *</Label>
            <Input
              placeholder="e.g. Mortgage"
              value={draft.label}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              className="bg-background border-border h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select
              value={draft.fieldType}
              onValueChange={(v) => setDraft((d) => ({ ...d, fieldType: v as FieldType }))}
            >
              <SelectTrigger className="bg-background border-border h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border">
                <SelectItem value="SINGLE">Single</SelectItem>
                <SelectItem value="MULTIPLE">Multiple</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Amount</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={draft.defaultAmount}
                onChange={(e) => setDraft((d) => ({ ...d, defaultAmount: e.target.value }))}
                className="bg-background border-border h-8 text-sm pl-6"
              />
            </div>
          </div>
        </div>

        {/* Default Payer */}
        <div className="space-y-1.5">
          <Label className="text-xs">Default Payer</Label>
          <select
            value={draft.defaultPayerParticipantId}
            onChange={(e) => setDraft((d) => ({ ...d, defaultPayerParticipantId: e.target.value }))}
            className="h-8 text-sm w-full rounded-md border border-border bg-background px-2"
          >
            <option value="">— not set —</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Split section — always visible, required */}
        <div className="space-y-2">
          <Label className="text-xs">Split *</Label>
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
                  value={draft.percents[p.id] ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                    setDraft((d) => {
                      const newPercents = { ...d.percents, [p.id]: val }
                      if (participants.length === 2) {
                        const other = participants.find((other) => other.id !== p.id)!
                        const remainder = 100 - (parseFloat(val) || 0)
                        newPercents[other.id] = remainder > 0 ? String(Math.round(remainder * 10) / 10) : "0"
                      }
                      return { ...d, percents: newPercents }
                    })
                  }}
                  className="w-20 bg-background border-border h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            ))}
          </div>
          <p
            className={`text-xs font-medium ${
              percentsValid ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Total: {percentTotal.toFixed(1)}%{percentsValid ? " ✓" : participants.length >= 3 ? ` · ${(100 - percentTotal).toFixed(1)}% remaining` : ` (need 100%)`}
          </p>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={addField}
          disabled={loading || !draft.label.trim() || !percentsValid}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {loading ? "Adding..." : "Add Field"}
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-destructive">Add at least one field to finish.</p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onFinish} disabled={fields.length === 0}>
          Finish
        </Button>
      </div>
    </div>
  )
}
