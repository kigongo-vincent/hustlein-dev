import type { CSSProperties } from 'react'
import DOMPurify from 'dompurify'

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'ul',
      'ol',
      'li',
      'a',
      'h1',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'code',
      'pre',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  })
}

export type SafeHtmlProps = {
  html?: string | null
  className?: string
  /** When true, omit wrapper if empty after strip */
  as?: 'div' | 'article'
  style?: CSSProperties
}

/**
 * Renders TipTap / stored HTML with DOMPurify. Use {@link htmlToPlainPreview} for card excerpts.
 */
export default function SafeHtml({ html, className = '', as: Tag = 'div', style }: SafeHtmlProps) {
  const raw = html?.trim()
  if (!raw) return null
  const clean = sanitize(raw)
  if (!clean) return null
  return (
    <Tag
      className={`rich-html-content [&_*]:text-inherit [&_a]:underline [&_a]:opacity-90 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:opacity-80 ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
