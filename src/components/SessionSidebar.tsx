import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { X, Trash2, FileText } from 'lucide-react'
import type { SavedSession } from '@/types'

interface Props {
  sessions: SavedSession[]
  activeSessionId?: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

function countDocs(session: SavedSession): number {
  return session.generation.tabs.filter(t => t.status === 'complete').length
}

export default function SessionSidebar({ sessions, activeSessionId, onSelect, onDelete, onClose }: Props) {
  return (
    <div className="w-72 border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Session History</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p>No saved sessions yet.</p>
            <p className="mt-1">Sessions auto-save when documents are generated.</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`group rounded-lg p-3 cursor-pointer transition-colors ${
                  session.id === activeSessionId
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted border border-transparent'
                }`}
                onClick={() => onSelect(session.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                    {session.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(session.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>{formatDate(session.timestamp)}</span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {countDocs(session)} docs
                  </span>
                  <span>{session.messages.length} msgs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
