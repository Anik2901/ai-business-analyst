import { useState, useCallback, useEffect } from 'react'
import { streamLLM } from '@/lib/llm'
import { BA_SYSTEM_PROMPT } from '@/prompts/system'
import type { ChatMessage } from '@/types'

const STORAGE_KEY = 'ba-chat-messages'
const READY_KEY = 'ba-chat-ready'

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function loadReady(): boolean {
  try {
    return localStorage.getItem(READY_KEY) === 'true'
  } catch {
    return false
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [readyToGenerate, setReadyToGenerate] = useState(loadReady)

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    localStorage.setItem(READY_KEY, String(readyToGenerate))
  }, [readyToGenerate])

  const sendMessage = useCallback(async (content: string, attachment?: { name: string }) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
      ...(attachment ? { attachment } : {}),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    const assistantId = crypto.randomUUID()

    try {
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])

      let fullContent = ''

      await streamLLM({
        system: BA_SYSTEM_PROMPT,
        messages: apiMessages,
        maxTokens: 1024,
        onChunk: (text) => {
          fullContent = text
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: fullContent }
                : m
            )
          )
        },
      })

      if (fullContent.includes('[READY_TO_GENERATE]')) {
        setReadyToGenerate(true)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errMsg = error instanceof Error ? error.message : String(error)
      setMessages(prev => {
        const withoutEmpty = prev.filter(m => !(m.id === assistantId && m.content === ''))
        return [
          ...withoutEmpty,
          {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `Error: ${errMsg}. Please try again.`,
            timestamp: Date.now(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const getChatContext = useCallback(() => {
    return messages
      .map(m => `**${m.role === 'user' ? 'User' : 'Business Analyst'}:** ${m.content}`)
      .join('\n\n')
  }, [messages])

  const loadSession = useCallback((savedMessages: ChatMessage[]) => {
    setMessages(savedMessages)
    const hasReady = savedMessages.some(m => m.content.includes('[READY_TO_GENERATE]'))
    setReadyToGenerate(hasReady)
    setIsLoading(false)
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setIsLoading(false)
    setReadyToGenerate(false)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(READY_KEY)
  }, [])

  return {
    messages,
    isLoading,
    readyToGenerate,
    sendMessage,
    getChatContext,
    loadSession,
    reset,
  }
}
