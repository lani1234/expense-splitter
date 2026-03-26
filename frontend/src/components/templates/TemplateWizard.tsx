import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import WizardStep1 from "./WizardStep1"
import WizardStep2 from "./WizardStep2"
import WizardStep3 from "./WizardStep3"
import { deleteTemplate } from "@/api/templates"
import { useQueryClient } from "@tanstack/react-query"
import { TEMPLATE_KEYS } from "@/hooks/useTemplates"

interface Props {
  open: boolean
  onClose: () => void
}

const STEP_LABELS = ["Basic Info", "Participants", "Fields"]

export default function TemplateWizard({ open, onClose }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState<string | null>(null)

  const handleClose = async () => {
    if (templateId) {
      await deleteTemplate(templateId).catch(() => null)
    }
    setStep(1)
    setTemplateId(null)
    setTemplateName(null)
    onClose()
  }

  const handleFinish = () => {
    qc.invalidateQueries({ queryKey: TEMPLATE_KEYS.byUser() })
    setStep(1)
    setTemplateId(null)
    setTemplateName(null)
    onClose()
    navigate("/templates")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl bg-surface border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">
              {step === 1 && "New Template"}
              {step === 2 && "Add Participants"}
              {step === 3 && "Add Fields"}
              {step > 1 && templateName && (
                <span className="text-sm font-normal text-muted-foreground ml-2">— {templateName}</span>
              )}
            </DialogTitle>
            <span className="text-sm text-muted-foreground mr-6">
              Step {step} of 3 — {STEP_LABELS[step - 1]}
            </span>
          </div>
          <div className="flex gap-1 pt-2">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-primary" : "bg-surface-elevated"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <WizardStep1
              onNext={(id, name) => {
                setTemplateId(id)
                setTemplateName(name)
                setStep(2)
              }}
              onCancel={handleClose}
            />
          )}
          {step === 2 && templateId && (
            <WizardStep2
              templateId={templateId}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && templateId && (
            <WizardStep3
              templateId={templateId}
              onFinish={handleFinish}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
