import { useState, useEffect } from "react"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SplitEditor from "./SplitEditor"
import { useUpdateFieldValue, useDeleteFieldValue, useAmountsByFieldValue } from "@/hooks/useFieldValues"
import { useParticipants, useAllocations } from "@/hooks/useTemplates"
import type { InstanceFieldValue, SplitMode } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { participantGradient } from "@/lib/participantColors"

function SplitBar({ segments, isFixed }: { segments: ParticipantSegment[]; isFixed: boolean }) {
  const total = segments.reduce((s, seg) => s + seg.rawAmount, 0)
  if (total === 0 || segments.length === 0) {
    return (
      <div style={{ height: 32, borderRadius: 999, background: "rgba(28,22,46,0.05)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)" }} />
    )
  }
  return (
    <div
      style={{
        position: "relative",
        height: 32,
        borderRadius: 999,
        background: "rgba(28,22,46,0.05)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {segments.map((seg, i) => {
        const pct = (seg.rawAmount / total) * 100
        const isLast = i === segments.length - 1
        return (
          <div
            key={i}
            style={{
              width: `${pct}%`,
              background: participantGradient(seg.colorIndex),
              position: "relative",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
              borderRight: !isLast ? "1.5px solid rgba(255,255,255,0.55)" : undefined,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                ...(isLast ? { right: 10 } : { left: 10 }),
                fontSize: 11,
                fontWeight: 600,
                color: "white",
                textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                fontFamily: "'JetBrains Mono', monospace",
                pointerEvents: "none",
                opacity: pct > 18 ? 1 : 0,
                transition: "opacity .2s",
                whiteSpace: "nowrap",
              }}
            >
              {isFixed ? "fixed" : seg.split} · {seg.amount}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface ParticipantSegment {
  name: string
  split: string
  amount: string
  rawAmount: number
  colorIndex: number
}

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

  const isFixed = fieldValue.splitMode === "FIELD_VALUE_FIXED_AMOUNTS"

  const participantData: ParticipantSegment[] = participantEntryAmounts.map((pea) => {
    const participantIndex = participants.findIndex((p) => p.id === pea.templateParticipantId)
    const name = participants[participantIndex]?.name ?? "?"
    let split: string
    if (isFixed) {
      split = "fixed"
    } else {
      const allocation = allocations.find((a) => a.templateParticipantId === pea.templateParticipantId)
      const pct = allocation?.percent ?? (fieldValue.amount > 0 ? (pea.amount / fieldValue.amount) * 100 : 0)
      split = `${Math.round(pct)}%`
    }
    return {
      name,
      split,
      amount: `$${pea.amount.toFixed(2)}`,
      rawAmount: pea.amount,
      colorIndex: Math.max(participantIndex, 0),
    }
  })

  const payerIndex = participants.findIndex((p) => p.id === fieldValue.payerParticipantId)
  const payerParticipant = participants[payerIndex]

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(fieldValue.amount))
  const [note, setNote] = useState(fieldValue.note ?? "")
  const [splitMode, setSplitMode] = useState<SplitMode>(fieldValue.splitMode)
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, number>>({})
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({})
  const [payerParticipantId, setPayerParticipantId] = useState(fieldValue.payerParticipantId ?? "")
  const [saving, setSaving] = useState(false)

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
        payerParticipantId: payerParticipantId || null,
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
    setPayerParticipantId(fieldValue.payerParticipantId ?? "")
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        className="rounded-xl p-4 space-y-3 border border-primary/30"
        style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-foreground/50 mb-1 block">Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground/40">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/60 border-white/70 pl-6 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-foreground/50 mb-1 block">Note</label>
            <Input
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-white/60 border-white/70 h-8 text-sm"
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

        <div>
          <label className="text-xs text-foreground/50 mb-1 block">Paid by</label>
          <select
            value={payerParticipantId}
            onChange={(e) => setPayerParticipantId(e.target.value)}
            className="h-8 text-sm w-full rounded-md border border-white/70 bg-white/60 px-2"
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

  return (
    <div
      className="group px-4 py-3"
      style={{
        display: "grid",
        gridTemplateColumns: "90px 1fr auto",
        gap: 14,
        alignItems: "center",
      }}
    >
      {/* Amount + note */}
      <div className="flex flex-col">
        <span
          className="font-semibold text-foreground/80 tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15 }}
        >
          ${fieldValue.amount.toFixed(2)}
        </span>
        {fieldValue.note && (
          <span className="text-xs text-foreground/40 italic mt-0.5">{fieldValue.note}</span>
        )}
      </div>

      {/* Split bar */}
      <SplitBar segments={participantData} isFixed={isFixed} />

      {/* Right: paid-by pill + action buttons */}
      <div className="flex flex-col items-end gap-1.5">
        {payerParticipant && (
          <span
            style={{
              fontSize: 11,
              padding: "3px 10px 3px 5px",
              borderRadius: 999,
              background: "rgba(31,154,107,0.09)",
              color: "#1a7a55",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid rgba(31,154,107,0.18)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: participantGradient(payerIndex),
                color: "white",
                fontSize: 8,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {payerParticipant.name.slice(-1).toUpperCase()}
            </span>
            paid
          </span>
        )}
        {!isSettled && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground/35 hover:text-foreground/70"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {isDeletable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground/35 hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
