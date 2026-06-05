import { useState, useCallback, useRef, useEffect } from 'react'
import { streamLLM } from '@/lib/llm'
import { getBRDPrompt, getFRDPrompt, getNFRPrompt } from '@/prompts/requirements'
import { getUserStoriesPrompt } from '@/prompts/userStories'
import { getArchitecturePrompt } from '@/prompts/architecture'
import { getFlowDiagramsPrompt } from '@/prompts/flowDiagrams'
import { getRiskAnalysisPrompt } from '@/prompts/riskAnalysis'
import type { DocumentType, DocumentTabState, GenerationState } from '@/types'

const INITIAL_TABS: DocumentTabState[] = [
  { type: 'brd', label: 'BRD', status: 'idle', data: null, error: null },
  { type: 'frd', label: 'FRD', status: 'idle', data: null, error: null },
  { type: 'nfr', label: 'NFR', status: 'idle', data: null, error: null },
  { type: 'stories', label: 'User Stories', status: 'idle', data: null, error: null },
  { type: 'architecture', label: 'Architecture', status: 'idle', data: null, error: null },
  { type: 'flows', label: 'Flows', status: 'idle', data: null, error: null },
  { type: 'risk', label: 'Risk Analysis', status: 'idle', data: null, error: null },
]

// Stream Claude API call — calls onChunk with each text delta, returns full text
async function callClaudeStreaming(
  prompt: string,
  maxTokens: number,
  onChunk: (fullText: string) => void
): Promise<string> {
  return streamLLM({
    messages: [
      { role: 'user', content: prompt + '\n\nIMPORTANT REMINDER: Your response must be ONLY a valid JSON object. Start with { and end with }. No other text.' },
    ],
    maxTokens,
    onChunk,
  })
}

// Streaming with auto-retry
async function callClaudeWithRetry(
  prompt: string,
  maxTokens: number,
  onChunk: (fullText: string) => void
): Promise<string> {
  try {
    return await callClaudeStreaming(prompt, maxTokens, onChunk)
  } catch (err) {
    console.warn('First attempt failed, retrying...', err)
    return await callClaudeStreaming(prompt, maxTokens, onChunk)
  }
}

// Robust JSON parsing — handles truncated JSON from token limits
// Fix common JSON issues from LLM output
function sanitizeJSON(text: string): string {
  let s = text
  // Strip control characters invalid in JSON (keep tab/newline/CR) - common in LLM output.
  s = Array.from(s).filter(c => { const n = c.charCodeAt(0); return n >= 32 || n === 9 || n === 10 || n === 13 }).join(String());
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1')
  // Fix unescaped newlines inside strings (common in acceptance criteria)
  // Walk through and fix newlines that are inside quoted strings
  let result = ''
  let inStr = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '"' && (i === 0 || s[i - 1] !== '\\')) {
      inStr = !inStr
      result += ch
    } else if (inStr && ch === '\n') {
      result += '\\n'
    } else if (inStr && ch === '\t') {
      result += '\\t'
    } else {
      result += ch
    }
  }
  return result
}

function parseJSON(text: string): unknown {
  // Try direct parse
  try { return JSON.parse(text) } catch { /* noop */ }

  // Try sanitized parse
  try { return JSON.parse(sanitizeJSON(text)) } catch { /* noop */ }

  // Try extracting from code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) {
    try { return JSON.parse(sanitizeJSON(fenceMatch[1])) } catch { /* noop */ }
  }

  // Try finding first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const extracted = text.slice(start, end + 1)
    try { return JSON.parse(extracted) } catch { /* noop */ }
    try { return JSON.parse(sanitizeJSON(extracted)) } catch { /* noop */ }
  }

  // Try array
  const arrStart = text.indexOf('[')
  const arrEnd = text.lastIndexOf(']')
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const extracted = text.slice(arrStart, arrEnd + 1)
    try { return JSON.parse(extracted) } catch { /* noop */ }
    try { return JSON.parse(sanitizeJSON(extracted)) } catch { /* noop */ }
  }

  // Last resort: try to repair truncated JSON by closing open strings/braces
  if (start !== -1) {
    let repaired = text.slice(start)
    // Close any open string
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length
    if (quoteCount % 2 !== 0) {
      repaired += '"'
    }
    // Count open braces/brackets and close them
    let openBraces = 0
    let openBrackets = 0
    let inString = false
    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i]
      if (ch === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
        inString = !inString
      }
      if (!inString) {
        if (ch === '{') openBraces++
        if (ch === '}') openBraces--
        if (ch === '[') openBrackets++
        if (ch === ']') openBrackets--
      }
    }
    for (let i = 0; i < openBrackets; i++) repaired += ']'
    for (let i = 0; i < openBraces; i++) repaired += '}'
    try { return JSON.parse(repaired) } catch { /* noop */ }
  }

  console.error('Failed to parse JSON. Raw text (first 500 chars):', text.slice(0, 500))
  throw new Error('Could not parse JSON from response')
}

function getCallStepForType(type: DocumentType): number {
  switch (type) {
    case 'brd': return 1
    case 'frd': return 2
    case 'nfr': return 3
    case 'stories': return 4
    case 'architecture': return 5
    case 'flows': return 6
    case 'risk': return 7
  }
}

function getDownstreamTypes(fromStep: number): DocumentType[] {
  const allSteps: { step: number; types: DocumentType[] }[] = [
    { step: 1, types: ['brd'] },
    { step: 2, types: ['frd'] },
    { step: 3, types: ['nfr'] },
    { step: 4, types: ['stories'] },
    { step: 5, types: ['architecture'] },
    { step: 6, types: ['flows'] },
    { step: 7, types: ['risk'] },
  ]
  return allSteps.filter(s => s.step >= fromStep).flatMap(s => s.types)
}

const GEN_STORAGE_KEY = 'ba-generation-state'
const OUTPUTS_STORAGE_KEY = 'ba-generation-outputs'
const CONTEXT_STORAGE_KEY = 'ba-generation-context'
// Identifies WHICH conversation a generation belongs to, so stale docs from a
// previous/interrupted topic can never leak into a new one (cross-pollination).
const SIG_STORAGE_KEY = 'ba-generation-sig'

function loadGeneration(): GenerationState {
  try {
    const stored = localStorage.getItem(GEN_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...parsed, isGenerating: false }
    }
  } catch { /* noop */ }
  return { isGenerating: false, currentStep: 0, totalSteps: 7, tabs: INITIAL_TABS }
}

function loadOutputs(): Record<string, string> {
  try {
    const stored = localStorage.getItem(OUTPUTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function loadContext(): string {
  try { return localStorage.getItem(CONTEXT_STORAGE_KEY) || '' } catch { return '' }
}

function loadSig(): string {
  try { return localStorage.getItem(SIG_STORAGE_KEY) || '' } catch { return '' }
}

export function useGenerate() {
  const [generation, setGeneration] = useState<GenerationState>(loadGeneration)
  const [activeTab, setActiveTab] = useState<DocumentType>('brd')
  const [streamingText, setStreamingText] = useState<string>('')

  const outputsRef = useRef<Record<string, string>>(loadOutputs())
  const chatContextRef = useRef<string>(loadContext())
  const sourceSigRef = useRef<string>(loadSig())

  useEffect(() => {
    if (!generation.isGenerating) {
      localStorage.setItem(GEN_STORAGE_KEY, JSON.stringify(generation))
      localStorage.setItem(OUTPUTS_STORAGE_KEY, JSON.stringify(outputsRef.current))
      localStorage.setItem(CONTEXT_STORAGE_KEY, chatContextRef.current)
      localStorage.setItem(SIG_STORAGE_KEY, sourceSigRef.current)
    }
  }, [generation])

  const updateTab = useCallback((type: DocumentType, update: Partial<DocumentTabState>) => {
    setGeneration(prev => ({
      ...prev,
      tabs: prev.tabs.map(t => t.type === type ? { ...t, ...update } : t),
    }))
  }, [])

  const updateTabs = useCallback((types: DocumentType[], update: Partial<DocumentTabState>) => {
    setGeneration(prev => ({
      ...prev,
      tabs: prev.tabs.map(t => types.includes(t.type) ? { ...t, ...update } : t),
    }))
  }, [])

  const executeStep = useCallback(async (step: number, chatContext: string): Promise<boolean> => {
    const outputs = outputsRef.current
    const onChunk = (fullText: string) => { setStreamingText(fullText) }

    const stepConfig: Record<number, { type: DocumentType; getPrompt: () => string; maxTokens: number }> = {
      // Token budgets sized to each doc — User Stories / Risk are the largest and
      // were truncating at 8192 (which broke the JSON). Larger caps prevent that.
      1: { type: 'brd', maxTokens: 10000, getPrompt: () => getBRDPrompt(chatContext) },
      2: { type: 'frd', maxTokens: 12000, getPrompt: () => getFRDPrompt(chatContext, outputs.brd || '') },
      3: { type: 'nfr', maxTokens: 10000, getPrompt: () => getNFRPrompt(chatContext, outputs.brd || '', outputs.frd || '') },
      4: { type: 'stories', maxTokens: 16000, getPrompt: () => getUserStoriesPrompt(chatContext, (outputs.brd || '') + '\n' + (outputs.frd || '') + '\n' + (outputs.nfr || '')) },
      5: { type: 'architecture', maxTokens: 12000, getPrompt: () => getArchitecturePrompt(chatContext, (outputs.brd || '') + '\n' + (outputs.frd || ''), outputs.stories || '') },
      6: { type: 'flows', maxTokens: 12000, getPrompt: () => getFlowDiagramsPrompt(chatContext, outputs.frd || '', outputs.stories || '', outputs.architecture || '') },
      7: { type: 'risk', maxTokens: 16000, getPrompt: () => getRiskAnalysisPrompt(chatContext, (outputs.brd || '') + '\n' + (outputs.frd || ''), outputs.stories || '', outputs.architecture || '', outputs.flows || '') },
    }

    const config = stepConfig[step]
    if (!config) return false

    try {
      updateTab(config.type, { status: 'generating', error: null })
      setStreamingText('')
      const raw = await callClaudeWithRetry(config.getPrompt(), config.maxTokens, onChunk)
      setStreamingText('')
      const parsed = parseJSON(raw)
      outputs[config.type] = raw
      updateTab(config.type, { status: 'complete', data: parsed })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      updateTab(config.type, { status: 'error', error: msg })
      setStreamingText('')
      return false
    }
  }, [updateTab])

  const generate = useCallback(async (chatContext: string, signature: string = '') => {
    chatContextRef.current = chatContext
    sourceSigRef.current = signature
    outputsRef.current = {}

    setGeneration(prev => ({ ...prev, isGenerating: true, currentStep: 1, totalSteps: 7, tabs: INITIAL_TABS }))
    setActiveTab('brd')

    const stepTabs: DocumentType[] = ['brd', 'frd', 'nfr', 'stories', 'architecture', 'flows', 'risk']

    for (let step = 1; step <= 7; step++) {
      setGeneration(prev => ({ ...prev, currentStep: step }))
      setActiveTab(stepTabs[step - 1])
      await executeStep(step, chatContext)
    }

    setGeneration(prev => ({ ...prev, isGenerating: false }))
    setActiveTab('brd')
  }, [executeStep])

  const regenerate = useCallback(async (type: DocumentType) => {
    const chatContext = chatContextRef.current
    if (!chatContext) return

    const startStep = getCallStepForType(type)
    const downstreamTypes = getDownstreamTypes(startStep)
    updateTabs(downstreamTypes, { status: 'idle', data: null, error: null })
    setGeneration(prev => ({ ...prev, isGenerating: true, currentStep: startStep }))

    for (let step = startStep; step <= 7; step++) {
      setGeneration(prev => ({ ...prev, currentStep: step }))
      const stepFirstTab: Record<number, DocumentType> = { 1: 'brd', 2: 'frd', 3: 'nfr', 4: 'stories', 5: 'architecture', 6: 'flows', 7: 'risk' }
      setActiveTab(stepFirstTab[step])
      await executeStep(step, chatContext)
    }

    setGeneration(prev => ({ ...prev, isGenerating: false }))
  }, [executeStep, updateTabs])

  // Edit a specific document based on user instruction via chat
  const editDocument = useCallback(async (docType: DocumentType, instruction: string): Promise<string> => {
    const currentTab = generation.tabs.find(t => t.type === docType)
    if (!currentTab || !currentTab.data) return 'No document to edit. Generate documents first.'

    const currentContent = JSON.stringify(currentTab.data, null, 2)

    const editPrompt = `You are a Senior Business Analyst making a SURGICAL revision to a document based on client feedback.

## Current Document (${currentTab.label})
${currentContent}

## Client's Revision Request
${instruction}

## SURGICAL EDIT RULES — READ CAREFULLY:

1. Return the COMPLETE JSON object with the EXACT same structure and keys as the current document.
2. ONLY modify the specific section/field the client mentioned. Copy everything else EXACTLY as-is, character for character.
3. Do NOT rewrite, rephrase, reorganize, or "improve" sections that were NOT mentioned in the request.
4. Do NOT regenerate diagrams unless the client explicitly asks to change them.
5. Do NOT add new sections unless explicitly requested.
6. Do NOT remove content unless explicitly requested.
7. If the client says "change X in the stakeholder map" — only touch the stakeholderMap field. Leave executiveSummary, businessObjectives, scope, successKPIs, constraintsAssumptions IDENTICAL.
8. If the client says "add a feature" — only modify the featureModules field (and maybe inputOutputSpecs). Leave everything else identical.
9. Think of it like a git diff — the smallest possible change to satisfy the request.

CRITICAL: Return ONLY valid JSON. No markdown code fences. No text before or after the JSON. Same structure, same keys, minimal changes.`

    updateTab(docType, { status: 'generating', error: null })
    setActiveTab(docType)
    setStreamingText('')

    try {
      const onChunk = (fullText: string) => { setStreamingText(fullText) }
      const raw = await callClaudeWithRetry(editPrompt, 8192, onChunk)
      setStreamingText('')
      const parsed = parseJSON(raw)
      outputsRef.current[docType] = raw
      updateTab(docType, { status: 'complete', data: parsed })
      return `Updated the ${currentTab.label}. Check the ${currentTab.label} tab to see the changes.`
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      updateTab(docType, { status: 'error', error: msg })
      setStreamingText('')
      return `Failed to update: ${msg}`
    }
  }, [generation.tabs, updateTab])

  const getOutputs = useCallback(() => {
    return { ...outputsRef.current }
  }, [])

  const loadSession = useCallback((savedGeneration: GenerationState, savedOutputs: Record<string, string>, savedContext: string, sourceSig: string = '') => {
    setGeneration({ ...savedGeneration, isGenerating: false })
    outputsRef.current = savedOutputs
    chatContextRef.current = savedContext
    sourceSigRef.current = sourceSig
    setStreamingText('')
    const firstComplete = savedGeneration.tabs.find(t => t.status === 'complete')
    if (firstComplete) setActiveTab(firstComplete.type)
  }, [])

  const reset = useCallback(() => {
    outputsRef.current = {}
    chatContextRef.current = ''
    sourceSigRef.current = ''
    setGeneration({ isGenerating: false, currentStep: 0, totalSteps: 7, tabs: INITIAL_TABS })
    setActiveTab('brd')
    setStreamingText('')
    localStorage.removeItem(GEN_STORAGE_KEY)
    localStorage.removeItem(OUTPUTS_STORAGE_KEY)
    localStorage.removeItem(CONTEXT_STORAGE_KEY)
    localStorage.removeItem(SIG_STORAGE_KEY)
  }, [])

  const getSourceSignature = useCallback(() => sourceSigRef.current, [])

  return { generation, activeTab, setActiveTab, streamingText, generate, regenerate, editDocument, getOutputs, loadSession, getSourceSignature, reset }
}
