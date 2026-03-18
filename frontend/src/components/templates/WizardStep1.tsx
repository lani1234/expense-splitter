import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTemplate } from "@/api/templates"
import { CURRENT_USER_ID } from "@/config/constants"

interface Props {
  onNext: (templateId: string) => void
  onCancel: () => void
}

export default function WizardStep1({ onNext, onCancel }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleNext = async () => {
    if (!name.trim()) {
      setError("Template name is required")
      return
    }
    setLoading(true)
    setError("")
    try {
      const template = await createTemplate(CURRENT_USER_ID, name.trim(), description.trim() || undefined)
      onNext(template.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create template")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name *</Label>
        <Input
          id="name"
          placeholder="e.g. Monthly Expenses"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-surface-elevated border-border"
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Textarea
          id="desc"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-surface-elevated border-border resize-none"
          rows={3}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleNext} disabled={loading}>
          {loading ? "Creating..." : "Next →"}
        </Button>
      </div>
    </div>
  )
}
