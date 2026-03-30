/** Strip HTML to a single line of plain text (previews, search). */
export function htmlToPlainText(html?: string): string {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const text = doc.body?.textContent ?? ''
    return text.replace(/\s+/g, ' ').trim()
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

export function htmlToPlainPreview(html: string | undefined, maxLen: number): string {
  const t = htmlToPlainText(html)
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen).trim()}…`
}
