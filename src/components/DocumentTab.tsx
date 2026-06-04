import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MermaidDiagram from './MermaidDiagram'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import type { DocumentTabState } from '@/types'

interface Props {
  tab: DocumentTabState
  onRetry?: () => void
  streamingText?: string
}

// --- Priority badge color mapping for user stories ---

const PRIORITY_COLORS: Record<string, string> = {
  Must: 'bg-red-500/20 text-red-400 border-red-500/30',
  Should: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Could: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  "Won't": 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

function getPriorityBadgeClass(priority: string): string {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS["Won't"]
}

// --- Convert camelCase/PascalCase key to readable title ---

function keyToTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

// --- Convert a document data object into markdown string ---
// Handles nested objects, arrays, and string values.

function renderContent(data: unknown, tabType?: string): string {
  // User stories tab gets special rendering — skip markdown conversion
  if (tabType === 'stories') {
    return ''
  }

  if (typeof data === 'string') return data

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        const title = keyToTitle(key)

        if (typeof value === 'string') {
          return `## ${title}\n\n${value}`
        }

        if (Array.isArray(value)) {
          // Render arrays as bullet lists of stringified items
          const items = value
            .map((item) => {
              if (typeof item === 'string') return `- ${item}`
              return `- ${JSON.stringify(item, null, 2)}`
            })
            .join('\n')
          return `## ${title}\n\n${items}`
        }

        if (typeof value === 'object' && value !== null) {
          // Nested objects: render each sub-key as h3
          const subContent = Object.entries(value as Record<string, unknown>)
            .map(([subKey, subValue]) => {
              const subTitle = keyToTitle(subKey)
              if (typeof subValue === 'string') {
                return `### ${subTitle}\n\n${subValue}`
              }
              return `### ${subTitle}\n\n${JSON.stringify(subValue, null, 2)}`
            })
            .join('\n\n')
          return `## ${title}\n\n${subContent}`
        }

        return `## ${title}\n\n${String(value)}`
      })
      .join('\n\n---\n\n')
  }

  return String(data)
}

// --- Split content into markdown and mermaid blocks ---
// Detects mermaid diagram starts and separates them from markdown content.
// Handles both fenced (```mermaid) and unfenced mermaid blocks.

const MERMAID_KEYWORDS = [
  'graph',
  'flowchart',
  'sequenceDiagram',
  'erDiagram',
  'journey',
  'quadrantChart',
  'gantt',
  'pie',
  'classDiagram',
  'stateDiagram',
  'gitgraph',
  'mindmap',
  'timeline',
  'sankey-beta',
  'xychart-beta',
]

function isMermaidStart(line: string): boolean {
  const trimmed = line.trim()
  return MERMAID_KEYWORDS.some(
    (keyword) =>
      trimmed === keyword ||
      trimmed.startsWith(keyword + ' ') ||
      trimmed.startsWith(keyword + '\n')
  )
}

interface ContentBlock {
  type: 'markdown' | 'mermaid'
  content: string
}

function splitMermaidBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []

  // First, handle fenced mermaid code blocks: ```mermaid ... ```
  // Then handle unfenced mermaid diagrams detected by keyword starts
  const fencedPattern = /```mermaid\s*\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  const segments: Array<{ type: 'raw' | 'mermaid'; content: string }> = []

  while ((match = fencedPattern.exec(content)) !== null) {
    // Text before this fenced block
    if (match.index > lastIndex) {
      segments.push({ type: 'raw', content: content.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'mermaid', content: match[1].trim() })
    lastIndex = match.index + match[0].length
  }

  // Remaining text after last fenced block
  if (lastIndex < content.length) {
    segments.push({ type: 'raw', content: content.slice(lastIndex) })
  }

  // If no fenced blocks found, treat entire content as raw
  if (segments.length === 0) {
    segments.push({ type: 'raw', content })
  }

  // Now process raw segments for unfenced mermaid diagrams
  for (const segment of segments) {
    if (segment.type === 'mermaid') {
      blocks.push({ type: 'mermaid', content: segment.content })
      continue
    }

    // Process raw text for unfenced mermaid blocks
    const lines = segment.content.split('\n')
    let currentMarkdown = ''
    let inMermaid = false
    let mermaidBlock = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (!inMermaid && isMermaidStart(line)) {
        // Start of an unfenced mermaid block
        if (currentMarkdown.trim()) {
          blocks.push({ type: 'markdown', content: currentMarkdown.trim() })
          currentMarkdown = ''
        }
        inMermaid = true
        mermaidBlock = line + '\n'
      } else if (inMermaid) {
        // We're inside a mermaid block — continue until we hit a blank line
        // followed by non-mermaid content, or end of input
        if (line.trim() === '') {
          // Check if next non-empty line is still part of the diagram
          let nextNonEmpty = i + 1
          while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '') {
            nextNonEmpty++
          }

          if (nextNonEmpty >= lines.length) {
            // End of content — close mermaid block
            blocks.push({ type: 'mermaid', content: mermaidBlock.trim() })
            mermaidBlock = ''
            inMermaid = false
          } else {
            const nextLine = lines[nextNonEmpty].trim()
            // If the next content line looks like a markdown heading or paragraph,
            // end the mermaid block
            if (
              nextLine.startsWith('#') ||
              nextLine.startsWith('---') ||
              nextLine.startsWith('**') ||
              nextLine.startsWith('- ') ||
              nextLine.startsWith('| ') ||
              nextLine.startsWith('> ')
            ) {
              blocks.push({ type: 'mermaid', content: mermaidBlock.trim() })
              mermaidBlock = ''
              inMermaid = false
              currentMarkdown += line + '\n'
            } else {
              // Continue the mermaid block
              mermaidBlock += line + '\n'
            }
          }
        } else {
          mermaidBlock += line + '\n'
        }
      } else {
        currentMarkdown += line + '\n'
      }
    }

    // Flush remaining blocks
    if (inMermaid && mermaidBlock.trim()) {
      blocks.push({ type: 'mermaid', content: mermaidBlock.trim() })
    }
    if (!inMermaid && currentMarkdown.trim()) {
      blocks.push({ type: 'markdown', content: currentMarkdown.trim() })
    }
  }

  return blocks
}

// --- User Stories renderer ---
// Renders epics as groups with story cards showing priority badges,
// story points, and acceptance criteria.

interface UserStory {
  id: string
  role: string
  action: string
  benefit: string
  acceptanceCriteria: string[]
  priority: string
  storyPoints: number
}

interface Epic {
  name: string
  description: string
  stories: UserStory[]
}

function UserStoriesRenderer({ data }: { data: { epics: Epic[] } }) {
  const epics = data?.epics
  if (!epics || !Array.isArray(epics) || epics.length === 0) {
    return (
      <p className="text-muted-foreground">No user stories generated.</p>
    )
  }

  return (
    <div className="space-y-8">
      {epics.map((epic, epicIdx) => (
        <div key={epicIdx} className="space-y-4">
          {/* Epic header */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="text-xl font-bold text-foreground">{epic.name}</h2>
            {epic.description && (
              <p className="text-sm text-muted-foreground mt-1">{epic.description}</p>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {epic.stories?.length ?? 0} stories &middot;{' '}
              {epic.stories?.reduce((sum, s) => sum + (s.storyPoints || 0), 0) ?? 0} total
              points
            </div>
          </div>

          {/* Story cards */}
          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {epic.stories?.map((story, storyIdx) => (
              <Card
                key={storyIdx}
                className="p-4 bg-card border-border hover:border-primary/40 transition-colors"
              >
                {/* Story header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {story.id}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${getPriorityBadgeClass(story.priority)}`}
                    >
                      {story.priority}
                    </Badge>
                    <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                      {story.storyPoints} SP
                    </span>
                  </div>
                </div>

                {/* Story sentence */}
                <p className="text-sm leading-relaxed mb-3">
                  As a <span className="font-semibold text-primary">{story.role}</span>, I
                  want to{' '}
                  <span className="font-semibold">{story.action}</span>, so
                  that <span className="text-muted-foreground">{story.benefit}</span>.
                </p>

                {/* Acceptance criteria */}
                {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Acceptance Criteria
                    </p>
                    <ul className="space-y-1">
                      {story.acceptanceCriteria.map((criterion, cIdx) => (
                        <li
                          key={cIdx}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Main DocumentTab component ---

export default function DocumentTab({ tab, onRetry, streamingText }: Props) {
  if (tab.status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Waiting to generate...</p>
      </div>
    )
  }

  if (tab.status === 'generating') {
    if (streamingText && streamingText.length > 5) {
      return (
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating {tab.label}...</span>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-mono leading-relaxed break-words">
              {streamingText}
            </pre>
          </div>
        </ScrollArea>
      )
    }
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Starting {tab.label} generation...</span>
        </div>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
      </div>
    )
  }

  if (tab.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive font-semibold text-lg">Failed to generate</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {tab.error || 'An unexpected error occurred while generating this document.'}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  // --- Complete state ---

  // Regenerate button shown at top of all completed documents
  const regenerateHeader = onRetry ? (
    <div className="flex justify-end pb-3 mb-3 border-b border-border">
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Regenerate
      </Button>
    </div>
  ) : null

  // Special rendering for user stories tab
  if (tab.type === 'stories' && tab.data) {
    return (
      <ScrollArea className="h-full">
        <div className="p-6">
          {regenerateHeader}
          <UserStoriesRenderer data={tab.data} />
        </div>
      </ScrollArea>
    )
  }

  // Standard document rendering: convert data to markdown, split mermaid blocks, render
  const content = renderContent(tab.data, tab.type)

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No content available.</p>
      </div>
    )
  }

  const blocks = splitMermaidBlocks(content)

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        {regenerateHeader}
        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-td:text-muted-foreground prose-th:text-foreground prose-th:font-semibold prose-table:border-border prose-code:text-primary prose-a:text-primary prose-li:text-muted-foreground prose-hr:border-border prose-blockquote:border-border prose-blockquote:text-muted-foreground [&_table]:border [&_table]:border-border [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2">
          {blocks.map((block, i) =>
            block.type === 'mermaid' ? (
              <MermaidDiagram key={i} chart={block.content} className="my-6" />
            ) : (
              <ReactMarkdown
                key={i}
                remarkPlugins={[remarkGfm]}
                components={{
                  table: (props) => (
                    <div className="overflow-x-auto my-4">
                      <table {...props} />
                    </div>
                  ),
                }}
              >
                {block.content}
              </ReactMarkdown>
            )
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
