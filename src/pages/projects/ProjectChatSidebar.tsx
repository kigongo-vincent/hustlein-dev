import { useMemo, useState } from 'react'
import Text from '../../components/base/Text'
import { Themestore } from '../../data/Themestore'
import { LayoutGrid } from 'lucide-react'
import type { Comment } from '../../types'
import { PEXELS_AVATAR_LIST } from './constants'
import type { LastSeenByAuthor } from './projectChatTypes'
import ProjectChatGroupMenu, { type ChatParticipant } from './ProjectChatGroupMenu'
import ProjectChatMessageList from './ProjectChatMessageList'
import ProjectChatComposer from './ProjectChatComposer'

export type { LastSeenByAuthor }

const DEMO_MESSAGES_WITH_ATTACHMENTS: Comment[] = [
  {
    id: 'demo-img',
    entityType: 'doc',
    entityId: '',
    authorId: 'u2',
    body: 'Here’s the latest mockup.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    attachmentUrl: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400',
    attachmentType: 'image',
  },
  {
    id: 'demo-doc',
    entityType: 'doc',
    entityId: '',
    authorId: 'u1',
    body: 'Project brief and scope doc.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    attachmentType: 'doc',
    attachmentSize: '1.2 MB',
  },
]

export type ProjectChatSidebarProps = {
  projectName: string
  participantCount: number
  comments: Comment[]
  userMap: Record<string, string>
  userAvatarMap?: Record<string, string | undefined>
  lastSeenByAuthor?: LastSeenByAuthor
  adminUserIds?: string[]
  leadUserIds?: string[]
  currentUserId: string | undefined
  newComment: string
  onNewCommentChange: (v: string) => void
  sending: boolean
  onSend: () => void
  onAttachmentSelect?: (file: File) => void
  /** Participants for "Manage participants" in group menu. */
  participants?: ChatParticipant[]
  /** Project/group description for group settings. */
  projectDescription?: string
  onSaveGroupSettings?: (payload: { name: string; description: string }) => void | Promise<void>
  onLeaveGroup?: () => void
}

export default function ProjectChatSidebar({
  projectName,
  participantCount,
  comments,
  userMap,
  userAvatarMap = {},
  lastSeenByAuthor = {},
  adminUserIds = [],
  leadUserIds = [],
  currentUserId,
  newComment,
  onNewCommentChange,
  sending,
  onSend,
  onAttachmentSelect,
  participants = [],
  projectDescription,
  onSaveGroupSettings,
  onLeaveGroup,
}: ProjectChatSidebarProps) {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const primaryColor = current?.brand?.primary ?? '#682308'
  const bg = current?.system?.background
  const fg = current?.system?.foreground
  const borderColor = current?.system?.border

  const [groupMenuOpen, setGroupMenuOpen] = useState(false)

  const getAvatarSrc = (authorId: string, index: number) =>
    userAvatarMap[authorId] ?? PEXELS_AVATAR_LIST[index % PEXELS_AVATAR_LIST.length]

  const displayComments = useMemo(() => {
    const merged = comments.length === 0 ? [] : [...comments, ...DEMO_MESSAGES_WITH_ATTACHMENTS]
    return merged.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [comments])

  return (
    <div
      className="w-[28vw] max-w-[28vw] min-h-0 shrink-0 flex flex-col pl-4 h-full overflow-hidden"
      style={{ backgroundColor: fg }}
    >
      <header className="shrink-0 py-3 flex items-center gap-2 px-1 border-b" style={{ borderColor }}>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate" style={{ color: dark }}>{projectName}</p>
          <Text variant="sm" className="opacity-70 truncate" style={{ color: dark }}>
            Project chat · {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </Text>
        </div>
        <button
          type="button"
          onClick={() => setGroupMenuOpen(true)}
          className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
          style={{ color: dark, backgroundColor: bg }}
          title="Group options"
          aria-label="Open group management"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
      </header>

      <ProjectChatGroupMenu
        open={groupMenuOpen}
        onClose={() => setGroupMenuOpen(false)}
        participants={participants}
        groupName={projectName}
        groupDescription={projectDescription}
        onSaveGroupSettings={onSaveGroupSettings}
        onLeaveGroup={onLeaveGroup}
      />

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scroll-slim px-1 py-2" style={{ overscrollBehavior: 'contain' }}>
        <ProjectChatMessageList
          comments={displayComments}
          userMap={userMap}
          getAvatarSrc={getAvatarSrc}
          currentUserId={currentUserId}
          lastSeenByAuthor={lastSeenByAuthor}
          adminUserIds={adminUserIds}
          leadUserIds={leadUserIds}
          dark={dark}
          primaryColor={primaryColor}
          bubbleBg={bg ?? 'rgba(0,0,0,0.06)'}
          foreground={fg ?? '#fff'}
        />
      </div>

      <ProjectChatComposer
        newComment={newComment}
        onNewCommentChange={onNewCommentChange}
        onSend={onSend}
        sending={sending}
        onAttachmentSelect={onAttachmentSelect}
        dark={dark}
        primaryColor={primaryColor}
        borderColor={borderColor}
        bg={bg}
      />
    </div>
  )
}
