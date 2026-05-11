import { useState, useEffect } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUpdateField, TEMPLATE_KEYS } from "@/hooks/useTemplates"
import { createSplitRule, createAllocation } from "@/api/templates"
import { useQueryClient } from "@tanstack/react-query"
import type { TemplateField, TemplateParticipant, SplitRule, SplitRuleAllocation, FieldType } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { participantGradient } from "@/lib/participantColors"

function TemplateSplitBar({ splitRuleId, allAllocations, participants }: {
  splitRuleId: string
  allAllocations: Record<string, SplitRuleAllocation[]>
  participants: TemplateParticipant[]
}) {
  const allocations = allAllocations[splitRuleId] ?? []
  const segments = participants
    .map((p, i) => {
      const alloc = allocations.find((a) => a.templateParticipantId === p.id)
      return alloc ? { pct: alloc.percent, colorIndex: i } : null
    })
    .filter(Boolean) as { pct: number; colorIndex: number }[]

  if (!segments.length) return null

  return (
    <div style={{
      position: "relative", height: 32, borderRadius: 999,
      background: "rgba(28,22,46,0.05)",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
      display: "flex", overflow: "hidden",
    }}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1
        return (
          <div key={i} style={{
            width: `${seg.pct}%`,
            background: participantGradient(seg.colorIndex),
            position: "relative",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
            borderRight: !isLast ? "1.5px solid rgba(255,255,255,0.55)" : undefined,
          }}>
            <span style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              ...(isLast ? { right: 10 } : { left: 10 }),
              fontSize: 11, fontWeight: 600, color: "white",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
              fontFamily: "'JetBrains Mono', monospace",
              pointerEvents: "none",
              opacity: seg.pct > 18 ? 1 : 0,
              transition: "opacity .2s",
              whiteSpace: "nowrap",
            }}>
              {Math.round(seg.pct)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

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
    if (fieldType === "SINGLE" && !percentsValid) {
      toast({ title: `Split must sum to 100% (currently ${percentTotal.toFixed(1)}%)`, variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const params: Parameters<typeof updateField.mutateAsync>[0] = { fieldId: field.id, label: label.trim(), fieldType }

      if (fieldType === "MULTIPLE") {
        // MULTIPLE fields carry no defaults — clear any that existed
        if (field.defaultAmount != null) params.clearDefaultAmount = true
        if (field.defaultSplitRuleId) params.clearDefaultSplitRule = true
        if (field.defaultPayerParticipantId) params.clearDefaultPayer = true
      } else {
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
      <div className="rounded-xl p-4 space-y-3 border border-primary/30" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        {/* Label + Type */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-foreground/50 mb-1 block">Label *</label>
            <Input
              placeholder="e.g. Cable Bill"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-white/80 border-black/12 h-8 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-foreground/50 mb-1 block">Type</label>
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

        {/* Default Amount + Default Payer — hidden for MULTIPLE fields */}
        {fieldType === "SINGLE" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Default Amount</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground/40">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/80 border-black/12 pl-6 h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Default Payer</label>
              <select
                value={payerParticipantId}
                onChange={(e) => setPayerParticipantId(e.target.value)}
                className="h-8 text-sm w-full rounded-md border border-black/12 bg-white/80 px-2"
              >
                <option value="">— not tracked —</option>
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
            <label className="text-xs text-foreground/50 block">Split</label>
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="w-24 text-sm text-foreground/60 truncate">{p.name}</span>
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
                  className="w-20 bg-white/80 border-black/12 h-8 text-sm"
                />
                <span className="text-sm text-foreground/50">%</span>
              </div>
            ))}
            <p className={`text-xs font-medium ${percentsValid ? "text-primary" : "text-muted-foreground"}`}>
              {allPercentsEmpty
                ? "No split defined"
                : `Total: ${percentTotal.toFixed(1)}%${percentsValid ? " ✓" : participants.length >= 3 ? ` · ${(100 - percentTotal).toFixed(1)}% remaining` : " (need 100%)"}`
              }
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7">
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !label.trim() || (fieldType === "SINGLE" && !percentsValid)} className="h-7">
            <Check className="h-3.5 w-3.5 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    )
  }

  const payerIndex = participants.findIndex((p) => p.id === field.defaultPayerParticipantId)

  return (
    <div
      className="px-4 py-3 hover:bg-white/25 transition-colors"
      style={{ display: "grid", gridTemplateColumns: "90px 1fr 76px", gap: 14, alignItems: "center" }}
    >
      {/* Default amount */}
      <div className="flex flex-col">
        {field.defaultAmount != null ? (
          <span className="font-semibold text-foreground/80 tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15 }}>
            ${field.defaultAmount.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm text-foreground/35 italic">No default</span>
        )}
      </div>

      {/* Split bar or empty state */}
      {defaultSplitRule ? (
        <TemplateSplitBar
          splitRuleId={defaultSplitRule.id}
          allAllocations={allAllocations}
          participants={participants}
        />
      ) : (
        <div style={{ height: 32, borderRadius: 999, background: "rgba(28,22,46,0.04)" }} />
      )}

      {/* Paid-by pill + edit button */}
      <div className="flex flex-col items-end gap-1.5">
        {defaultPayer && (
          <span style={{
            fontSize: 11, padding: "3px 10px 3px 5px", borderRadius: 999,
            background: "rgba(31,154,107,0.09)", color: "#1a7a55", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 5,
            border: "1px solid rgba(31,154,107,0.18)", whiteSpace: "nowrap",
          }}>
            <span style={{
              width: 16, height: 16, borderRadius: "50%",
              background: participantGradient(payerIndex),
              color: "white", fontSize: 8, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {defaultPayer.name.slice(-1).toUpperCase()}
            </span>
            paid
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-foreground/35 hover:text-foreground/70"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
