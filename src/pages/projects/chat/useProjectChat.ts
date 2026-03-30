import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { Comment, Project, ProjectApplication, ProjectPosting, User, UserRole } from '../../../types'
import { userService, commentService } from '../../../services'
import { notifyError } from '../../../data/NotificationStore'
import { toastPartsFromApiError } from '../../../utils/toastApiError'
import { getGlobalChatWebSocketUrl } from './projectChatWsUrl'

export type ChatUserRow = {
  id: string
  name: string
  email?: string
  avatarUrl?: string
  role?: UserRole
  lastSeen?: string
}

function userToRow(u: User): ChatUserRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role,
    lastSeen: u.lastSeen,
  }
}

export type UseProjectChatParams = {
  routeId: string
  isMarketplacePostingDetail: boolean
  project: Project | null
  externalPosting: ProjectPosting | null
  externalApplications: ProjectApplication[]
  applicationFreelancers: Record<string, User>
  workspaceUsers: ChatUserRow[]
  currentUser: { id: string; name: string; email?: string; avatarUrl?: string; role?: UserRole; lastSeen?: string } | null
  comments: Comment[]
  setComments: Dispatch<SetStateAction<Comment[]>>
  refreshWorkspace: () => void | Promise<void>
  /** Linked internal project id for files / WS room (canonical comment entity storage). */
  wsRoomProjectId: string
}

export function useProjectChat({
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
}: UseProjectChatParams) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [extraProfiles, setExtraProfiles] = useState<Record<string, ChatUserRow>>({})
  const [chatWebSocketConnected, setChatWebSocketConnected] = useState(false)

  const hired = useMemo(
    () => externalApplications.some((a) => a.status === 'hired'),
    [externalApplications]
  )

  const chatEntityId = useMemo(() => {
    if (!routeId) return ''
    if (isMarketplacePostingDetail) return hired ? routeId : ''
    return project?.id ?? ''
  }, [routeId, isMarketplacePostingDetail, hired, project?.id])

  const participantIds = useMemo(() => {
    if (!project) return [] as string[]
    const ids = new Set<string>()
    ids.add(project.projectLeadId)
    if (externalPosting?.createdById) ids.add(externalPosting.createdById)
    externalApplications.filter((a) => a.status === 'hired').forEach((a) => ids.add(a.freelancerId))
    comments.forEach((c) => ids.add(c.authorId))
    if (currentUser?.id) ids.add(currentUser.id)
    return [...ids].filter(Boolean)
  }, [project, externalPosting?.createdById, externalApplications, comments, currentUser?.id])

  const baseProfileMap = useMemo(() => {
    const m = new Map<string, ChatUserRow>()
    workspaceUsers.forEach((u) => m.set(u.id, u))
    Object.values(applicationFreelancers).forEach((u) => {
      if (u?.id) m.set(u.id, userToRow(u))
    })
    if (currentUser?.id) {
      m.set(currentUser.id, {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl,
        role: currentUser.role,
        lastSeen: currentUser.lastSeen,
      })
    }
    return m
  }, [workspaceUsers, applicationFreelancers, currentUser])

  const mergedProfiles = useMemo(() => {
    const m = new Map(baseProfileMap)
    Object.entries(extraProfiles).forEach(([id, row]) => {
      m.set(id, row)
    })
    return m
  }, [baseProfileMap, extraProfiles])

  const chatUserList = useMemo(() => {
    const byId = new Map<string, ChatUserRow>()
    participantIds.forEach((id) => {
      const row = mergedProfiles.get(id)
      if (row) byId.set(id, row)
      else byId.set(id, { id, name: id })
    })
    return Array.from(byId.values())
  }, [participantIds, mergedProfiles])

  const userMap = useMemo(() => {
    const o: Record<string, string> = {}
    chatUserList.forEach((u) => (o[u.id] = u.name))
    return o
  }, [chatUserList])

  const userAvatarMap = useMemo(() => {
    const o: Record<string, string | undefined> = {}
    chatUserList.forEach((u) => (o[u.id] = u.avatarUrl))
    return o
  }, [chatUserList])

  const lastSeenByAuthor = useMemo(() => {
    const m: Record<string, string> = {}
    participantIds.forEach((authorId) => {
      const u = mergedProfiles.get(authorId)
      if (authorId === currentUser?.id || u?.lastSeen === 'online') {
        m[authorId] = 'online'
      } else if (u?.lastSeen) {
        m[authorId] = u.lastSeen
      } else {
        m[authorId] = new Date(Date.now() - 10 * 60000).toISOString()
      }
    })
    return m
  }, [participantIds, mergedProfiles, currentUser?.id])

  const adminUserIds = useMemo(
    () =>
      chatUserList.filter((u) => u.role === 'company_admin' || u.role === 'super_admin').map((u) => u.id),
    [chatUserList]
  )

  const leadUserIds = useMemo(() => {
    const ids = new Set<string>()
    if (project?.projectLeadId) ids.add(project.projectLeadId)
    chatUserList.forEach((u) => {
      if (u.role === 'project_lead') ids.add(u.id)
    })
    return Array.from(ids)
  }, [project?.projectLeadId, chatUserList])

  useEffect(() => {
    const missing = participantIds.filter((id) => {
      const row = baseProfileMap.get(id)
      return !row || row.name === id
    })
    if (missing.length === 0) return
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        missing.map(async (uid) => {
          try {
            const u = await userService.get(uid)
            if (u) return [uid, userToRow(u)] as const
            return [uid, { id: uid, name: 'Unknown user' }] as const
          } catch {
            return [uid, { id: uid, name: 'Unknown user' }] as const
          }
        })
      )
      if (cancelled) return
      setExtraProfiles((prev) => {
        const next = { ...prev }
        entries.forEach((e) => {
          next[e[0]] = e[1]
        })
        return next
      })
    })()
    return () => {
      cancelled = true
    }
  }, [participantIds, baseProfileMap])

  const chatRequiresWebSocket = Boolean(wsRoomProjectId)

  const sendMessage = useCallback(async () => {
    if (!currentUser?.id || !newMessage.trim()) return
    if (!chatEntityId) {
      notifyError(
        'For marketplace jobs, the company must hire someone first so an internal workspace project exists. Then refresh this page.',
        'Chat not linked yet'
      )
      return
    }
    if (chatRequiresWebSocket && !chatWebSocketConnected) {
      notifyError('Live chat is not connected. Wait for the connection or refresh the page.', 'Chat offline')
      return
    }
    setSending(true)
    try {
      await commentService.add({
        entityType: 'doc',
        entityId: chatEntityId,
        authorId: currentUser.id,
        body: newMessage.trim(),
      })
      setNewMessage('')
      await refreshWorkspace()
    } catch (e) {
      const { title, message } = toastPartsFromApiError(e, { context: 'chat', fallbackTitle: 'Message not sent' })
      notifyError(message, title)
    } finally {
      setSending(false)
    }
  }, [chatEntityId, currentUser?.id, newMessage, refreshWorkspace, chatRequiresWebSocket, chatWebSocketConnected])

  const wsRef = useRef<WebSocket | null>(null)
  const wsConnectGenRef = useRef(0)

  /** Global hub: (re)subscribe when room or user is known while the socket is open. */
  useEffect(() => {
    if (!chatRequiresWebSocket || !chatWebSocketConnected) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !wsRoomProjectId) return
    try {
      ws.send(
        JSON.stringify({
          type: 'join',
          roomId: wsRoomProjectId,
          userId: currentUser?.id ?? '',
        })
      )
    } catch {
      /* ignore */
    }
  }, [chatRequiresWebSocket, chatWebSocketConnected, wsRoomProjectId, currentUser?.id])

  useEffect(() => {
    if (!chatRequiresWebSocket) {
      setChatWebSocketConnected(true)
      return
    }
    setChatWebSocketConnected(false)
    let cancelled = false
    const sessionAtStart = wsConnectGenRef.current
    const socketHolder: { current: WebSocket | null } = { current: null }

    const url = getGlobalChatWebSocketUrl({ roomId: wsRoomProjectId })
    if (!url) {
      return () => {
        cancelled = true
        wsConnectGenRef.current += 1
      }
    }

    // Defer open so React 19 Strict Mode can run cleanup of the first passive effect before we call
    // `new WebSocket` (avoids "closed before the connection is established" on the discarded mount).
    const openTimer = window.setTimeout(() => {
      if (cancelled || sessionAtStart !== wsConnectGenRef.current) return
      const socket = new WebSocket(url)
      socketHolder.current = socket
      wsRef.current = socket

      socket.onopen = () => {
        if (cancelled || sessionAtStart !== wsConnectGenRef.current) return
        try {
          socket.send(
            JSON.stringify({
              type: 'join',
              roomId: wsRoomProjectId,
              userId: currentUser?.id ?? '',
            })
          )
        } catch {
          /* ignore */
        }
        setChatWebSocketConnected(true)
      }
      socket.onmessage = (ev) => {
        try {
          const text = typeof ev.data === 'string' ? ev.data : ''
          if (!text) return
          let raw: unknown = JSON.parse(text)
          if (typeof raw === 'string') {
            try {
              raw = JSON.parse(raw)
            } catch {
              return
            }
          }
          if (!raw || typeof raw !== 'object') return
          const o = raw as Record<string, unknown>
          if (o.entityType !== 'doc' || typeof o.id !== 'string' || typeof o.authorId !== 'string') return
          const entityId = String(o.entityId ?? '')
          if (entityId !== wsRoomProjectId) return
          const incoming: Comment = {
            id: String(o.id),
            entityType: 'doc',
            entityId,
            authorId: String(o.authorId),
            body: String(o.body ?? ''),
            createdAt: String(o.createdAt ?? new Date().toISOString()),
            attachmentUrl: o.attachmentUrl != null ? String(o.attachmentUrl) : undefined,
            attachmentType: o.attachmentType === 'image' || o.attachmentType === 'doc' ? o.attachmentType : undefined,
            attachmentSize: o.attachmentSize != null ? String(o.attachmentSize) : undefined,
          }
          setComments((prev) => {
            if (prev.some((c) => c.id === incoming.id)) return prev
            return [incoming, ...prev]
          })
        } catch {
          /* ignore */
        }
      }
      socket.onclose = () => {
        socketHolder.current = null
        wsRef.current = null
        if (!cancelled && sessionAtStart === wsConnectGenRef.current) setChatWebSocketConnected(false)
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(openTimer)
      wsConnectGenRef.current += 1
      const s = socketHolder.current
      try {
        if (s?.readyState === WebSocket.OPEN && wsRoomProjectId) {
          s.send(JSON.stringify({ type: 'leave', roomId: wsRoomProjectId, userId: currentUser?.id ?? '' }))
        }
      } catch {
        /* ignore */
      }
      s?.close()
      socketHolder.current = null
      wsRef.current = null
    }
  }, [chatRequiresWebSocket, wsRoomProjectId, setComments])

  const canComposeMessages =
    Boolean(chatEntityId) && !sending && (!chatRequiresWebSocket || chatWebSocketConnected)

  return {
    chatEntityId,
    newMessage,
    setNewMessage,
    sending,
    sendMessage,
    userMap,
    userAvatarMap,
    participantCount: participantIds.length,
    participants: chatUserList.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
    })),
    lastSeenByAuthor,
    adminUserIds,
    leadUserIds,
    canComposeMessages,
    chatRequiresWebSocket,
    chatWebSocketConnected,
  }
}
