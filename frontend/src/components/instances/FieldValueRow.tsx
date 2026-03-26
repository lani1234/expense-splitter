import { useState, useEffect } from "react"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SplitEditor from "./SplitEditor"
import { useUpdateFieldValue, useDeleteFieldValue, useAmountsByFieldValue } from "@/hooks/useFieldValues"
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
  const updateFieldValue = useUpdateFieldValue(instanceId)
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

  const PARTICIPANT_COLORS = [
    { bg: "bg-blue-50 border-blue-200",       text: "text-blue-700"    },
    { bg: "bg-violet-50 border-violet-200",   text: "text-violet-700"  },
    { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
    { bg: "bg-orange-50 border-orange-200",   text: "text-orange-700"  },
  ]

  const participantData = participantEntryAmounts.map((pea) => {
    const participantIndex = participants.findIndex((p) => p.id === pea.templateParticipantId)
    const name = participants[participantIndex]?.name ?? "?"
    let split: string
    if (fieldValue.splitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
      split = "Fixed"
    } else {
      const allocation = allocations.find((a) => a.templateParticipantId === pea.templateParticipantId)
      const pct = allocation?.percent ?? (fieldValue.amount > 0 ? (pea.amount / fieldValue.amount) * 100 : 0)
      split = `${Math.round(pct)}%`
    }
    return { name, split, amount: `$${pea.amount.toFixed(2)}`, colorIndex: Math.max(participantIndex, 0) }
  })

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(fieldValue.amount))
  const [note, setNote] = useState(fieldValue.note ?? "")
  const [splitMode, setSplitMode] = useState<SplitMode>(fieldValue.splitMode)
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, number>>({})
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  // When entering edit mode for a FIELD_VALUE_CUSTOM_PERCENT entry, reverse-engineer
  // percentages from the stored amounts so the inputs are pre-populated.
  useEffect(() => {
    if (editing && fieldValue.splitMode === "FIELD_VALUE_CUSTOM_PERCENT" && fieldValue.amount > 0) {
      const percs = Object.fromEntries(
        participantEntryAmounts.map((pea) => [
          pea.templateParticipantId,
          Math.round((pea.amount / fieldValue.amount) * 100),
        ])
      )
      setCustomPercentages(percs)
    }
  }, [editing])

  const handleSave = async () => {
    setSaving(true)
    try {
      const newAmount = parseFloat(amount)
      if (isNaN(newAmount) || newAmount < 0) {
        toast({ title: "Invalid amount", variant: "destructive" })
        return
      }

      if (splitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
        const fixedTotal = Object.values(fixedAmounts).reduce((s, v) => s + v, 0)
        if (Math.abs(fixedTotal - newAmount) > 0.01) {
          toast({ title: "Fixed amounts must sum to total", variant: "destructive" })
          return
        }
      }

      if (splitMode === "FIELD_VALUE_CUSTOM_PERCENT") {
        const percentTotal = Object.values(customPercentages).reduce((s, v) => s + v, 0)
        if (Math.abs(percentTotal - 100) > 0.5) {
          toast({ title: "Percentages must sum to 100%", variant: "destructive" })
          return
        }
      }

      let participantAmounts: Record<string, number> | undefined
      if (splitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
        participantAmounts = fixedAmounts
      } else if (splitMode === "FIELD_VALUE_CUSTOM_PERCENT") {
        // Convert percentages to amounts; assign rounding remainder to the last participant
        const ids = Object.keys(customPercentages)
        participantAmounts = {}
        let remaining = newAmount
        ids.forEach((id, i) => {
          if (i === ids.length - 1) {
            participantAmounts![id] = Math.round(remaining * 100) / 100
          } else {
            const amt = Math.round((customPercentages[id] / 100) * newAmount * 100) / 100
            participantAmounts![id] = amt
            remaining -= amt
          }
        })
      }

      await updateFieldValue.mutateAsync({
        fieldValueId: fieldValue.id,
        amount: newAmount,
        note: note.trim() || undefined,
        splitMode,
        participantAmounts,
      })
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
    setFixedAmounts({})
    setCustomPercentages({})
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
          defaultSplitRuleId={defaultSplitRuleId}
          currentSplitMode={splitMode}
          totalAmount={parseFloat(amount) || 0}
          onSplitModeChange={setSplitMode}
          onFixedAmountsChange={setFixedAmounts}
          fixedAmounts={fixedAmounts}
          customPercentages={customPercentages}
          onCustomPercentagesChange={setCustomPercentages}
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
    <div className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-surface-elevated group">
      <div className="shrink-0 flex flex-col w-[8rem]">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          ${fieldValue.amount.toFixed(2)}
        </span>
        {fieldValue.note && (
          <span className="text-xs text-muted-foreground italic break-words">{fieldValue.note}</span>
        )}
      </div>
      <span className={"flex-1 flex flex-wrap justify-start gap-1.5 items-center"}>
        {participantData.map(({ name, split, amount, colorIndex }, i) => {
          const colors = PARTICIPANT_COLORS[colorIndex % PARTICIPANT_COLORS.length]
          return (
            <span
              key={i}
              className={`text-xs rounded-full border px-2.5 py-0.5 whitespace-nowrap inline-flex items-center gap-1.5 ${colors.bg} ${colors.text}`}
            >
              <span className="font-semibold w-[3rem] truncate">{name}</span>
              <span className="opacity-40">·</span>
              <span className="opacity-70 min-w-[2.25rem] text-center">{split}</span>
              <span className="opacity-40">·</span>
              <span className="font-semibold tabular-nums min-w-[4rem] text-right">{amount}</span>
            </span>
          )
        })}
      </span>
      {!isSettled && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-[3.25rem] shrink-0">
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
