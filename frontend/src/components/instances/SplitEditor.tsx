import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSplitRules, useParticipants } from "@/hooks/useTemplates"
import type { SplitMode } from "@/types"

const SPLIT_MODE_OPTIONS = [
  { value: "TEMPLATE_FIELD_PERCENT_SPLIT", label: "Template Default" },
  { value: "FIELD_VALUE_CUSTOM_PERCENT", label: "Custom Split Rule" },
  { value: "FIELD_VALUE_FIXED_AMOUNTS", label: "Fixed Amounts" },
] as const

interface Props {
  templateId: string
  currentSplitMode: SplitMode
  currentSplitRuleId?: string
  totalAmount: number
  onSplitModeChange: (mode: SplitMode, splitRuleId?: string) => void
  onFixedAmountsChange: (amounts: Record<string, number>) => void
  fixedAmounts: Record<string, number>
}

export default function SplitEditor({
  templateId,
  currentSplitMode,
  currentSplitRuleId,
  totalAmount,
  onSplitModeChange,
  onFixedAmountsChange,
  fixedAmounts,
}: Props) {
  const { data: splitRules = [] } = useSplitRules(templateId)
  const { data: participants = [] } = useParticipants(templateId)

  const [selectedRuleId, setSelectedRuleId] = useState(currentSplitRuleId ?? "")

  const fixedTotal = Object.values(fixedAmounts).reduce((s, v) => s + (v || 0), 0)
  const remaining = totalAmount - fixedTotal

  const handleModeChange = (mode: SplitMode) => {
    if (mode === "FIELD_VALUE_CUSTOM_PERCENT") {
      onSplitModeChange(mode, selectedRuleId || undefined)
    } else {
      onSplitModeChange(mode, undefined)
    }
  }

  const handleRuleChange = (ruleId: string) => {
    setSelectedRuleId(ruleId)
    onSplitModeChange("FIELD_VALUE_CUSTOM_PERCENT", ruleId)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Split Mode</Label>
        <Select value={currentSplitMode} onValueChange={(v) => handleModeChange(v as SplitMode)}>
          <SelectTrigger className="bg-background border-border h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border">
            {SPLIT_MODE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentSplitMode === "FIELD_VALUE_CUSTOM_PERCENT" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Split Rule</Label>
          <Select value={selectedRuleId} onValueChange={handleRuleChange}>
            <SelectTrigger className="bg-background border-border h-8 text-sm">
              <SelectValue placeholder="Select rule..." />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border">
              {splitRules.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                value={fixedAmounts[p.id] ?? ""}
                onChange={(e) =>
                  onFixedAmountsChange({
                    ...fixedAmounts,
                    [p.id]: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-24 bg-background border-border h-7 text-sm"
              />
            </div>
          ))}
          <p className={`text-xs ${Math.abs(remaining) < 0.01 ? "text-primary" : "text-destructive"}`}>
            Remaining: ${remaining.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  )
}
