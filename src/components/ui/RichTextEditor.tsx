import { useEffect, useCallback, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions/placeholder'
import { Mention } from '@tiptap/extension-mention'
import { Themestore } from '../../data/Themestore'
import { userService } from '../../services'
import { baseFontSize } from '../base/Text'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Quote,
  Code,
  Strikethrough,
  Link2,
  Minus,
} from 'lucide-react'
import type { Editor } from '@tiptap/core'
import type { UserRole } from '../../types'

/** Lighten (t 0..1 mix with white) or darken (t 0..1 mix with black) a hex color */
function mixHex(hex: string, t: number, darken = false): string {
  let s = hex.replace(/^#/, '')
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  const m = s.match(/.{2}/g)
  if (!m) return hex
  const [r, g, b] = m.map((x) => parseInt(x, 16))
  const a = Math.max(0, Math.min(1, t))
  if (darken) {
    const r2 = Math.round(r * (1 - a))
    const g2 = Math.round(g * (1 - a))
    const b2 = Math.round(b * (1 - a))
    return `#${[r2, g2, b2].map((x) => x.toString(16).padStart(2, '0')).join('')}`
  }
  const r2 = Math.round(r + (255 - r) * a)
  const g2 = Math.round(g + (255 - g) * a)
  const b2 = Math.round(b + (255 - b) * a)
  return `#${[r2, g2, b2].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

export type RichTextEditorMode = 'fill' | 'outline'
export type RichTextToolbarPreset = 'minimal' | 'full'

export interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  label?: string
  minHeight?: string
  className?: string
  mode?: RichTextEditorMode
  /** 'full' adds headings, blockquote, code block, strike, link, horizontal rule */
  toolbarPreset?: RichTextToolbarPreset
  /** No outer border; toolbar visually separated from content */
  borderless?: boolean
  /** Override background for the whole editor (toolbar + typing area). Use for note modals so the typing section matches the note color. */
  contentBackgroundColor?: string
  /** Font family for the content area (e.g. comics font for notes). */
  contentFontFamily?: string
  /** Font size in px for the content area (e.g. 16 for notes). */
  contentFontSize?: number
  /** Enable @-mentions with a dropdown of users. */
  enableMentions?: boolean
}

type MentionUser = { id: string; label: string; role?: UserRole; avatarUrl?: string; lastSeen?: string }

function formatLastSeenMention(value: string): string {
  if (value === 'online') return 'Active now'
  const d = new Date(value)
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 2) return 'Active now'
  if (diffMins < 60) return `Last seen ${diffMins}m ago`
  if (diffHours < 24) return `Last seen ${diffHours}h ago`
  if (diffDays < 7) return `Last seen ${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function createMentionSuggestion(
  dark: string | undefined,
  borderColor: string,
  _secondary: string | undefined,
  primary: string | undefined,
  themeFg: string,
  themeBg: string
) {
  let listEl: HTMLDivElement | null = null
  let selectedIndex = 0
  let currentProps: {
    items: MentionUser[]
    command: (p: { id: string; label: string }) => void
    clientRect?: (() => DOMRect | null) | null
  } | null = null

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
    return '?'
  }

  const leadRoles: UserRole[] = ['project_lead']
  const adminRoles: UserRole[] = ['company_admin', 'super_admin']
  const badgeSvg = (type: 'star' | 'shield') => {
    const s = 16
    const fill = primary ?? dark ?? '#333'
    if (type === 'star') {
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${fill}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9"/></svg>`
    }
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${fill}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  }

  const updateList = () => {
    if (!listEl || !currentProps) return
    const { items, command } = currentProps
    listEl.innerHTML = ''
    items.forEach((item, i) => {
      const row = document.createElement('div')
      row.setAttribute('data-index', String(i))
      row.className = 'cursor-pointer'
      row.style.display = 'flex'
      row.style.alignItems = 'center'
      row.style.gap = '12px'
      row.style.padding = '10px 12px'
      row.style.borderBottom = i < items.length - 1 ? `1px solid ${borderColor}` : 'none'
      row.style.backgroundColor = i === selectedIndex ? (dark ? `${dark}12` : 'rgba(0,0,0,0.08)') : 'transparent'
      row.addEventListener('click', () => command({ id: item.id, label: item.label }))

      const avatarOuter = document.createElement('div')
      avatarOuter.style.position = 'relative'
      avatarOuter.style.flexShrink = '0'
      const avatarWrap = document.createElement('div')
      avatarWrap.style.width = '40px'
      avatarWrap.style.height = '40px'
      avatarWrap.style.borderRadius = '50%'
      avatarWrap.style.overflow = 'hidden'
      avatarWrap.style.backgroundColor = themeBg
      avatarWrap.style.display = 'flex'
      avatarWrap.style.alignItems = 'center'
      avatarWrap.style.justifyContent = 'center'
      avatarWrap.style.fontSize = '13px'
      avatarWrap.style.fontWeight = '600'
      avatarWrap.style.color = primary ?? dark ?? '#333'
      if (item.avatarUrl) {
        const img = document.createElement('img')
        img.src = item.avatarUrl
        img.alt = ''
        img.style.width = '100%'
        img.style.height = '100%'
        img.style.objectFit = 'cover'
        img.onerror = () => {
          avatarWrap.textContent = getInitials(item.label)
        }
        avatarWrap.appendChild(img)
      } else {
        avatarWrap.textContent = getInitials(item.label)
      }
      avatarOuter.appendChild(avatarWrap)
      if (item.role && leadRoles.includes(item.role)) {
        const badge = document.createElement('span')
        badge.style.position = 'absolute'
        badge.style.bottom = '-2px'
        badge.style.right = '-2px'
        badge.style.width = '18px'
        badge.style.height = '18px'
        badge.style.borderRadius = '50%'
        badge.style.border = '2px solid ' + themeFg
        badge.style.backgroundColor = themeFg
        badge.style.display = 'flex'
        badge.style.alignItems = 'center'
        badge.style.justifyContent = 'center'
        badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)'
        badge.innerHTML = badgeSvg('star')
        avatarOuter.appendChild(badge)
      } else if (item.role && adminRoles.includes(item.role)) {
        const badge = document.createElement('span')
        badge.style.position = 'absolute'
        badge.style.bottom = '-2px'
        badge.style.right = '-2px'
        badge.style.width = '18px'
        badge.style.height = '18px'
        badge.style.borderRadius = '50%'
        badge.style.border = '2px solid ' + themeFg
        badge.style.backgroundColor = themeFg
        badge.style.display = 'flex'
        badge.style.alignItems = 'center'
        badge.style.justifyContent = 'center'
        badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)'
        badge.innerHTML = badgeSvg('shield')
        avatarOuter.appendChild(badge)
      }
      row.appendChild(avatarOuter)

      const details = document.createElement('div')
      details.style.minWidth = '0'
      details.style.flex = '1'
      const nameEl = document.createElement('div')
      nameEl.style.fontWeight = '500'
      nameEl.style.color = dark ?? '#333'
      nameEl.style.marginBottom = '2px'
      nameEl.textContent = item.label
      details.appendChild(nameEl)
      const lastSeenEl = document.createElement('div')
      lastSeenEl.style.fontSize = '12px'
      lastSeenEl.style.opacity = '0.75'
      lastSeenEl.style.color = dark ?? '#333'
      lastSeenEl.textContent = item.lastSeen ? formatLastSeenMention(item.lastSeen) : 'Last seen —'
      details.appendChild(lastSeenEl)
      row.appendChild(details)
      if (listEl) listEl.appendChild(row)
    })
  }

  return {
    char: '@' as const,
    items: async ({ query }: { query: string }) => {
      const users = await userService.list()
      const q = (query ?? '').toLowerCase()
      return users
        .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        .map((u) => ({ id: u.id, label: u.name, role: u.role, avatarUrl: u.avatarUrl, lastSeen: u.lastSeen }))
        .slice(0, 2)
    },
    render: () => ({
      onStart: (props: {
        items: MentionUser[]
        command: (p: { id: string; label: string }) => void
        clientRect?: (() => DOMRect | null) | null
      }) => {
        currentProps = props
        selectedIndex = 0
        if (!listEl) {
          listEl = document.createElement('div')
          listEl.className = 'rounded-base shadow-lg overflow-hidden max-h-[280px] overflow-y-auto scroll-slim-overlay'
          listEl.style.backgroundColor = themeFg
          listEl.style.fontSize = `${baseFontSize}px`
          listEl.style.color = dark ?? '#333'
          listEl.style.zIndex = '10000'
          document.body.appendChild(listEl)
        }
        const rect = props.clientRect?.()
        if (rect) {
          listEl.style.position = 'fixed'
          listEl.style.left = `${rect.left}px`
          listEl.style.top = `${rect.bottom + 4}px`
          listEl.style.minWidth = `${Math.max(rect.width, 220)}px`
        }
        updateList()
      },
      onUpdate: (props: { items: MentionUser[] }) => {
        currentProps = { ...currentProps!, ...props }
        selectedIndex = Math.min(Math.max(0, selectedIndex), props.items.length - 1)
        updateList()
      },
      onExit: () => {
        currentProps = null
        if (listEl?.parentNode) listEl.parentNode.removeChild(listEl)
        listEl = null
      },
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (!currentProps || !currentProps.items.length) return false
        if (event.key === 'ArrowDown') {
          selectedIndex = Math.min(selectedIndex + 1, currentProps.items.length - 1)
          updateList()
          return true
        }
        if (event.key === 'ArrowUp') {
          selectedIndex = Math.max(0, selectedIndex - 1)
          updateList()
          return true
        }
        if (event.key === 'Enter') {
          const item = currentProps.items[selectedIndex]
          currentProps.command({ id: item.id, label: item.label })
          return true
        }
        return false
      },
    }),
  }
}

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Write something…',
  label,
  minHeight = '120px',
  className = '',
  mode = 'outline',
  toolbarPreset = 'minimal',
  borderless = false,
  contentBackgroundColor,
  contentFontFamily,
  contentFontSize,
  enableMentions = false,
}: RichTextEditorProps) => {
  const { current, mode: themeMode } = Themestore()
  const dark = current?.system?.dark
  const secondary = current?.brand?.secondary ?? '#FF9600'
  const borderColor = current?.system?.border ?? 'rgba(0,0,0,0.15)'
  const themeBg = mode === 'fill' ? (current?.system?.background ?? undefined) : undefined
  const bg = contentBackgroundColor ?? themeBg
  const mentionListFg = current?.system?.foreground ?? '#fff'
  const mentionListBg = current?.system?.background ?? '#fff'
  const primary = current?.brand?.primary
  /** Non-active tools use theme text color; active state uses activeColor (secondary). */
  const toolbarInactiveColor = dark
  const fontSize = contentFontSize ?? baseFontSize
  const contentStyle = `font-size: ${fontSize}px; line-height: 1.5; color: ${dark ?? '#333'};${contentFontFamily ? ` font-family: ${contentFontFamily};` : ''}`
  const extensions = useMemo(
    () => [
      StarterKit,
      Placeholder.configure({ placeholder }),
      ...(enableMentions
        ? [
            Mention.configure({
              HTMLAttributes: { 'data-type': 'mention' },
              suggestion: createMentionSuggestion(dark ?? undefined, borderColor, secondary, primary, mentionListFg, mentionListBg),
            }),
          ]
        : []),
    ],
    [enableMentions, placeholder, dark, borderColor, secondary, primary, mentionListFg, mentionListBg]
  )
  const editor = useEditor({
    extensions,
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
        style: contentStyle,
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    const html = editor.getHTML()
    const normalized = html === '<p></p>' ? '' : html
    if (value !== normalized) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
    }
  }, [value, editor])

  useEffect(() => {
    if (!editor || !onChange) return
    const handleUpdate = () => {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    }
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, onChange])

  if (!editor) return null

  const isHex = contentBackgroundColor?.startsWith('#')
  const hexOnly = contentBackgroundColor && /^#[0-9A-Fa-f]{6}/.test(contentBackgroundColor) ? contentBackgroundColor.slice(0, 7) : null
  const toolbarBgFromContent = hexOnly ? (themeMode === 'dark' ? mixHex(hexOnly, 0.25, true) : mixHex(hexOnly, 0.12)) : null
  const toolbarBg = contentBackgroundColor
    ? (themeMode === 'dark' && dark ? `${dark}28` : toolbarBgFromContent ?? contentBackgroundColor)
    : undefined
  const toolbarBgResolved = toolbarBg ?? (borderless ? (bg ? `${dark}12` : 'transparent') : (bg ? `${dark}08` : 'transparent'))
  const scrollbarTrack = contentBackgroundColor && isHex ? mixHex(contentBackgroundColor, 0.28) : (contentBackgroundColor ? `${contentBackgroundColor}30` : undefined)
  const scrollbarThumb = contentBackgroundColor && isHex ? mixHex(contentBackgroundColor, 0.25, true) : (contentBackgroundColor ? `${contentBackgroundColor}99` : undefined)

  return (
    <div className={className}>
      {label && (
        <label
          className="block mb-1.5"
          style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark ? `${dark}99` : 'inherit' }}
        >
          {label}
        </label>
      )}
      <div
        className="rounded-base overflow-hidden flex flex-col flex-1 min-h-0"
        style={{
          ...(borderless ? {} : { border: `1px solid ${borderColor}` }),
          backgroundColor: contentBackgroundColor ? contentBackgroundColor : (bg ?? 'transparent'),
          minHeight,
        }}
      >
        <div
          className="flex items-center gap-0.5 border-b px-1 py-1 flex-wrap shrink-0"
          style={{
            borderColor,
            backgroundColor: toolbarBgResolved,
          }}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
            style={{ color: toolbarInactiveColor }}
            activeColor={secondary}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
            style={{ color: toolbarInactiveColor }}
            activeColor={secondary}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          {toolbarPreset === 'full' && (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive('strike')}
                title="Strikethrough"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <Strikethrough className="w-4 h-4" />
              </ToolbarButton>
              <span className="w-px h-5 mx-0.5 opacity-30" style={{ backgroundColor: toolbarInactiveColor }} />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <span className="text-xs font-medium">H1</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <span className="text-xs font-medium">H2</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <span className="text-xs font-medium">H3</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setParagraph().run()}
                active={editor.isActive('paragraph')}
                title="Paragraph"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <span className="text-xs">P</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
                title="Quote"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <Quote className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive('codeBlock')}
                title="Code block"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <Code className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal rule"
                style={{ color: toolbarInactiveColor }}
                activeColor={secondary}
              >
                <Minus className="w-4 h-4" />
              </ToolbarButton>
              <span className="w-px h-5 mx-0.5 opacity-30" style={{ backgroundColor: toolbarInactiveColor }} />
              <LinkToolbarButton editor={editor} dark={dark} toolbarIconColor={toolbarInactiveColor} activeColor={secondary} />
              <span className="w-px h-5 mx-0.5 opacity-30" style={{ backgroundColor: toolbarInactiveColor }} />
            </>
          )}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
            style={{ color: toolbarInactiveColor }}
            activeColor={secondary}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered list"
            style={{ color: toolbarInactiveColor }}
            activeColor={secondary}
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <span className="w-px h-5 mx-0.5 opacity-30" style={{ backgroundColor: toolbarInactiveColor }} />
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
            style={{ color: toolbarInactiveColor }}
            activeColor={secondary}
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
            style={{ color: toolbarInactiveColor }}
            activeColor={secondary}
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
        <div
          className={`min-h-0 flex-1 flex flex-col overflow-auto [&>div]:flex-1 [&>div]:min-h-0 [&>div]:flex [&>div]:flex-col ${contentBackgroundColor ? 'scroll-slim' : ''}`}
          style={
            contentBackgroundColor
              ? {
                  ['--scrollbar-track' as string]: scrollbarTrack,
                  ['--scrollbar-thumb' as string]: scrollbarThumb,
                }
              : undefined
          }
        >
          <EditorContent editor={editor} />
        </div>
      </div>
      <style>{`
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror {
          min-height: 80px;
        }
        .ProseMirror [data-type="mention"] {
          border-radius: 4px;
          padding: 0 4px;
          background: rgba(0,0,0,0.08);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  title,
  style,
  activeColor,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  style?: React.CSSProperties
  /** Theme secondary (or other) color for active indicator */
  activeColor?: string
}) {
  const color = active && activeColor ? activeColor : style?.color
  const bg = active && activeColor ? `${activeColor}22` : active && style?.color ? `${style.color}18` : active ? 'rgba(0,0,0,0.08)' : 'transparent'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-2 rounded-base hover:opacity-100 disabled:opacity-40 transition-opacity"
      style={{
        ...style,
        color,
        opacity: active ? 1 : 0.7,
        backgroundColor: bg,
      }}
    >
      {children}
    </button>
  )
}

function LinkToolbarButton({
  editor,
  dark,
  toolbarIconColor,
  activeColor,
}: {
  editor: Editor
  dark: string | undefined
  toolbarIconColor?: string
  activeColor?: string
}) {
  const handleClick = useCallback(() => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const href = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', href || 'https://')
    if (url != null && url.trim()) {
      const toUse = /^https?:\/\//i.test(url) ? url : `https://${url}`
      editor.chain().focus().setLink({ href: toUse }).run()
    }
  }, [editor])
  return (
    <ToolbarButton
      onClick={handleClick}
      active={editor.isActive('link')}
      title="Insert link"
      style={{ color: toolbarIconColor ?? dark }}
      activeColor={activeColor}
    >
      <Link2 className="w-4 h-4" />
    </ToolbarButton>
  )
}

export default RichTextEditor
