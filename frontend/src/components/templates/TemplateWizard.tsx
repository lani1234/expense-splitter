import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import WizardStep1 from "./WizardStep1"
import { useQueryClient } from "@tanstack/react-query"
import { TEMPLATE_KEYS } from "@/hooks/useTemplates"

interface Props {
  open: boolean
  onClose: () => void
}

export default function TemplateWizard({ open, onClose }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const handleCreated = (templateId: string) => {
    qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.all })
    onClose()
    navigate(`/templates/${templateId}`)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Template</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <WizardStep1 onNext={(id) => handleCreated(id)} onCancel={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
