import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import { useGenerate } from '@/hooks/useGenerate'
import type { DocumentType } from '@/types'
import { extractText } from '@/lib/fileText'
import { useSessionHistory } from '@/hooks/useSessionHistory'
import Header from '@/components/Header'
import ChatPanel from '@/components/ChatPanel'
import DocumentPanel from '@/components/DocumentPanel'
import ExportBar from '@/components/ExportBar'
import SessionSidebar from '@/components/SessionSidebar'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

function getInitialPhase(hasCompleteDocs: boolean): 'chat' | 'generating' | 'complete' {
  if (hasCompleteDocs) return 'complete'
  return 'chat'
}

export default function App() {
  const chat = useChat()
  const gen = useGenerate()
  const history = useSessionHistory()
  const hasCompleteDocs = gen.generation.tabs.some(t => t.status === 'complete')
  const [phase, setPhase] = useState<'chat' | 'generating' | 'complete'>(() => getInitialPhase(hasCompleteDocs))
  const [showHistory, setShowHistory] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const sessionIdRef = useRef<string | undefined>(undefined)

  // Auto-save session when generation completes or documents are edited
  useEffect(() => {
    if (phase === 'complete' && hasCompleteDocs && !gen.generation.isGenerating) {
      const id = history.saveSession(
        chat.messages,
        gen.generation,
        gen.getOutputs(),
        chat.getChatContext(),
        sessionIdRef.current
      )
      if (id) sessionIdRef.current = id
    }
  }, [phase, hasCompleteDocs, gen.generation])

  // On load, drop stale documents that were generated from a DIFFERENT conversation
  // than the one currently restored. Prevents cross-pollination when a prior
  // generation was interrupted and a new topic was started.
  useEffect(() => {
    const firstUserMsg = chat.messages.find(m => m.role === 'user')?.content ?? ''
    const docsSig = gen.getSourceSignature()
    const hasDocs = gen.generation.tabs.some(t => t.status !== 'idle')
    if (hasDocs && firstUserMsg && docsSig && firstUserMsg !== docsSig) {
      gen.reset()
      setPhase('chat')
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detect which document the user is referring to in their message
  const detectDocType = (msg: string): DocumentType => {
    const lower = msg.toLowerCase()
    const mapping: Array<{ keywords: string[]; type: DocumentType }> = [
      { keywords: ['brd', 'business requirement'], type: 'brd' },
      { keywords: ['frd', 'functional requirement'], type: 'frd' },
      { keywords: ['nfr', 'non-functional', 'non functional'], type: 'nfr' },
      { keywords: ['user stor', 'stories', 'epic'], type: 'stories' },
      { keywords: ['architect', 'tech stack', 'database schema', 'er diagram'], type: 'architecture' },
      { keywords: ['flow', 'journey', 'sequence', 'data flow'], type: 'flows' },
      { keywords: ['risk', 'effort', 'roadmap', 'mvp'], type: 'risk' },
    ]
    for (const { keywords, type } of mapping) {
      if (keywords.some(k => lower.includes(k))) return type
    }
    return gen.activeTab
  }

  // Handle chat messages — if documents are generated, route to document editing
  const handleSend = async (content: string) => {
    if (phase === 'complete' && hasCompleteDocs) {
      // Add user message to chat
      chat.sendMessage(content)
      // Detect which doc and edit it
      const docType = detectDocType(content)
      if (docType) {
        const result = await gen.editDocument(docType, content)
        // The result message is shown via the document tab updating
        console.log(result)
      }
    } else {
      // Starting a brand-new conversation? Drop any stale docs left over from a
      // previous topic so the documents on screen always match the current chat.
      if (chat.messages.length === 0) {
        const hasStaleGeneration = gen.generation.tabs.some(t => t.status !== 'idle')
        if (hasStaleGeneration) gen.reset()
      }
      chat.sendMessage(content)
    }
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const text = await extractText(file)
      const wrapped = `I've uploaded my notes / gathered requirements (from "${file.name}"). Please read them, recap what you can extract across the five areas, and ask me only about what's still missing.\n\n--- NOTES ---\n${text}`
      // starting a fresh conversation? drop stale docs first (same as handleSend)
      if (chat.messages.length === 0) {
        const hasStaleGeneration = gen.generation.tabs.some(t => t.status !== 'idle')
        if (hasStaleGeneration) gen.reset()
      }
      chat.sendMessage(wrapped, { name: file.name })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerate = async () => {
    setPhase('generating')
    const context = chat.getChatContext()
    const signature = chat.messages.find(m => m.role === 'user')?.content ?? ''
    await gen.generate(context, signature)
    setPhase('complete')
  }

  const handleReset = () => {
    // Auto-save before resetting if there's content
    if (chat.messages.length > 0 || hasCompleteDocs) {
      history.saveSession(
        chat.messages,
        gen.generation,
        gen.getOutputs(),
        chat.getChatContext(),
        sessionIdRef.current
      )
    }
    chat.reset()
    gen.reset()
    sessionIdRef.current = undefined
    setPhase('chat')
  }

  const handleLoadSession = (sessionId: string) => {
    const session = history.getSession(sessionId)
    if (!session) return

    // Auto-save current session first
    if (chat.messages.length > 0 || hasCompleteDocs) {
      history.saveSession(
        chat.messages,
        gen.generation,
        gen.getOutputs(),
        chat.getChatContext(),
        sessionIdRef.current
      )
    }

    // Load the selected session
    chat.loadSession(session.messages)
    const sig = session.messages.find(m => m.role === 'user')?.content ?? ''
    gen.loadSession(session.generation, session.outputs, session.chatContext, sig)
    sessionIdRef.current = session.id
    setPhase(session.generation.tabs.some(t => t.status === 'complete') ? 'complete' : 'chat')
    setShowHistory(false)
  }

  const showDocPanel = phase !== 'chat'

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header phase={phase} onReset={handleReset} onToggleHistory={() => setShowHistory(!showHistory)} sessionCount={history.sessions.length} />
      <main className="flex-1 overflow-hidden flex">
        {showHistory && (
          <SessionSidebar
            sessions={history.sessions}
            activeSessionId={sessionIdRef.current}
            onSelect={handleLoadSession}
            onDelete={history.deleteSession}
            onClose={() => setShowHistory(false)}
          />
        )}
        <div className="flex-1 overflow-hidden">
          {showDocPanel ? (
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={35} minSize={25}>
                <ChatPanel
                  messages={chat.messages}
                  isLoading={chat.isLoading}
                  readyToGenerate={false}
                  showGenerate={false}
                  isUploading={isUploading}
                  onSend={handleSend}
                  onUpload={handleUpload}
                  onGenerate={handleGenerate}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={65} minSize={40}>
                <div id="document-content" className="h-full">
                  <DocumentPanel
                    generation={gen.generation}
                    activeTab={gen.activeTab}
                    onTabChange={gen.setActiveTab}
                    onRetry={gen.regenerate}
                    streamingText={gen.streamingText}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="max-w-2xl mx-auto h-full">
              <ChatPanel
                messages={chat.messages}
                isLoading={chat.isLoading}
                readyToGenerate={chat.readyToGenerate}
                showGenerate={chat.messages.some(m => m.role === 'assistant')}
                isUploading={isUploading}
                onSend={handleSend}
                onUpload={handleUpload}
                onGenerate={handleGenerate}
              />
            </div>
          )}
        </div>
      </main>
      {showDocPanel && (
        <ExportBar
          tabs={gen.generation.tabs}
          activeTab={gen.activeTab}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
