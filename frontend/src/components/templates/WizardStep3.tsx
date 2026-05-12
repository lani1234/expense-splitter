import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createField, createSplitRule, createAllocation, getParticipants, getSplitRules, getAllocations, setDefaultParticipantAmounts } from "@/api/templates"
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
  splitMode: "PERCENT" | "FIXED"
  percents: Record<string, string>
  fixedAmounts: Record<string, string>
}

const emptyDraft = (participantIds: string[]): FieldDraft => ({
  label: "",
  fieldType: "SINGLE",
  defaultAmount: "",
  defaultPayerParticipantId: "",
  splitMode: "PERCENT",
  percents: Object.fromEntries(participantIds.map((id) => [id, ""])),
  fixedAmounts: Object.fromEntries(participantIds.map((id) => [id, ""])),
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
  const [fixedManuallySet, setFixedManuallySet] = useState(new Set<string>())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const percentTotal = participants.reduce(
    (sum, p) => sum + (parseFloat(draft.percents[p.id] ?? "") || 0),
    0
  )
  const percentsValid = Math.abs(percentTotal - 100) < 0.01

  const fixedTotal = participants.reduce(
    (sum, p) => sum + (parseFloat(draft.fixedAmounts[p.id] ?? "") || 0),
    0
  )

  const handleFixedAmountChange = (id: string, raw: string) => {
    const total = parseFloat(draft.defaultAmount) || 0
    const next = new Set([...fixedManuallySet, id])
    setFixedManuallySet(next)

    const updated: Record<string, string> = { ...draft.fixedAmounts, [id]: raw }

    if (total > 0) {
      const targets = participants.filter((p) => !next.has(p.id))
      if (targets.length > 0) {
        const manualSum = participants
          .filter((p) => next.has(p.id))
          .reduce((s, p) => s + (parseFloat(updated[p.id] ?? "0") || 0), 0)
        const remaining = total - manualSum
        if (remaining >= 0) {
          const each = Math.round((remaining / targets.length) * 100) / 100
          targets.forEach((p, i) => {
            if (i === targets.length - 1) {
              updated[p.id] = String(Math.max(0, Math.round((remaining - (targets.length - 1) * each) * 100) / 100))
            } else {
              updated[p.id] = String(each)
            }
          })
        }
      }
    }

    setDraft((d) => ({ ...d, fixedAmounts: updated }))
  }

  const addField = async () => {
    if (!draft.label.trim()) {
      setError("Label is required")
      return
    }
    if (draft.fieldType === "SINGLE" && draft.splitMode === "PERCENT" && !percentsValid) {
      setError(`Percentages must sum to 100 (currently ${percentTotal.toFixed(1)})`)
      return
    }

    setLoading(true)
    setError("")
    try {
      let resolvedRuleId: string | null = null

      if (draft.fieldType === "SINGLE" && draft.splitMode === "PERCENT") {
        // 1. Build the desired percentages for each participant
        const wantedPercents: Record<string, number> = {}
        for (const p of participants) {
          wantedPercents[p.id] = parseFloat(draft.percents[p.id] ?? "0") || 0
        }

        // 2. Check if a split rule with identical percentages already exists — reuse it if so
        const existingRules = await getSplitRules(templateId)

        for (const rule of existingRules) {
          const allocations = await getAllocations(rule.id)
          const matches = participants.every((p) => {
            const existing = allocations.find((a) => a.templateParticipantId === p.id)?.percent ?? 0
            return Math.abs(existing - wantedPercents[p.id]) < 0.01
          })
          if (matches) { resolvedRuleId = rule.id; break }
        }

        // 3. If no matching rule found, create a new one named by its percentages
        if (!resolvedRuleId) {
          const pctLabel = participants.map((p) => `${Math.round(wantedPercents[p.id])}%`).join(" / ")
          const rule = await createSplitRule(templateId, pctLabel)
          for (const p of participants) {
            await createAllocation(rule.id, p.id, wantedPercents[p.id])
          }
          resolvedRuleId = rule.id
        }
      }

      // For fixed amounts, use the sum as the default total amount
      const computedDefaultAmount =
        draft.fieldType === "SINGLE" && draft.splitMode === "FIXED" && fixedTotal > 0
          ? fixedTotal
          : draft.fieldType === "SINGLE" && draft.defaultAmount
          ? parseFloat(draft.defaultAmount)
          : undefined

      // 4. Create the field
      const newField = await createField(
        templateId,
        draft.label.trim(),
        draft.fieldType,
        fields.length + 1,
        resolvedRuleId ?? undefined,
        computedDefaultAmount,
        draft.fieldType === "SINGLE" ? draft.defaultPayerParticipantId || undefined : undefined
      )

      // 5. Save per-participant fixed amounts if any were entered
      if (draft.fieldType === "SINGLE" && draft.splitMode === "FIXED" && fixedTotal > 0) {
        const amounts: Record<string, number> = {}
        for (const p of participants) {
          const val = parseFloat(draft.fixedAmounts[p.id] ?? "0") || 0
          if (val > 0) amounts[p.id] = val
        }
        if (Object.keys(amounts).length > 0) {
          await setDefaultParticipantAmounts(newField.id, amounts)
        }
      }

      qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.fields(templateId) })
      qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.splitRules(templateId) })

      // Reset draft and manual-set tracking
      setDraft(emptyDraft(participants.map((p) => p.id)))
      setFixedManuallySet(new Set())
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
              {!f.defaultSplitRuleId && f.defaultParticipantAmounts && Object.keys(f.defaultParticipantAmounts).length > 0 && (
                <span className="text-xs text-primary">Fixed ✓</span>
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
            <div className="flex gap-3 h-8 items-center">
              {(["SINGLE", "MULTIPLE"] as FieldType[]).map((type) => (
                <label key={type} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="fieldType-wizard"
                    value={type}
                    checked={draft.fieldType === type}
                    onChange={() => setDraft((d) => ({ ...d, fieldType: type }))}
                    className="accent-primary"
                  />
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>
          {draft.fieldType === "SINGLE" && (
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
          )}
        </div>

        {/* Default Payer — hidden for MULTIPLE fields */}
        {draft.fieldType === "SINGLE" && (
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
        )}

        {/* Split — hidden for MULTIPLE fields */}
        {draft.fieldType === "SINGLE" && (
          <div className="space-y-2">
            <Label className="text-xs">Split *</Label>
            <div className="flex gap-4">
              {(["PERCENT", "FIXED"] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="splitMode-wizard"
                    value={mode}
                    checked={draft.splitMode === mode}
                    onChange={() => { setDraft((d) => ({ ...d, splitMode: mode })); setFixedManuallySet(new Set()) }}
                    className="accent-primary"
                  />
                  {mode === "PERCENT" ? "Percentages" : "Fixed Amounts"}
                </label>
              ))}
            </div>

            {draft.splitMode === "PERCENT" && (
              <>
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
                <p className={`text-xs font-medium ${percentsValid ? "text-primary" : "text-muted-foreground"}`}>
                  Total: {percentTotal.toFixed(1)}%{percentsValid ? " ✓" : participants.length >= 3 ? ` · ${(100 - percentTotal).toFixed(1)}% remaining` : ` (need 100%)`}
                </p>
              </>
            )}

            {draft.splitMode === "FIXED" && (
              <>
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="w-24 text-sm text-muted-foreground truncate">{p.name}</span>
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={draft.fixedAmounts[p.id] ?? ""}
                        onChange={(e) => handleFixedAmountChange(p.id, e.target.value)}
                        className="w-24 bg-background border-border h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: ${fixedTotal.toFixed(2)}{fixedTotal === 0 ? " · optional, can be set per instance" : ""}
                </p>
              </>
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={addField}
          disabled={loading || !draft.label.trim() || (draft.fieldType === "SINGLE" && draft.splitMode === "PERCENT" && !percentsValid)}
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
