import { BrainCircuit, History } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  phase: 'chat' | 'generating' | 'complete'
  onReset?: () => void
  onToggleHistory?: () => void
  sessionCount?: number
}

export default function Header({ phase, onReset, onToggleHistory, sessionCount = 0 }: Props) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background shrink-0">
      <div className="flex items-center gap-3">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold tracking-tight">AI Business Analyst</h1>
        {phase === 'generating' && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full animate-pulse">
            Generating documents...
          </span>
        )}
        {phase === 'complete' && (
          <span className="text-xs font-medium text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950 px-2 py-0.5 rounded-full">
            Complete
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onToggleHistory && (
          <Button variant="ghost" size="sm" onClick={onToggleHistory} className="gap-1.5 text-muted-foreground">
            <History className="h-4 w-4" />
            History{sessionCount > 0 && ` (${sessionCount})`}
          </Button>
        )}
        {phase !== 'chat' && onReset && (
          <button
            onClick={onReset}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Start Over
          </button>
        )}
      </div>
    </header>
  )
}
