import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, RotateCcw, Loader2, FileDown } from 'lucide-react'
import type { DocumentTabState, DocumentType } from '@/types'

interface Props {
  tabs: DocumentTabState[]
  activeTab: DocumentType
  onReset: () => void
}

function keyToTitle(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}

function renderDocumentContent(data: unknown, tabType: string): string {
  if (!data) return ''
  if (tabType === 'stories') return renderUserStories(data)
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        const title = keyToTitle(key)
        if (typeof value === 'string') return `## ${title}\n\n${value}`
        if (Array.isArray(value)) return `## ${title}\n\n${value.map(item => typeof item === 'string' ? `- ${item}` : `- ${JSON.stringify(item, null, 2)}`).join('\n')}`
        if (typeof value === 'object' && value !== null) {
          const sub = Object.entries(value as Record<string, unknown>).map(([sk, sv]) => `### ${keyToTitle(sk)}\n\n${typeof sv === 'string' ? sv : JSON.stringify(sv, null, 2)}`).join('\n\n')
          return `## ${title}\n\n${sub}`
        }
        return `## ${title}\n\n${String(value)}`
      }).join('\n\n---\n\n')
  }
  return String(data)
}

function renderUserStories(data: unknown): string {
  const obj = data as { epics?: Array<{ name: string; description: string; stories?: Array<{ id: string; role: string; action: string; benefit: string; acceptanceCriteria: string[]; priority: string; storyPoints: number }> }> }
  if (!obj?.epics || !Array.isArray(obj.epics)) return ''
  return obj.epics.map(epic => {
    const header = `## ${epic.name}\n\n${epic.description}\n`
    const stories = (epic.stories || []).map(story => {
      const ac = (story.acceptanceCriteria || []).map(c => `  - ${c}`).join('\n')
      return `### ${story.id}: As a ${story.role}, I want to ${story.action}, so that ${story.benefit}\n\n**Priority:** ${story.priority} | **Story Points:** ${story.storyPoints}\n\n**Acceptance Criteria:**\n${ac}`
    }).join('\n\n')
    return `${header}\n${stories}`
  }).join('\n\n---\n\n')
}

function markdownToSimpleHTML(md: string): string {
  if (!md) return ''
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/```(?:mermaid|json|[\w]*)?\s*\n([\s\S]*?)```/g, '<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:11px;margin:12px 0;"><code>$1</code></pre>')
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;margin:16px 0 8px;color:#222;">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;margin:20px 0 10px;color:#222;">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;margin:24px 0 12px;color:#111;">$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;">')
  html = html.replace(/(\|.+\|)\n(\|[-:\s|]+\|)\n((?:\|.+\|\n?)+)/g, (_match, headerRow: string, _sep: string, bodyRows: string) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => c.trim())
    const rows = bodyRows.trim().split('\n').map((row: string) => row.split('|').filter((c: string) => c.trim()).map((c: string) => c.trim()))
    const th = headers.map((h: string) => `<th style="border:1px solid #ddd;padding:8px;background:#f8f8f8;text-align:left;font-size:12px;">${h}</th>`).join('')
    const body = rows.map((row: string[]) => '<tr>' + row.map((cell: string) => `<td style="border:1px solid #ddd;padding:8px;font-size:12px;">${cell}</td>`).join('') + '</tr>').join('')
    return `<table style="border-collapse:collapse;width:100%;margin:12px 0;"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`
  })
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;font-size:12px;">$1</li>')
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul style="padding-left:24px;margin:8px 0;">${match}</ul>`)
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;font-size:12px;">$1</li>')
  html = html.replace(/^(?!<[hupltof]|<\/|<hr|<pre|<code|<strong|<em|<br)(.+)$/gm, '<p style="margin:8px 0;font-size:12px;">$1</p>')
  html = html.replace(/\n\n/g, '<br>')
  return html
}

async function exportTabsToPDF(tabsToExport: DocumentTabState[], filename: string) {
  const html2pdf = (await import('html2pdf.js')).default

  const container = document.createElement('div')
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;background:#fff;color:#1a1a1a;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.6;padding:20px;'
  document.body.appendChild(container)

  if (tabsToExport.length > 1) {
    container.innerHTML = `
      <div style="page-break-after:always;padding:40px 20px;">
        <h1 style="font-size:28px;margin-bottom:8px;color:#111;">AI Business Analysis Report</h1>
        <p style="color:#666;margin-bottom:32px;">Generated by AI Business Analyst</p>
        <h2 style="font-size:18px;margin-bottom:16px;color:#333;">Table of Contents</h2>
        <ol style="list-style:decimal;padding-left:24px;color:#444;">
          ${tabsToExport.map(t => `<li style="margin-bottom:8px;font-size:14px;">${t.label}</li>`).join('')}
        </ol>
      </div>`
  }

  for (const tab of tabsToExport) {
    const section = document.createElement('div')
    if (tabsToExport.length > 1) section.style.pageBreakBefore = 'always'
    section.style.padding = '20px'

    const header = document.createElement('h1')
    header.textContent = tab.label
    header.style.cssText = 'font-size:24px;margin-bottom:16px;color:#111;border-bottom:2px solid #e5e5e5;padding-bottom:8px;'
    section.appendChild(header)

    const content = renderDocumentContent(tab.data, tab.type)
    const contentDiv = document.createElement('div')
    contentDiv.style.color = '#333'
    contentDiv.innerHTML = markdownToSimpleHTML(content)
    section.appendChild(contentDiv)
    container.appendChild(section)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (html2pdf() as any)
    .set({
      margin: [10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    })
    .from(container)
    .save()

  document.body.removeChild(container)
}

export default function ExportBar({ tabs, activeTab, onReset }: Props) {
  const [isExporting, setIsExporting] = useState(false)
  const hasContent = tabs.some(t => t.status === 'complete')
  const currentTab = tabs.find(t => t.type === activeTab)
  const currentTabReady = currentTab?.status === 'complete'

  const handleExportCurrentPDF = async () => {
    if (!currentTab || currentTab.status !== 'complete') return
    setIsExporting(true)
    try {
      await exportTabsToPDF([currentTab], `${currentTab.label.toLowerCase().replace(/\s+/g, '-')}.pdf`)
    } catch (err) { console.error('PDF export failed:', err) }
    finally { setIsExporting(false) }
  }

  const handleExportAllPDF = async () => {
    setIsExporting(true)
    try {
      const completeTabs = tabs.filter(t => t.status === 'complete' && t.data)
      await exportTabsToPDF(completeTabs, 'business-analysis-full.pdf')
    } catch (err) { console.error('PDF export failed:', err) }
    finally { setIsExporting(false) }
  }

  const handleExportCurrentMD = () => {
    if (!currentTab || !currentTab.data) return
    const content = `# ${currentTab.label}\n\n${renderDocumentContent(currentTab.data, currentTab.type)}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentTab.label.toLowerCase().replace(/\s+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAllMD = () => {
    const completeTabs = tabs.filter(t => t.status === 'complete' && t.data)
    const toc = '# AI Business Analysis Report\n\n## Table of Contents\n\n' +
      completeTabs.map((t, i) => `${i + 1}. ${t.label}`).join('\n') + '\n\n---\n\n'
    const sections = completeTabs.map(t => `# ${t.label}\n\n${renderDocumentContent(t.data, t.type)}`).join('\n\n---\n\n')
    const blob = new Blob([toc + sections], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'business-analysis-full.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <footer className="h-14 border-t border-border flex items-center justify-between px-6 bg-background shrink-0">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportCurrentPDF} disabled={!currentTabReady || isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Export {currentTab?.label || 'Tab'} PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportAllPDF} disabled={!hasContent || isExporting}>
          <FileDown className="h-4 w-4 mr-2" />
          Export All PDF
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportCurrentMD} disabled={!currentTabReady}>
          <FileText className="h-4 w-4 mr-2" /> Export MD
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportAllMD} disabled={!hasContent}>
          <FileText className="h-4 w-4 mr-2" /> Export All MD
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw className="h-4 w-4 mr-2" /> Reset
      </Button>
    </footer>
  )
}
