import { useState, useEffect, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParticipants, useAllocations } from "@/hooks/useTemplates"
import type { SplitMode } from "@/types"

interface Props {
  templateId: string
  defaultSplitRuleId?: string
  currentSplitMode: SplitMode
  totalAmount: number
  onSplitModeChange: (mode: SplitMode) => void
  onFixedAmountsChange: (amounts: Record<string, number>) => void
  fixedAmounts: Record<string, number>
  customPercentages: Record<string, number>
  onCustomPercentagesChange: (percentages: Record<string, number>) => void
}

export default function SplitEditor({
  templateId,
  defaultSplitRuleId,
  currentSplitMode,
  totalAmount,
  onSplitModeChange,
  onFixedAmountsChange,
  fixedAmounts,
  customPercentages,
  onCustomPercentagesChange,
}: Props) {
  const { data: participants = [] } = useParticipants(templateId)
  const { data: defaultAllocations = [] } = useAllocations(defaultSplitRuleId ?? "")

  const templateDefaultLabel = useMemo(() => {
    if (!defaultAllocations.length) return "Template Default"
    const pcts = participants
      .map((p) => defaultAllocations.find((a) => a.templateParticipantId === p.id))
      .filter(Boolean)
      .map((a) => `${Math.round(a!.percent)}%`)
    return pcts.length ? `Template Default (${pcts.join(" / ")})` : "Template Default"
  }, [defaultAllocations, participants])

  // Track which participants the user has explicitly typed into.
  // Only those are held fixed during auto-fill; all others are fair game
  // to recalculate on every keystroke, which prevents stale intermediate
  // values from blocking subsequent updates.
  const [manuallySet, setManuallySet] = useState<Set<string>>(new Set())

  // Reset when the split mode changes so switching modes starts fresh.
  useEffect(() => {
    setManuallySet(new Set())
  }, [currentSplitMode])


  function autoDistribute(
    amounts: Record<string, number>,
    changedId: string,
    newValue: number,
    nextManuallySet: Set<string>,
    total: number,
    decimals: number
  ): Record<string, number> {
    const updated = { ...amounts, [changedId]: newValue }
    // targets = participants the user hasn't typed into (safe to overwrite)
    const targets = participants.filter((p) => !nextManuallySet.has(p.id))
    if (targets.length === 0) return updated
    const manualSum = participants
      .filter((p) => nextManuallySet.has(p.id))
      .reduce((s, p) => s + (updated[p.id] || 0), 0)
    const remaining = total - manualSum
    if (remaining < 0) return updated
    const factor = Math.pow(10, decimals)
    const each = Math.round((remaining / targets.length) * factor) / factor
    targets.forEach((p, i) => {
      if (i === targets.length - 1) {
        const soFar = targets.slice(0, -1).length * each
        updated[p.id] = Math.max(0, Math.round((remaining - soFar) * factor) / factor)
      } else {
        updated[p.id] = each
      }
    })
    return updated
  }

  const handleFixedAmountChange = (id: string, raw: string) => {
    const value = parseFloat(raw) || 0
    const next = new Set([...manuallySet, id])
    setManuallySet(next)
    onFixedAmountsChange(autoDistribute(fixedAmounts, id, value, next, totalAmount, 2))
  }

  const handlePercentChange = (id: string, raw: string) => {
    const value = parseFloat(raw) || 0
    const next = new Set([...manuallySet, id])
    setManuallySet(next)
    onCustomPercentagesChange(autoDistribute(customPercentages, id, value, next, 100, 0))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Split Mode</Label>
        <Select value={currentSplitMode} onValueChange={(v) => onSplitModeChange(v as SplitMode)}>
          <SelectTrigger className="bg-background border-border h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border">
            <SelectItem value="TEMPLATE_FIELD_PERCENT_SPLIT">{templateDefaultLabel}</SelectItem>
            <SelectItem value="FIELD_VALUE_CUSTOM_PERCENT">Custom Percentage Split</SelectItem>
            <SelectItem value="FIELD_VALUE_FIXED_AMOUNTS">Fixed Amounts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentSplitMode === "FIELD_VALUE_CUSTOM_PERCENT" && (
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-20 text-xs text-muted-foreground">{p.name}</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="0"
                value={customPercentages[p.id] || ""}
                onChange={(e) => handlePercentChange(p.id, e.target.value)}
                className="w-20 bg-background border-border h-7 text-sm"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          ))}
        </div>
      )}

      {currentSplitMode === "FIELD_VALUE_FIXED_AMOUNTS" && (
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-20 text-xs text-muted-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={fixedAmounts[p.id] || ""}
                onChange={(e) => handleFixedAmountChange(p.id, e.target.value)}
                className="w-24 bg-background border-border h-7 text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
