import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useTemplates } from "@/hooks/useTemplates"
import { useCreateInstance } from "@/hooks/useInstances"

interface Props {
  open: boolean
  onClose: () => void
  defaultTemplateId?: string
}

export default function NewInstanceDialog({ open, onClose, defaultTemplateId }: Props) {
  const navigate = useNavigate()
  const { data: templates = [] } = useTemplates()
  const createInstance = useCreateInstance()
  const [templateId, setTemplateId] = useState(defaultTemplateId ?? "")
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!templateId) { setError("Select a template"); return }
    if (!name.trim()) { setError("Name is required"); return }
    setError("")
    try {
      const instance = await createInstance.mutateAsync({ templateId, name: name.trim() })
      onClose()
      setName("")
      setTemplateId(defaultTemplateId ?? "")
      navigate(`/instances/${instance.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create instance")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border">
        <DialogHeader>
          <DialogTitle>New Instance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Template</Label>
            {defaultTemplateId ? (
              <p className="text-base font-semibold text-foreground px-1">
                {templates.find((t) => t.id === defaultTemplateId)?.name}
              </p>
            ) : (
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="bg-surface-elevated border-border">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. March 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-elevated border-border"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createInstance.isPending}>
              {createInstance.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
