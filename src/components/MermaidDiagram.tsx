import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import DOMPurify from 'dompurify'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  // 'strict' (Mermaid's default) HTML-encodes text in labels and disables click
  // handlers — the diagram source is LLM-generated from user notes, so we never
  // want raw HTML/script to flow through. Rendered SVG is also sanitized below.
  securityLevel: 'strict',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: false,
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 60,
  },
  sequence: {
    useMaxWidth: false,
    boxMargin: 10,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: false,
  },
  er: {
    useMaxWidth: false,
    fontSize: 14,
  },
  themeVariables: {
    darkMode: true,
    primaryColor: '#6366f1',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#818cf8',
    lineColor: '#94a3b8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    noteBkgColor: '#1e293b',
    noteTextColor: '#e2e8f0',
    noteBorderColor: '#475569',
    fontSize: '14px',
  },
})

interface Props {
  chart: string
  className?: string
}

// LLMs often add parenthetical annotations inside node labels (e.g. "Web Push (FCM)")
// which break Mermaid. Shape delimiters like [( )] and ([ ]) have no space before "(",
// so stripping " (...)" removes only the annotations, never a valid shape.
function sanitizeMermaid(chart: string): string {
  return chart.replace(/ \([^)]*\)/g, '')
}

export default function MermaidDiagram({ chart, className }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    if (!chart || !chart.trim()) return

    let cancelled = false

    const renderOnce = async (src: string) => {
      const id = `mermaid-${crypto.randomUUID().replace(/-/g, '')}`
      const { svg: rendered } = await mermaid.render(id, src.trim())
      // Defense in depth: sanitize the rendered SVG before injecting it.
      return DOMPurify.sanitize(rendered, { USE_PROFILES: { svg: true, svgFilters: true } })
    }

    const render = async () => {
      try {
        let cleanSvg: string
        try {
          cleanSvg = await renderOnce(chart)
        } catch {
          // Retry with common LLM label mistakes stripped before giving up.
          cleanSvg = await renderOnce(sanitizeMermaid(chart))
        }
        if (!cancelled) {
          setSvg(cleanSvg)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
          setSvg('')
        }
        // Mermaid leaves error elements in the DOM on failure — clean them up
        const errorElement = document.getElementById('d' + 'mermaid-error')
        if (errorElement) {
          errorElement.remove()
        }
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [chart])

  if (error) {
    return (
      <div className={className}>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-2">
          <p className="text-sm text-destructive font-medium mb-1">
            Diagram could not render
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
          <code>{chart}</code>
        </pre>
      </div>
    )
  }

  if (!svg) {
    return null
  }

  const ctrlBtn =
    'flex items-center justify-center h-7 w-7 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors'

  return (
    <div
      className={`${className ?? ''} relative h-[520px] overflow-hidden border border-border/50 rounded-lg bg-background/50`}
    >
      <TransformWrapper
        minScale={0.2}
        maxScale={6}
        initialScale={1}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ mode: 'reset' }}
        wheel={{ step: 0.08 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button type="button" className={ctrlBtn} title="Zoom in" onClick={() => zoomIn()}>
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button type="button" className={ctrlBtn} title="Zoom out" onClick={() => zoomOut()}>
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button type="button" className={ctrlBtn} title="Reset / fit" onClick={() => resetTransform()}>
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="absolute bottom-2 left-2 z-10 text-[10px] text-muted-foreground/70 pointer-events-none">
              scroll to zoom · drag to pan · double-click to reset
            </span>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div
                className="p-6 [&_svg]:max-w-none [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}
