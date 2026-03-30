import { useRef, useState } from 'react'
import { Paperclip, Send, X, FileText } from 'lucide-react'
import Text, { baseFontSize } from '../../components/base/Text'

export type ProjectChatComposerProps = {
  newComment: string
  onNewCommentChange: (v: string) => void
  onSend: () => void
  sending: boolean
  /** When false, user cannot type or send (e.g. live WebSocket down). */
  composeEnabled?: boolean
  composeDisabledHint?: string
  onAttachmentSelect?: (file: File) => void
  dark: string
  primaryColor: string
  borderColor: string
  bg: string
}

export default function ProjectChatComposer({
  newComment,
  onNewCommentChange,
  onSend,
  sending,
  composeEnabled = true,
  composeDisabledHint = 'Waiting for live chat connection…',
  onAttachmentSelect,
  dark,
  primaryColor,
  borderColor,
  bg,
}: ProjectChatComposerProps) {
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null)

  const handleSend = () => {
    if (!composeEnabled || sending || (!newComment.trim() && !pendingAttachment)) return
    onSend()
    setPendingAttachment(null)
  }

  return (
    <div className="shrink-0 p-2 border-t" style={{ borderColor }}>
      <input
        ref={attachmentInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            setPendingAttachment(file)
            onAttachmentSelect?.(file)
          }
          e.target.value = ''
        }}
        aria-hidden
      />
      {pendingAttachment && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-base" style={{ backgroundColor: bg }}>
          <FileText className="w-4 h-4 shrink-0 opacity-80" style={{ color: dark }} />
          <Text variant="sm" className="truncate flex-1 min-w-0" style={{ color: dark }}>{pendingAttachment.name}</Text>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="shrink-0 p-1 rounded-base opacity-70 hover:opacity-100"
            style={{ color: dark }}
            aria-label="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div
        className="flex items-center gap-1 rounded-lg border bg-transparent min-h-[44px] focus-within:outline-none"
        style={{ borderColor }}
      >
        <button
          type="button"
          onClick={() => attachmentInputRef.current?.click()}
          disabled={!composeEnabled}
          className="shrink-0 p-2.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: dark }}
          title="Add attachment"
          aria-label="Add attachment"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          placeholder={composeEnabled ? 'Message' : composeDisabledHint}
          readOnly={!composeEnabled}
          disabled={!composeEnabled}
          aria-disabled={!composeEnabled}
          className="flex-1 min-w-0 py-2.5 pr-2 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:opacity-60 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ fontSize: baseFontSize, color: dark }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.shiftKey) return
            e.preventDefault()
            handleSend()
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!composeEnabled || sending || (!newComment.trim() && !pendingAttachment)}
          className="shrink-0 p-2.5 rounded-lg transition-opacity focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: primaryColor }}
          title="Send"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
