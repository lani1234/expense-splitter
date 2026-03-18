import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createParticipant } from "@/api/templates"
import { useParticipants } from "@/hooks/useTemplates"
import { useQueryClient } from "@tanstack/react-query"
import { TEMPLATE_KEYS } from "@/hooks/useTemplates"

interface Props {
  templateId: string
  onNext: () => void
  onBack: () => void
}

export default function WizardStep2({ templateId, onNext, onBack }: Props) {
  const qc = useQueryClient()
  const { data: participants = [] } = useParticipants(templateId)
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const addParticipant = async () => {
    const name = newName.trim()
    if (!name) return
    setLoading(true)
    setError("")
    try {
      await createParticipant(templateId, name, participants.length + 1)
      qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.participants(templateId) })
      setNewName("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add participant")
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (newName.trim()) {
      await addParticipant()
    }
    onNext()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add the people who share expenses in this template.
      </p>

      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-surface-elevated px-3 py-2"
          >
            <span className="text-sm font-medium">{p.name}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Participant name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="bg-surface-elevated border-border"
          onKeyDown={(e) => e.key === "Enter" && addParticipant()}
        />
        <Button variant="outline" size="icon" onClick={addParticipant} disabled={loading}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {participants.length === 0 && !newName.trim() && (
        <p className="text-sm text-destructive">Add at least one participant to continue.</p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={participants.length === 0 && !newName.trim()}>
          Next →
        </Button>
      </div>
    </div>
  )
}
