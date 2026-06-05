import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, FileText, Paperclip, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCEPTED_UPLOAD } from '@/lib/fileText'
import ChatMessage from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/types'

interface Props {
  messages: ChatMessageType[]
  isLoading: boolean
  readyToGenerate: boolean
  showGenerate: boolean
  isUploading: boolean
  onSend: (content: string) => void
  onUpload: (file: File) => void
  onGenerate: () => void
}

export default function ChatPanel({ messages, isLoading, readyToGenerate, showGenerate, isUploading, onSend, onUpload, onGenerate }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isLoading])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = '' // allow re-selecting the same file
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to AI Business Analyst</h2>
            <p className="text-muted-foreground max-w-md">
              Tell me about your product idea and I will ask clarifying questions to understand your vision.
              Then I will generate a complete suite of professional business analysis documents.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {[
                'A marketplace for freelance designers',
                'A fitness tracking app with AI coaching',
                'An inventory management SaaS for restaurants',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    textareaRef.current?.focus()
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1 justify-center">
              or click the <Paperclip className="inline h-3 w-3" /> button to upload your notes (.txt, .md, .pdf)
            </p>
          </div>
        )}
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5 bg-muted text-muted-foreground">
              <span className="text-xs font-bold">BA</span>
            </div>
            <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border shrink-0">
        {showGenerate && (
          <div className="mb-3">
            <Button
              onClick={onGenerate}
              disabled={isLoading}
              className={cn(
                'w-full',
                readyToGenerate
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : ''
              )}
              variant={readyToGenerate ? 'default' : 'outline'}
              size="lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate All Documents
            </Button>
            {!readyToGenerate && (
              <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                Answer a few questions for the best results — or generate anytime.
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input ref={fileInputRef} type="file" accept={ACCEPTED_UPLOAD} className="hidden" onChange={handleFileChange} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isUploading || isLoading}
            onClick={() => fileInputRef.current?.click()}
            title="Upload notes (.txt, .md, .pdf)"
            className="shrink-0 h-[44px] w-[44px]"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={messages.length === 0 ? 'Describe your product idea...' : 'Type your response...'}
            className="resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
