import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { MODEL, PROTOCOL } from './config'

// All requests go through the dev-server proxy at /api/llm. The proxy injects the
// real API key server-side (so it never reaches the browser) and forwards to
// whatever LLM_BASE_URL points at. This works with ANY provider:
//   - protocol 'anthropic' -> Anthropic Messages API   (Anthropic, LiteLLM, compatible gateways)
//   - protocol 'openai'    -> OpenAI Chat Completions   (OpenRouter, OpenAI, Groq, Together, Ollama, ...)
const PROXY_BASE = window.location.origin + '/api/llm'

const anthropicClient = new Anthropic({
  apiKey: 'proxy-key',
  baseURL: PROXY_BASE,
  dangerouslyAllowBrowser: true,
})

const openaiClient = new OpenAI({
  apiKey: 'proxy-key',
  baseURL: PROXY_BASE,
  dangerouslyAllowBrowser: true,
})

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

interface StreamOptions {
  system?: string
  messages: LLMMessage[]
  maxTokens: number
  onChunk: (fullText: string) => void
}

// Stream a completion from whichever provider is configured.
// onChunk receives the cumulative text so far; resolves with the full text.
export async function streamLLM({ system, messages, maxTokens, onChunk }: StreamOptions): Promise<string> {
  let full = ''

  if (PROTOCOL === 'openai') {
    const stream = await openaiClient.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
    })
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || ''
      if (delta) {
        full += delta
        onChunk(full)
      }
    }
    return full
  }

  // default: Anthropic Messages API
  const stream = anthropicClient.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages,
  })
  stream.on('text', (text) => {
    full += text
    onChunk(full)
  })
  await stream.finalMessage()
  return full
}
