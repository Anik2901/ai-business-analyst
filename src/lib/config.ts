// LLM configuration — fully provider-neutral, set via .env. Nothing hardcoded.
//
// VITE_MODEL        : model id your endpoint supports (see GET /v1/models)
// VITE_LLM_PROTOCOL : 'anthropic' (Anthropic Messages API) or 'openai' (OpenAI Chat Completions)
export const MODEL = (import.meta.env.VITE_MODEL as string) || ''

export const PROTOCOL: 'anthropic' | 'openai' =
  ((import.meta.env.VITE_LLM_PROTOCOL as string) || 'anthropic').toLowerCase() === 'openai'
    ? 'openai'
    : 'anthropic'
