import { useLayoutEffect, useRef, useEffect, type RefObject } from 'react'
import Avatar from '../../components/base/Avatar'
import Text, { baseFontSize, minFontSize } from '../../components/base/Text'
import EmptyState from '../../components/ui/EmptyState'
import { FileText, Shield, UserStar, CheckCheck } from 'lucide-react'
import type { Comment } from '../../types'
import { formatLastSeen, formatTimeShort } from './utils'
import type { LastSeenByAuthor } from './projectChatTypes'

export type ProjectChatMessageListProps = {
  comments: Comment[]
  userMap: Record<string, string>
  getAvatarSrc: (authorId: string, index: number) => string | undefined
  currentUserId: string | undefined
  lastSeenByAuthor: LastSeenByAuthor
  adminUserIds: string[]
  leadUserIds: string[]
  dark: string
  primaryColor: string
  bubbleBg: string
  foreground: string
  /** Theme border color for badge ring (dark mode friendly) */
  borderColor?: string
  scrollRootRef?: RefObject<HTMLDivElement | null>
  onPeerMessagesReadThrough?: (createdAtMs: number) => void
}

export default function ProjectChatMessageList({
  comments,
  userMap,
  getAvatarSrc,
  currentUserId,
  lastSeenByAuthor,
  adminUserIds,
  leadUserIds,
  dark,
  primaryColor,
  bubbleBg,
  foreground,
  borderColor,
  scrollRootRef,
  onPeerMessagesReadThrough,
}: ProjectChatMessageListProps) {
  const badgeBorder = borderColor ?? 'rgba(255,255,255,0.5)'
  const messagesEndRef = useRef<HTMLLIElement>(null)
  const onReadRef = useRef(onPeerMessagesReadThrough)
  onReadRef.current = onPeerMessagesReadThrough

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  useLayoutEffect(() => {
    const root = scrollRootRef?.current
    const enabled = Boolean(root && onPeerMessagesReadThrough)
    if (!enabled || !root) return

    let raf = 0
    let maxPending = 0
    const flush = () => {
      raf = 0
      if (maxPending > 0) {
        onReadRef.current?.(maxPending)
        maxPending = 0
      }
    }
    const markSeen = (createdAtMs: number) => {
      maxPending = Math.max(maxPending, createdAtMs)
      if (!raf) raf = requestAnimationFrame(flush)
    }

    const observers: IntersectionObserver[] = []
    for (const c of comments) {
      if (c.authorId === currentUserId) continue
      const t = new Date(c.createdAt).getTime()
      if (Number.isNaN(t)) continue
      const el = root.querySelector(`[data-chat-peer-message="${CSS.escape(c.id)}"]`)
      if (!(el instanceof HTMLElement)) continue
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio >= 0.2) markSeen(t)
          }
        },
        { root, rootMargin: '0px 0px -12px 0px', threshold: [0, 0.2, 0.35, 0.55, 0.75, 1] }
      )
      io.observe(el)
      observers.push(io)
    }

    return () => {
      observers.forEach((o) => o.disconnect())
      if (raf) cancelAnimationFrame(raf)
    }
  }, [comments, currentUserId, scrollRootRef, onPeerMessagesReadThrough])

  if (comments.length === 0) {
    return (
      <EmptyState variant="inbox" compact title="No messages yet" description="Start the conversation below." className="py-6" />
    )
  }

  return (
    <ul className="space-y-6 pb-4">
      {comments.map((c, index) => {
        const isOwn = c.authorId === currentUserId
        const authorName = userMap[c.authorId] ?? (c.authorId === '__demo__' ? 'Demo User' : c.authorId)
        const displayName = isOwn ? 'You' : authorName
        return (
          <li
            key={c.id}
            className="flex justify-start"
            {...(!isOwn ? { 'data-chat-peer-message': c.id } : {})}
          >
            <div className="flex gap-2 w-max max-w-[85%] items-start">
              <div className="relative shrink-0 mt-0.5 w-fit">
                <Avatar
                  name={authorName}
                  size="md"
                  src={getAvatarSrc(c.authorId, index)}
                />
                {leadUserIds.includes(c.authorId) && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-sm"
                    style={{ backgroundColor: foreground, color: primaryColor, borderColor: badgeBorder }}
                    aria-hidden
                  >
                    <UserStar className="w-4 h-4" />
                  </span>
                )}
                {!leadUserIds.includes(c.authorId) && adminUserIds.includes(c.authorId) && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-sm"
                    style={{ backgroundColor: foreground, color: primaryColor, borderColor: badgeBorder }}
                    aria-hidden
                  >
                    <Shield className="w-4 h-4" />
                  </span>
                )}
              </div>
              <div className="min-w-0 w-max max-w-full">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap" style={{ justifyContent: 'flex-start' }}>
                  <span className="font-medium opacity-90" style={{ color: dark }}>{displayName}</span>
                </div>
                {lastSeenByAuthor[c.authorId] != null && (
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap" style={{ justifyContent: 'flex-start' }}>
                    {lastSeenByAuthor[c.authorId] === 'online' && (
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden />
                    )}
                    <Text variant="sm" className="opacity-70" style={{ color: dark }}>
                      {lastSeenByAuthor[c.authorId] === 'online' ? formatLastSeen('online') : formatLastSeen(lastSeenByAuthor[c.authorId])}
                    </Text>
                  </div>
                )}
                <div
                  className="rounded-lg px-3 py-2 whitespace-pre-wrap break-words w-max max-w-full"
                  style={{ backgroundColor: bubbleBg, color: dark }}
                >
                  {c.body}
                  {c.attachmentUrl && c.attachmentType === 'image' && (
                    <a
                      href={c.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 rounded-md overflow-hidden max-w-[240px]"
                    >
                      <img src={c.attachmentUrl} alt="" className="w-full h-auto object-cover" />
                    </a>
                  )}
                  {c.attachmentUrl && c.attachmentType === 'doc' && (
                    <a
                      href={c.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-2 py-1.5 px-2 rounded-md opacity-90 hover:opacity-100"
                      style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span
                        className="truncate"
                        style={{ fontSize: Math.max(minFontSize, baseFontSize * 0.875), lineHeight: 1.7 }}
                      >
                        Document{c.attachmentSize ? ` · ${c.attachmentSize}` : ''}
                      </span>
                    </a>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1.5 opacity-80" style={{ color: dark }}>
                    <span style={{ fontSize: minFontSize }}>{formatTimeShort(c.createdAt)}</span>
                    {isOwn && <CheckCheck className="w-3.5 h-3.5 shrink-0" aria-label="Sent" />}
                  </div>
                </div>
              </div>
            </div>
          </li>
        )
      })}
      <li ref={messagesEndRef} className="h-0 overflow-hidden" aria-hidden />
    </ul>
  )
}
