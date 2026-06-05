import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
      const ac = (story.acceptanceCriteria || []).map(c => `- ${c}`).join('\n')
      return `### ${story.id}: As a ${story.role}, I want to ${story.action}, so that ${story.benefit}\n\n**Priority:** ${story.priority} | **Story Points:** ${story.storyPoints}\n\n**Acceptance Criteria:**\n${ac}`
    }).join('\n\n')
    return `${header}\n${stories}`
  }).join('\n\n---\n\n')
}

// --- Real-text PDF rendering with jsPDF (selectable text, no html2canvas) ---

function stripInline(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`([^`]+)`/g, '$1')
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => stripInline(c.trim()))
}

function exportTabsToPDF(tabsToExport: DocumentTabState[], filename: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15
  const maxW = pageW - margin * 2
  let y = margin

  const need = (h: number) => { if (y + h > pageH - margin) { doc.addPage(); y = margin } }

  const write = (text: string, o: { size: number; bold?: boolean; color?: number; indent?: number; gapBefore?: number; gapAfter?: number; mono?: boolean }) => {
    if (o.gapBefore) y += o.gapBefore
    const indent = o.indent || 0
    doc.setFont(o.mono ? 'courier' : 'helvetica', o.bold ? 'bold' : 'normal')
    doc.setFontSize(o.size)
    doc.setTextColor(o.color ?? 40)
    const lineH = o.size * 0.42 + 0.6
    for (const ln of doc.splitTextToSize(text, maxW - indent)) {
      need(lineH)
      doc.text(ln, margin + indent, y)
      y += lineH
    }
    if (o.gapAfter) y += o.gapAfter
  }

  const renderMarkdown = (md: string) => {
    const lines = md.split('\n')
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      // table
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[-:\s|]+\|\s*$/.test(lines[i + 1])) {
        const head = splitRow(line)
        i += 2
        const body: string[][] = []
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { body.push(splitRow(lines[i])); i++ }
        need(12)
        autoTable(doc, {
          startY: y, head: [head], body,
          margin: { left: margin, right: margin },
          styles: { fontSize: 8.5, cellPadding: 1.8, textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
          headStyles: { fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: 'bold' },
          theme: 'grid',
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 4
        continue
      }
      // code / mermaid block
      if (/^```/.test(line)) {
        i++
        const code: string[] = []
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++ }
        i++
        write('Diagram (source):', { size: 8, color: 120, gapBefore: 1 })
        write(code.join('\n'), { size: 7.5, color: 110, mono: true, indent: 2, gapAfter: 2 })
        continue
      }
      if (!line.trim()) { y += 1.5; i++; continue }
      if (/^# /.test(line)) { write(stripInline(line.slice(2)), { size: 15, bold: true, color: 20, gapBefore: 2, gapAfter: 1.5 }); i++; continue }
      if (/^## /.test(line)) { write(stripInline(line.slice(3)), { size: 12.5, bold: true, color: 30, gapBefore: 2, gapAfter: 1 }); i++; continue }
      if (/^### /.test(line)) { write(stripInline(line.slice(4)), { size: 11, bold: true, color: 45, gapBefore: 1.5, gapAfter: 0.5 }); i++; continue }
      if (/^---+\s*$/.test(line.trim())) { need(4); doc.setDrawColor(220); doc.line(margin, y, pageW - margin, y); y += 4; i++; continue }
      if (/^\s*[-*] /.test(line)) { write('•  ' + stripInline(line.replace(/^\s*[-*] /, '')), { size: 9.5, color: 55, indent: 3, gapAfter: 0.4 }); i++; continue }
      if (/^\s*\d+\.\s/.test(line)) { write(stripInline(line.trim()), { size: 9.5, color: 55, indent: 3, gapAfter: 0.4 }); i++; continue }
      write(stripInline(line), { size: 9.5, color: 55, gapAfter: 1.2 })
      i++
    }
  }

  if (tabsToExport.length > 1) {
    write('AI Business Analysis Report', { size: 22, bold: true, color: 20, gapBefore: 14, gapAfter: 3 })
    write('Generated by AI Business Analyst', { size: 11, color: 120, gapAfter: 8 })
    write('Contents', { size: 14, bold: true, color: 30, gapAfter: 2 })
    tabsToExport.forEach((t, i) => write(`${i + 1}.  ${t.label}`, { size: 11, color: 70, gapAfter: 0.5 }))
    doc.addPage(); y = margin
  }

  tabsToExport.forEach((tab, ti) => {
    if (ti > 0) { doc.addPage(); y = margin }
    write(tab.label, { size: 20, bold: true, color: 17, gapAfter: 1 })
    need(4); doc.setDrawColor(210); doc.setLineWidth(0.4); doc.line(margin, y, pageW - margin, y); doc.setLineWidth(0.2); y += 5
    renderMarkdown(renderDocumentContent(tab.data, tab.type))
  })

  doc.save(filename)
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
      exportTabsToPDF([currentTab], `${currentTab.label.toLowerCase().replace(/\s+/g, '-')}.pdf`)
    } catch (err) { console.error('PDF export failed:', err) }
    finally { setIsExporting(false) }
  }

  const handleExportAllPDF = async () => {
    setIsExporting(true)
    try {
      const completeTabs = tabs.filter(t => t.status === 'complete' && t.data)
      exportTabsToPDF(completeTabs, 'business-analysis-full.pdf')
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
