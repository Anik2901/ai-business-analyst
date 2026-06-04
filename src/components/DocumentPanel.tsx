import { useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import DocumentTab from './DocumentTab'
import ProgressBar from './ProgressBar'
import type { DocumentTabState, DocumentType, GenerationState } from '@/types'

interface Props {
  generation: GenerationState
  activeTab: DocumentType
  onTabChange: (tab: DocumentType) => void
  onRetry?: (type: DocumentType) => void
  streamingText?: string
}

function StatusIcon({ status }: { status: DocumentTabState['status'] }) {
  switch (status) {
    case 'generating':
      return <Loader2 className="h-3 w-3 animate-spin text-primary" />
    case 'complete':
      return <Check className="h-3 w-3 text-green-500" />
    case 'error':
      return <AlertCircle className="h-3 w-3 text-destructive" />
    default:
      return null
  }
}

// Determine which call step a document type belongs to
function getCallStep(type: DocumentType): number {
  switch (type) {
    case 'brd': case 'frd': case 'nfr': return 1
    case 'stories': return 2
    case 'architecture': return 3
    case 'flows': return 4
    case 'risk': return 5
  }
}

// Labels for downstream document names
const STEP_LABELS: Record<number, string[]> = {
  1: ['BRD', 'FRD', 'NFR', 'User Stories', 'Architecture', 'Flows', 'Risk Analysis'],
  2: ['User Stories', 'Architecture', 'Flows', 'Risk Analysis'],
  3: ['Architecture', 'Flows', 'Risk Analysis'],
  4: ['Flows', 'Risk Analysis'],
  5: ['Risk Analysis'],
}

export default function DocumentPanel({ generation, activeTab, onTabChange, onRetry, streamingText }: Props) {
  const handleRetry = useCallback((type: DocumentType) => {
    if (!onRetry) return

    const step = getCallStep(type)
    // If this is the last step or only affects itself, no confirmation needed
    if (step >= 5) {
      onRetry(type)
      return
    }

    const downstream = STEP_LABELS[step]?.slice(1) || []
    if (downstream.length === 0) {
      onRetry(type)
      return
    }

    const confirmed = window.confirm(
      `Regenerating will also update downstream documents: ${downstream.join(', ')}. Continue?`
    )
    if (confirmed) {
      onRetry(type)
    }
  }, [onRetry])

  return (
    <div className="flex flex-col h-full">
      {generation.isGenerating && (
        <ProgressBar
          currentStep={generation.currentStep}
          totalSteps={generation.totalSteps}
        />
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as DocumentType)}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="w-full justify-start rounded-none border-b bg-background px-2 h-auto flex-wrap gap-0.5 py-1">
          {generation.tabs.map((tab) => (
            <TabsTrigger
              key={tab.type}
              value={tab.type}
              className="data-[state=active]:bg-muted gap-1.5 text-xs px-3 py-1.5"
              disabled={tab.status === 'idle'}
            >
              {tab.label}
              <StatusIcon status={tab.status} />
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {generation.tabs.map((tab) => (
            <TabsContent
              key={tab.type}
              value={tab.type}
              className="h-full mt-0 data-[state=inactive]:hidden"
            >
              <DocumentTab
                tab={tab}
                onRetry={onRetry ? () => handleRetry(tab.type) : undefined}
                streamingText={tab.status === 'generating' ? streamingText : undefined}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}
