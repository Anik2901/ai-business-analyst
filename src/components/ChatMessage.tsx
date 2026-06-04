import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/types'
import { BrainCircuit, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  message: ChatMessageType
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  const displayContent = message.content.replace('[READY_TO_GENERATE]', '').trim()

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{displayContent}</span>
        ) : displayContent ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-code:bg-background/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-background/60 prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
          </div>
        ) : (
          <span className="inline-flex gap-1">
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  )
}
