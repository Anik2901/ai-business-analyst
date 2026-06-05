export const MODEL = (import.meta.env.VITE_MODEL as string) || ''

export const PROTOCOL: 'anthropic' | 'openai' =
  ((import.meta.env.VITE_LLM_PROTOCOL as string) || 'anthropic').toLowerCase() === 'openai'
    ? 'openai'
    : 'anthropic'

export const MAX_TOKENS = Math.max(1, Number(import.meta.env.VITE_MAX_TOKENS) || 16000)
