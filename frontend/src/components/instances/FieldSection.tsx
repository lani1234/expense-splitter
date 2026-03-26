import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import FieldValueRow from "./FieldValueRow"
import SplitEditor from "./SplitEditor"
import { useAddFieldValue } from "@/hooks/useFieldValues"
import type { TemplateField, InstanceFieldValue, SplitMode } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface Props {
  field: TemplateField
  fieldValues: InstanceFieldValue[]
  instanceId: string
  templateId: string
  isSettled: boolean
}

export default function FieldSection({
  field,
  fieldValues,
  instanceId,
  templateId,
  isSettled,
}: Props) {
  const { toast } = useToast()
  const addFieldValue = useAddFieldValue(instanceId)
  const [showAdd, setShowAdd] = useState(false)
  const [newAmount, setNewAmount] = useState("")
  const [newNote, setNewNote] = useState("")
  const [newSplitMode, setNewSplitMode] = useState<SplitMode>("TEMPLATE_FIELD_PERCENT_SPLIT")
  const [newFixedAmounts, setNewFixedAmounts] = useState<Record<string, number>>({})
  const [newCustomPercentages, setNewCustomPercentages] = useState<Record<string, number>>({})
  const [adding, setAdding] = useState(false)

  const isMultiple = field.fieldType === "MULTIPLE"

  const handleAdd = async () => {
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" })
      return
    }

    if (newSplitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
      const fixedTotal = Object.values(newFixedAmounts).reduce((s, v) => s + v, 0)
      if (Math.abs(fixedTotal - amount) > 0.01) {
        toast({ title: "Fixed amounts must sum to total", variant: "destructive" })
        return
      }
    }

    if (newSplitMode === "FIELD_VALUE_CUSTOM_PERCENT") {
      const percentTotal = Object.values(newCustomPercentages).reduce((s, v) => s + v, 0)
      if (Math.abs(percentTotal - 100) > 0.5) {
        toast({ title: "Percentages must sum to 100%", variant: "destructive" })
        return
      }
    }

    let participantAmounts: Record<string, number> | undefined
    if (newSplitMode === "FIELD_VALUE_FIXED_AMOUNTS") {
      participantAmounts = newFixedAmounts
    } else if (newSplitMode === "FIELD_VALUE_CUSTOM_PERCENT") {
      const ids = Object.keys(newCustomPercentages)
      participantAmounts = {}
      let remaining = amount
      ids.forEach((id, i) => {
        if (i === ids.length - 1) {
          participantAmounts![id] = Math.round(remaining * 100) / 100
        } else {
          const amt = Math.round((newCustomPercentages[id] / 100) * amount * 100) / 100
          participantAmounts![id] = amt
          remaining -= amt
        }
      })
    }

    setAdding(true)
    try {
      await addFieldValue.mutateAsync({
        templateFieldId: field.id,
        amount,
        note: newNote.trim() || undefined,
        splitMode: newSplitMode,
        participantAmounts,
      })
      setShowAdd(false)
      setNewAmount("")
      setNewNote("")
      setNewSplitMode("TEMPLATE_FIELD_PERCENT_SPLIT")
      setNewFixedAmounts({})
      setNewCustomPercentages({})
    } catch (e) {
      toast({
        title: "Failed to add entry",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-foreground pl-2 border-l-2 border-primary">{field.label}</h3>
        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
          {field.fieldType}
        </Badge>
      </div>

      <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-sm">
        {fieldValues.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground italic">No entries yet</p>
        ) : (
          <div className="divide-y-2 divide-slate-200">
            {fieldValues.map((fv, i) => (
              <div key={fv.id} className={i % 2 === 1 ? "bg-slate-100" : ""}>
                <FieldValueRow
                  fieldValue={fv}
                  templateId={templateId}
                  instanceId={instanceId}
                  isDeletable={isMultiple}
                  isSettled={isSettled}
                  defaultSplitRuleId={field.defaultSplitRuleId}
                />
              </div>
            ))}
          </div>
        )}

        {/* Add entry row for MULTIPLE fields */}
        {isMultiple && !isSettled && (
          <>
            {showAdd ? (
              <div className="p-3 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Amount *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="bg-background border-border pl-6 h-8 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Note</label>
                    <Input
                      placeholder="Optional"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="bg-background border-border h-8 text-sm"
                    />
                  </div>
                </div>
                <SplitEditor
                  templateId={templateId}
                  defaultSplitRuleId={field.defaultSplitRuleId}
                  currentSplitMode={newSplitMode}
                  totalAmount={parseFloat(newAmount) || 0}
                  onSplitModeChange={setNewSplitMode}
                  onFixedAmountsChange={setNewFixedAmounts}
                  fixedAmounts={newFixedAmounts}
                  customPercentages={newCustomPercentages}
                  onCustomPercentagesChange={setNewCustomPercentages}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="h-7">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAdd} disabled={adding} className="h-7">
                    {adding ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="flex w-full items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors border-t border-border"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Entry
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
