import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Comment, Project, ProjectApplication, ProjectPosting, User } from '../../../types'
import ProjectChatSidebar from '../ProjectChatSidebar'
import { useProjectChat, type ChatUserRow } from './useProjectChat'

export type ProjectWorkspaceChatProps = {
  open: boolean
  routeId: string
  isMarketplacePostingDetail: boolean
  isContributor: boolean
  project: Project
  externalPosting: ProjectPosting | null
  externalApplications: ProjectApplication[]
  applicationFreelancers: Record<string, User>
  workspaceUsers: ChatUserRow[]
  currentUser: {
    id: string
    name: string
    email?: string
    avatarUrl?: string
    role?: User['role']
    lastSeen?: string
  } | null
  comments: Comment[]
  setComments: Dispatch<SetStateAction<Comment[]>>
  refreshWorkspace: () => void | Promise<void>
  wsRoomProjectId: string
  filesProjectId: string
  onUpdateProjectFromChat: (payload: { name: string; description: string }) => void | Promise<void>
  onCloseSidebar: () => void
  onPeerMessagesReadThrough?: (createdAtMs: number) => void
}

export default function ProjectWorkspaceChat({
  open,
  routeId,
  isMarketplacePostingDetail,
  isContributor,
  project,
  externalPosting,
  externalApplications,
  applicationFreelancers,
  workspaceUsers,
  currentUser,
  comments,
  setComments,
  refreshWorkspace,
  wsRoomProjectId,
  filesProjectId,
  onUpdateProjectFromChat,
  onCloseSidebar,
  onPeerMessagesReadThrough,
}: ProjectWorkspaceChatProps) {
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      void refreshWorkspace()
    }
    prevOpenRef.current = open
  }, [open, refreshWorkspace])

  const chat = useProjectChat({
    routeId,
    isMarketplacePostingDetail,
    project,
    externalPosting,
    externalApplications,
    applicationFreelancers,
    workspaceUsers,
    currentUser,
    comments,
    setComments,
    refreshWorkspace,
    wsRoomProjectId,
  })

  const hideGroupManagement = isMarketplacePostingDetail && isContributor

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '30vw', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 shrink-0 overflow-hidden flex flex-col h-full"
          style={{ maxWidth: '30vw', minWidth: '30vw' }}
        >
          <ProjectChatSidebar
            projectName={project.name}
            participantCount={chat.participantCount}
            comments={comments}
            userMap={chat.userMap}
            userAvatarMap={chat.userAvatarMap}
            lastSeenByAuthor={chat.lastSeenByAuthor}
            adminUserIds={chat.adminUserIds}
            leadUserIds={chat.leadUserIds}
            currentUserId={currentUser?.id}
            newComment={chat.newMessage}
            onNewCommentChange={chat.setNewMessage}
            sending={chat.sending}
            onSend={chat.sendMessage}
            participants={chat.participants}
            projectDescription={project.description ?? undefined}
            hideGroupSettings={hideGroupManagement}
            hideLeaveGroup={hideGroupManagement}
            hideMuteNotifications={hideGroupManagement}
            onSaveGroupSettings={
              hideGroupManagement || !filesProjectId
                ? undefined
                : async (payload) => {
                    await onUpdateProjectFromChat(payload)
                  }
            }
            onLeaveGroup={hideGroupManagement ? undefined : onCloseSidebar}
            onPeerMessagesReadThrough={onPeerMessagesReadThrough}
            composeEnabled={chat.canComposeMessages}
            composeDisabledHint={
              !chat.chatEntityId
                ? 'Workspace chat is not linked yet.'
                : chat.chatRequiresWebSocket && !chat.chatWebSocketConnected
                  ? 'Waiting for live chat connection…'
                  : 'Unavailable'
            }
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
