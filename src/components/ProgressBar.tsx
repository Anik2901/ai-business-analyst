import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

interface Props {
  currentStep: number
  totalSteps: number
}

const STEP_LABELS = [
  'Business Requirements (BRD)',
  'Functional Requirements (FRD)',
  'Non-Functional Requirements (NFR)',
  'User Stories',
  'Architecture Design',
  'Flow Diagrams',
  'Risk Analysis',
]

export default function ProgressBar({ currentStep, totalSteps }: Props) {
  const percentage = Math.round((currentStep / totalSteps) * 100)
  const label = STEP_LABELS[currentStep - 1] || 'Processing...'

  return (
    <div className="px-4 py-3 border-b border-border bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Generating: {label}...
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentStep} of {totalSteps}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
