import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// File types the upload button accepts.
export const ACCEPTED_UPLOAD = '.txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf'

// Soft cap so a huge document can't blow the model's context window.
const MAX_CHARS = 24000

// Extract plain text from an uploaded notes file (.txt / .md / .pdf).
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  let text: string

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const data = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const items = content.items as Array<{ str?: string }>
      pages.push(items.map((it) => it.str ?? '').join(' '))
    }
    text = pages.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  } else {
    // .txt, .md, or anything readable as text
    text = (await file.text()).trim()
  }

  if (!text) throw new Error('No readable text found in that file.')
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + '\n\n[...truncated — file was longer than the limit]'
  }
  return text
}
