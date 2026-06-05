import { useState, useCallback } from 'react'
import type { ChatMessage, GenerationState, SavedSession } from '@/types'

const SESSIONS_KEY = 'ba-sessions'

function loadSessions(): SavedSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: SavedSession[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    // localStorage quota exceeded — drop oldest sessions and retry, then give up
    // quietly rather than crashing the whole app.
    for (const keep of [10, 5, 2, 1, 0]) {
      try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, keep))); return } catch { /* try fewer */ }
    }
  }
}

// Extract a short name from the first user message
function extractSessionName(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg) return 'Untitled Session'
  const text = firstUserMsg.content
  // Take first 60 chars, cut at last word boundary
  if (text.length <= 60) return text
  return text.slice(0, 60).replace(/\s+\S*$/, '') + '...'
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SavedSession[]>(loadSessions)

  // Auto-save current session (called after generation completes)
  const saveSession = useCallback((
    messages: ChatMessage[],
    generation: GenerationState,
    outputs: Record<string, string>,
    chatContext: string,
    existingId?: string
  ) => {
    const hasComplete = generation.tabs.some(t => t.status === 'complete')
    if (!hasComplete && messages.length === 0) return

    const id = existingId || crypto.randomUUID()
    const session: SavedSession = {
      id,
      name: extractSessionName(messages),
      timestamp: Date.now(),
      messages,
      generation: { ...generation, isGenerating: false },
      outputs,
      chatContext,
    }

    setSessions(prev => {
      // Replace if same id, otherwise prepend
      const existing = prev.findIndex(s => s.id === id)
      let updated: SavedSession[]
      if (existing >= 0) {
        updated = [...prev]
        updated[existing] = session
      } else {
        updated = [session, ...prev]
      }
      saveSessions(updated)
      return updated
    })

    return id
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id)
      saveSessions(updated)
      return updated
    })
  }, [])

  const getSession = useCallback((id: string): SavedSession | undefined => {
    return sessions.find(s => s.id === id)
  }, [sessions])

  return { sessions, saveSession, deleteSession, getSession }
}
