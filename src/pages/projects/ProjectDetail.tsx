import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import Text, { baseFontSize, minFontSize } from '../../components/base/Text'
import Avatar from '../../components/base/Avatar'
import { Card, Button, Badge, Modal, CustomSelect, DateSelectInput, Input, Skeleton } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { useProjectDetailModal } from '../../data/ModalStore'
import {
  projectService,
  taskService,
  milestoneService,
  userService,
  commentService,
  marketplaceService,
  assignmentService,
} from '../../services'
import type { Project, ProjectPosting, ProjectApplication, ProjectAssignment, Task, Milestone, Comment, UserRole, User } from '../../types'
import {
  ChevronLeft,
  Calendar,
  CalendarClock,
  Target,
  Plus,
  BarChart3,
  LayoutGrid,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
  MessageSquare,
  Folder,
  Check,
  Receipt,
  Users,
  UserCheck,
  UserX,
  UserRound,
} from 'lucide-react'

import { formatDate, getChartColors } from './utils'
import type { ProjectWithMeta } from './types'
import ProjectChatSidebar from './ProjectChatSidebar'
import ProjectFilesModal from './ProjectFilesModal'
import ProjectBillingModal from './ProjectBillingModal'
import EditProjectModal from './EditProjectModal'
import DeleteProjectModal from './DeleteProjectModal'
import SuspendProjectModal from './SuspendProjectModal'
import ProjectListAnalyticsModal from './ProjectListAnalyticsModal'
import BoardModal from '../../components/layout/BoardModal'
import ProjectTimelineGantt from './ProjectTimelineGantt'
import LogTimeModal from '../../components/ui/LogTimeModal'

const DONE_STATE_ID = 's6'

function normalizeCurrencyForIntl(code: string): string {
  const u = (code || 'UGX').trim().toUpperCase() || 'UGX'
  const aliases: Record<string, string> = { KSH: 'KES', SH: 'KES' }
  return aliases[u] ?? u
}

function formatMoney(value?: number, currency = 'UGX') {
  if (value == null || Number.isNaN(value)) return '—'
  const iso = normalizeCurrencyForIntl(currency || 'UGX')
  const displayCode = (currency || 'UGX').trim().toUpperCase() || 'UGX'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: iso,
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${displayCode} ${Math.round(Number(value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
}

function formatRoleLabel(role?: UserRole) {
  if (!role) return 'Freelancer'
  return role.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { current, mode: themeMode } = Themestore()
  const user = Authstore((s) => s.user)
  const dark = current?.system?.dark
  const darkMode = themeMode === 'dark'
  const primaryColor = current?.brand?.primary ?? '#682308'
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'
  const borderColor = current?.system?.border
  const bg = current?.system?.background
  const fg = current?.system?.foreground

  const [project, setProject] = useState<Project | null>(null)
  const [externalPosting, setExternalPosting] = useState<ProjectPosting | null>(null)
  const [externalApplications, setExternalApplications] = useState<ProjectApplication[]>([])
  const [externalLinkedProjectId, setExternalLinkedProjectId] = useState<string | null>(null)
  const [applicationFreelancers, setApplicationFreelancers] = useState<Record<string, User>>({})
  const [applicationStatusTab, setApplicationStatusTab] = useState<'all' | ProjectApplication['status']>('all')
  const [externalActionSavingId, setExternalActionSavingId] = useState<string | null>(null)
  const [hiringApplicationId, setHiringApplicationId] = useState<string | null>(null)
  const [pendingApplicationAction, setPendingApplicationAction] = useState<{
    applicationId: string
    kind: 'shortlist' | 'reject' | 'revoke' | 'assign'
  } | null>(null)
  const [hireLeadId, setHireLeadId] = useState('')
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email?: string; avatarUrl?: string; role?: UserRole; lastSeen?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const [addMilestoneOpen, setAddMilestoneOpen] = useProjectDetailModal(id, 'addMilestone')
  const [addTaskOpen, setAddTaskOpen] = useProjectDetailModal(id, 'addTask')
  const [milestoneName, setMilestoneName] = useState('')
  const [milestoneTarget, setMilestoneTarget] = useState('')
  const [milestonePriority, setMilestonePriority] = useState<string>('medium')
  const [milestoneAssigneeIds, setMilestoneAssigneeIds] = useState<string[]>([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskMilestoneId, setTaskMilestoneId] = useState('')
  const [taskOwnerId, setTaskOwnerId] = useState('')
  const [taskPriority, setTaskPriority] = useState<string>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useProjectDetailModal(id, 'edit')
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLeadId, setEditLeadId] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useProjectDetailModal(id, 'delete')
  const [suspendOpen, setSuspendOpen] = useProjectDetailModal(id, 'suspend')
  const [analyticsOpen, setAnalyticsOpen] = useProjectDetailModal(id, 'analytics')
  const [boardOpen, setBoardOpen] = useProjectDetailModal(id, 'board')
  const [actionSaving, setActionSaving] = useState(false)
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false)
  const [chatReadAt, setChatReadAt] = useState<number>(0)
  const [folderModalOpen, setFolderModalOpen] = useProjectDetailModal(id, 'folder')
  const [logTimeModalOpen, setLogTimeModalOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)

  const navigate = useNavigate()
  const externalFromRoute = location.pathname.includes('/app/marketplace/')
  const externalFromQuery = new URLSearchParams(location.search).get('external') === '1'
  const isExternalContext = externalFromRoute || externalFromQuery
  const isContributor = user?.role === 'consultant' || user?.role === 'freelancer'
  const isInternalProject = !isExternalContext
  const isExternalOriginInternalProject = isInternalProject && project?.projectType === 'external'
  const canManageProject = isInternalProject && !isContributor
  const canContributeTasks = isInternalProject && isContributor
  const canManageExternalPosting = isExternalContext && (user?.role === 'company_admin' || user?.role === 'super_admin')

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      if (isExternalContext) {
        const [posting, userList] = await Promise.all([
          marketplaceService.getPosting(id),
          user?.role === 'freelancer' ? Promise.resolve([]) : userService.list(),
        ])

        setExternalPosting(posting ?? null)
        if (posting) {
          const apps = await marketplaceService.listApplications(posting.id)
          setExternalApplications(apps)

          // External marketplace detail pages use posting IDs. Files/folders belong to
          // the real internal project created at hire time, so resolve that project id.
          const storageKey = `marketplace:posting:${posting.id}:projectId`
          const mappedProjectId = localStorage.getItem(storageKey)
          if (mappedProjectId) {
            setExternalLinkedProjectId(mappedProjectId)
          } else if (apps.some((application) => application.status === 'hired')) {
            try {
              const allProjects = await projectService.list()
              const matched = allProjects
                .filter((candidate) => candidate.companyId === posting.companyId && candidate.name === posting.title)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
              setExternalLinkedProjectId(matched?.id ?? null)
              if (matched?.id) localStorage.setItem(storageKey, matched.id)
            } catch {
              setExternalLinkedProjectId(null)
            }
          } else {
            setExternalLinkedProjectId(null)
          }
        } else {
          setExternalApplications([])
          setExternalLinkedProjectId(null)
        }
        setProjectAssignments([])
        setTasks([])
        setMilestones([])
        setComments([])

        if (posting) {
          // Build a lightweight project shape so internal detail layout can be reused.
          setProject({
            id: posting.id,
            companyId: posting.companyId,
            name: posting.title,
            description: posting.description,
            projectLeadId: posting.createdById,
            workflowId: '',
            createdAt: posting.createdAt,
            dueDate: undefined,
            status: posting.status === 'closed' ? 'suspended' : 'active',
            projectType: 'external',
          })
        } else {
          setProject(null)
        }

        const visibleUsers = user?.role === 'freelancer' && user
          ? [{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role, lastSeen: user.lastSeen }]
          : userList.map((u) => ({ id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, role: u.role, lastSeen: u.lastSeen }))
        setUsers(visibleUsers)
        setHireLeadId((prev) => prev || user?.id || visibleUsers[0]?.id || '')
        return
      }

      const [proj, taskList, milestoneList, commentList, userList, assignments] = await Promise.all([
        projectService.get(id),
        taskService.listByProject(id),
        milestoneService.listByProject(id),
        commentService.listByEntity('doc', id),
        user?.role === 'freelancer' ? Promise.resolve([]) : userService.list(),
        assignmentService.listByProject(id),
      ])
      setExternalPosting(null)
      setExternalApplications([])
      setExternalLinkedProjectId(null)
      setProject(proj ?? null)
      setTasks(taskList)
      setMilestones(milestoneList)
      setComments(commentList)
      setProjectAssignments(assignments)
      const visibleUsers = user?.role === 'freelancer' && user
        ? [{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role, lastSeen: user.lastSeen }]
        : userList.map((u) => ({ id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, role: u.role, lastSeen: u.lastSeen }))
      setUsers(visibleUsers)
    } finally {
      setLoading(false)
    }
  }, [id, isExternalContext, user?.role, user?.id, user?.name, user?.avatarUrl, user?.lastSeen])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!isExternalContext || externalApplications.length === 0) {
      setApplicationFreelancers({})
      return
    }
    const missingIds = Array.from(
      new Set(
        externalApplications
          .map((application) => application.freelancerId)
          .filter((uid) => !!uid && !users.some((u) => u.id === uid))
      )
    )
    if (missingIds.length === 0) return
    let cancelled = false
    ;(async () => {
      const fetched = await Promise.all(
        missingIds.map(async (uid) => {
          try {
            return await userService.get(uid)
          } catch {
            return null
          }
        })
      )
      if (cancelled) return
      const map: Record<string, User> = {}
      fetched.forEach((entry) => {
        if (entry?.id) map[entry.id] = entry
      })
      setApplicationFreelancers((prev) => ({ ...prev, ...map }))
    })()
    return () => {
      cancelled = true
    }
  }, [isExternalContext, externalApplications, users])

  useEffect(() => {
    if (addMilestoneOpen && !milestoneTarget) {
      const d = new Date()
      setMilestoneTarget(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      )
    }
  }, [addMilestoneOpen])

  useEffect(() => {
    if (!addMilestoneOpen) return
    if (milestoneAssigneeIds.length > 0) return
    const defaultAssigneeIds = projectAssignments
      .filter((assignment) => assignment.status === 'active')
      .map((assignment) => assignment.freelancerId)
    if (defaultAssigneeIds.length > 0) {
      setMilestoneAssigneeIds(defaultAssigneeIds)
    }
  }, [addMilestoneOpen, milestoneAssigneeIds.length, projectAssignments])

  useEffect(() => {
    if (!addTaskOpen) return
    if (user?.role === 'freelancer' && user.id && !taskOwnerId) {
      setTaskOwnerId(user.id)
    }
  }, [addTaskOpen, user?.role, user?.id, taskOwnerId])

  useEffect(() => {
    if (!chatSidebarOpen) return
    setChatReadAt(Date.now())
  }, [chatSidebarOpen, comments.length])

  const userMap = useMemo(() => {
    const m: Record<string, string> = {}
    users.forEach((u) => (m[u.id] = u.name))
    return m
  }, [users])

  const userAvatarMap = useMemo(() => {
    const m: Record<string, string | undefined> = {}
    users.forEach((u) => (m[u.id] = u.avatarUrl))
    return m
  }, [users])

  const leadName = externalPosting
    ? (externalPosting.companyName ?? userMap[externalPosting.createdById] ?? 'Company')
    : project
      ? userMap[project.projectLeadId] ?? project.projectLeadId
      : ''

  const milestonesDone = useMemo(
    () => milestones.filter((m) => m.workflowStateId === DONE_STATE_ID).length,
    [milestones]
  )
  const progressPct = milestones.length
    ? Math.round((milestonesDone / milestones.length) * 100)
    : 0

  const projectDueLabel = useMemo(() => {
    if (!project?.dueDate) return null
    return formatDate(project.dueDate)
  }, [project?.dueDate])

  const assignedEmployeeIds = useMemo(() => {
    const fromAssignments = projectAssignments
      .filter((assignment) => assignment.status === 'active')
      .map((assignment) => assignment.freelancerId)
      .filter(Boolean)
    if (fromAssignments.length > 0) return [...new Set(fromAssignments)]
    return [...new Set(tasks.map((t) => t.ownerId).filter(Boolean))]
  }, [tasks, projectAssignments])
  const canManageExternalHiring = isExternalContext && (user?.role === 'company_admin' || user?.role === 'super_admin')
  const hiredApplication = useMemo(
    () => externalApplications.find((application) => application.status === 'hired') ?? null,
    [externalApplications]
  )
  const filesProjectId = useMemo(() => {
    if (!project) return ''
    if (isExternalContext) return externalLinkedProjectId ?? project.id
    return project.id
  }, [project, isExternalContext, externalLinkedProjectId])
  const getFreelancerProfile = useCallback((freelancerId: string) => {
    return users.find((u) => u.id === freelancerId) ?? applicationFreelancers[freelancerId] ?? null
  }, [users, applicationFreelancers])
  const heroAssignedConsultants = useMemo(() => {
    if (isExternalContext) {
      const byId = new Map<string, { id: string; name: string; avatarUrl?: string }>()
      externalApplications
        .filter((application) => application.status === 'hired')
        .forEach((application) => {
          const profile = getFreelancerProfile(application.freelancerId)
          const memberId = profile?.id ?? application.freelancerId
          if (!memberId || byId.has(memberId)) return
          byId.set(memberId, {
            id: memberId,
            name: profile?.name ?? 'Assigned freelancer',
            avatarUrl: profile?.avatarUrl,
          })
        })
      return Array.from(byId.values())
    }
    if (!project) return []
    const assigneeIds = new Set<string>([project.projectLeadId])
    tasks.forEach((task) => assigneeIds.add(task.ownerId))
    return Array.from(assigneeIds).map((uid) => ({
      id: uid,
      name: userMap[uid] ?? uid,
      avatarUrl: users.find((u) => u.id === uid)?.avatarUrl,
    }))
  }, [isExternalContext, externalApplications, getFreelancerProfile, project, tasks, userMap, users])
  const applicationTabs = useMemo(() => {
    const counts = {
      all: externalApplications.length,
      applied: 0,
      shortlisted: 0,
      rejected: 0,
      withdrawn: 0,
      hired: 0,
    }
    externalApplications.forEach((application) => {
      counts[application.status] += 1
    })
    return [
      { key: 'all' as const, label: 'All', count: counts.all },
      { key: 'applied' as const, label: 'Applied', count: counts.applied },
      { key: 'shortlisted' as const, label: 'Shortlisted', count: counts.shortlisted },
      { key: 'hired' as const, label: 'Hired', count: counts.hired },
      { key: 'rejected' as const, label: 'Rejected', count: counts.rejected },
      { key: 'withdrawn' as const, label: 'Withdrawn', count: counts.withdrawn },
    ]
  }, [externalApplications])
  const visibleApplications = useMemo(
    () => applicationStatusTab === 'all'
      ? externalApplications
      : externalApplications.filter((application) => application.status === applicationStatusTab),
    [applicationStatusTab, externalApplications]
  )

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name })),
    [users]
  )
  const milestoneOptions = useMemo(
    () => [{ value: '', label: 'No milestone' }, ...milestones.map((m) => ({ value: m.id, label: m.name }))],
    [milestones]
  )
  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  const handleAddComment = useCallback(async () => {
    if (!id || !user?.id || !newComment.trim()) return
    setCommentSending(true)
    try {
      await commentService.add({
        entityType: 'doc',
        entityId: id,
        authorId: user.id,
        body: newComment.trim(),
      })
      setNewComment('')
      loadData()
    } finally {
      setCommentSending(false)
    }
  }, [id, user?.id, newComment, loadData])

  const handleAddMilestone = useCallback(async () => {
    if (!id || !milestoneName.trim() || !milestoneTarget) return
    setSaving(true)
    try {
      await milestoneService.create({
        projectId: id,
        name: milestoneName.trim(),
        priority: milestonePriority as 'high' | 'medium' | 'low',
        targetDate: milestoneTarget,
        taskIds: [],
        assigneeIds: milestoneAssigneeIds.length ? milestoneAssigneeIds : undefined,
      })
      setAddMilestoneOpen(false)
      setMilestoneName('')
      setMilestoneTarget('')
      setMilestonePriority('medium')
      setMilestoneAssigneeIds([])
      loadData()
    } finally {
      setSaving(false)
    }
  }, [id, milestoneName, milestoneTarget, milestonePriority, milestoneAssigneeIds, loadData])

  const handleAddTask = useCallback(async () => {
    if (!id || !taskTitle.trim() || !taskOwnerId) return
    const workflow = await projectService.getWorkflow(id)
    const firstStateId = workflow?.states?.[0]?.id ?? 's1'
    setSaving(true)
    try {
      await taskService.create({
        projectId: id,
        milestoneId: taskMilestoneId || undefined,
        title: taskTitle.trim(),
        workflowStateId: firstStateId,
        ownerId: taskOwnerId,
        priority: (taskPriority as 'high' | 'medium' | 'low') || 'medium',
        dueDate: taskDueDate || undefined,
        dependencyIds: [],
      })
      setAddTaskOpen(false)
      setTaskTitle('')
      setTaskMilestoneId('')
      setTaskOwnerId('')
      setTaskPriority('medium')
      setTaskDueDate('')
      loadData()
    } finally {
      setSaving(false)
    }
  }, [id, taskTitle, taskMilestoneId, taskOwnerId, taskPriority, taskDueDate, loadData])

  const chatParticipantIds = useMemo(
    () =>
      project
        ? [...new Set([project.projectLeadId, ...comments.map((c) => c.authorId)])]
        : [],
    [project, comments]
  )
  const chatParticipantCount = chatParticipantIds.length

  const chatLastSeenByAuthor = useMemo(() => {
    const m: Record<string, string> = {}
    chatParticipantIds.forEach((authorId) => {
      const u = users.find((usr) => usr.id === authorId)
      if (authorId === user?.id || u?.lastSeen === 'online') {
        m[authorId] = 'online'
      } else if (u?.lastSeen) {
        m[authorId] = u.lastSeen
      } else {
        m[authorId] = new Date(Date.now() - 10 * 60000).toISOString()
      }
    })
    return m
  }, [chatParticipantIds, user?.id, users])

  const chatAdminUserIds = useMemo(
    () => users.filter((u) => u.role === 'company_admin' || u.role === 'super_admin').map((u) => u.id),
    [users]
  )
  const chatLeadUserIds = useMemo(() => {
    const ids = new Set<string>()
    if (project?.projectLeadId) ids.add(project.projectLeadId)
    users.forEach((u) => {
      if (u.role === 'project_lead') ids.add(u.id)
    })
    return Array.from(ids)
  }, [project?.projectLeadId, users])

  const projectWithMeta: ProjectWithMeta | null = useMemo(() => {
    if (!project) return null
    const assigneeIds = new Set<string>([project.projectLeadId])
    tasks.forEach((t) => assigneeIds.add(t.ownerId))
    return {
      ...project,
      leadName: userMap[project.projectLeadId] ?? project.projectLeadId,
      taskCount: tasks.length,
      members: Array.from(assigneeIds).map((uid) => ({
        id: uid,
        name: userMap[uid] ?? uid,
        avatarUrl: users.find((u) => u.id === uid)?.avatarUrl,
      })),
    }
  }, [project, tasks, userMap, users])
  const suspendModalProject: ProjectWithMeta | null = useMemo(() => {
    if (projectWithMeta) return projectWithMeta
    if (!project) return null
    return {
      ...project,
      leadName,
      taskCount: tasks.length,
      members: [],
    }
  }, [projectWithMeta, project, leadName, tasks.length])

  useEffect(() => {
    if (editOpen && project) {
      setEditName(project.name)
      setEditDescription(project.description ?? '')
      setEditLeadId(project.projectLeadId)
      setEditDueDate(project.dueDate ?? '')
    }
  }, [editOpen, project])

  const handleEditSave = useCallback(async () => {
    if (!id || !editName.trim() || !editLeadId) return
    setEditSaving(true)
    try {
      await projectService.update(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        projectLeadId: editLeadId,
        dueDate: editDueDate.trim() || undefined,
      })
      setEditOpen(false)
      loadData()
    } finally {
      setEditSaving(false)
    }
  }, [id, editName, editDescription, editLeadId, editDueDate, loadData])

  const handleDeleteConfirm = useCallback(async () => {
    if (!id) return
    setActionSaving(true)
    try {
      await projectService.delete(id)
      setDeleteOpen(false)
      navigate('/app/projects')
    } finally {
      setActionSaving(false)
    }
  }, [id, navigate])

  const handleSuspendConfirm = useCallback(async () => {
    if (!id) return
    setActionSaving(true)
    try {
      if (isExternalContext) {
        const nextPostingStatus = externalPosting?.status === 'closed' ? 'open' : 'closed'
        await marketplaceService.updatePosting(id, { status: nextPostingStatus })
      } else {
        const nextStatus = project?.status === 'suspended' ? 'active' : 'suspended'
        await projectService.update(id, { status: nextStatus })
      }
      setSuspendOpen(false)
      loadData()
    } finally {
      setActionSaving(false)
    }
  }, [id, isExternalContext, externalPosting?.status, project?.status, loadData])

  const handleShortlistApplication = useCallback(async (applicationId: string) => {
    if (!id) return
    setExternalActionSavingId(applicationId)
    try {
      await marketplaceService.updateApplicationStatus(applicationId, 'shortlisted')
      const refreshed = await marketplaceService.listApplications(id)
      setExternalApplications(refreshed)
    } finally {
      setExternalActionSavingId(null)
    }
  }, [id])

  const handleUpdateApplicationStatus = useCallback(async (applicationId: string, status: ProjectApplication['status']) => {
    if (!id) return
    setExternalActionSavingId(applicationId)
    try {
      await marketplaceService.updateApplicationStatus(applicationId, status)
      const refreshed = await marketplaceService.listApplications(id)
      setExternalApplications(refreshed)
    } finally {
      setExternalActionSavingId(null)
    }
  }, [id])

  const handleHireApplication = useCallback(async (applicationId: string) => {
    if (!hireLeadId) return
    const alreadyHiredOther = externalApplications.some((application) => application.status === 'hired' && application.id !== applicationId)
    if (alreadyHiredOther) return
    setHiringApplicationId(applicationId)
    try {
      const hireResult = await marketplaceService.hire(applicationId, { projectLeadId: hireLeadId })
      if (id && hireResult?.projectId) {
        localStorage.setItem(`marketplace:posting:${id}:projectId`, hireResult.projectId)
        setExternalLinkedProjectId(hireResult.projectId)
      }
      if (id) {
        const refreshed = await marketplaceService.listApplications(id)
        setExternalApplications(refreshed)
      }
    } finally {
      setHiringApplicationId(null)
    }
  }, [hireLeadId, id, externalApplications])

  const handleConfirmApplicationAction = useCallback(async () => {
    if (!pendingApplicationAction) return
    const { applicationId, kind } = pendingApplicationAction
    if (kind === 'shortlist') await handleShortlistApplication(applicationId)
    if (kind === 'reject') await handleUpdateApplicationStatus(applicationId, 'rejected')
    if (kind === 'revoke') await handleUpdateApplicationStatus(applicationId, 'shortlisted')
    if (kind === 'assign') await handleHireApplication(applicationId)
    setPendingApplicationAction(null)
  }, [pendingApplicationAction, handleShortlistApplication, handleUpdateApplicationStatus, handleHireApplication])

  const leadOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name })).sort((a, b) => a.label.localeCompare(b.label)),
    [users]
  )

  const analyticsChartData = useMemo(
    () =>
      project
        ? [{ name: project.name.length > 12 ? project.name.slice(0, 12) + '…' : project.name, tasks: tasks.length, fullName: project.name }]
        : [],
    [project, tasks]
  )
  const analyticsTrendData = useMemo(
    () => (project ? [{ month: project.createdAt.slice(0, 7), projects: 1 }] : []),
    [project]
  )
  const analyticsChartColors = useMemo(
    () => getChartColors(primaryColor, secondaryColor, Math.max(analyticsChartData.length, 2)),
    [primaryColor, secondaryColor, analyticsChartData.length]
  )
  const pendingActionApplication = useMemo(
    () => pendingApplicationAction
      ? externalApplications.find((a) => a.id === pendingApplicationAction.applicationId) ?? null
      : null,
    [pendingApplicationAction, externalApplications]
  )
  const confirmActionLoading = useMemo(() => {
    if (!pendingApplicationAction) return false
    if (pendingApplicationAction.kind === 'assign') return hiringApplicationId === pendingApplicationAction.applicationId
    return externalActionSavingId === pendingApplicationAction.applicationId
  }, [pendingApplicationAction, externalActionSavingId, hiringApplicationId])
  const unreadCommentsCount = useMemo(
    () =>
      comments.filter((c) =>
        c.authorId !== user?.id &&
        new Date(c.createdAt).getTime() > chatReadAt
      ).length,
    [comments, user?.id, chatReadAt]
  )

  if (!id) return <Text>Invalid project</Text>
  if (loading && !project) {
    return (
      <div
        className="flex h-full max-h-full min-h-0 gap-1 w-full overflow-hidden"
        style={{ fontSize: baseFontSize }}
      >
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden scroll-slim">
          <header
            className="shrink-0 py-3 flex items-center gap-2 border-b px-3"
            style={{ borderColor, backgroundColor: fg }}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton height="h-5" width="w-48" />
              <Skeleton height="h-4" width="w-36" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height="h-9" width="w-9" rounded="base" className="shrink-0" />
            ))}
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto scroll-slim pr-2 py-4" style={{ backgroundColor: bg }}>
            <div className="flex items-center gap-2 mb-4">
              <Skeleton height="h-4" width="w-20" />
              <Skeleton height="h-4" width="w-4" />
              <Skeleton height="h-4" width="w-32" />
            </div>
            <section className="mb-6">
              <Card className="p-5" style={{ backgroundColor: fg }}>
                <div className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <Skeleton height="h-3" width="w-12" />
                    <Skeleton height="h-5" width="w-56" className="mb-2" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton height="h-3" width="w-14" />
                    <Skeleton height="h-4" width="w-full" />
                    <Skeleton height="h-4" width="w-4/5" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton height="h-3" width="w-16" />
                    <div className="flex gap-4">
                      <Skeleton height="h-4" width="w-24" />
                      <Skeleton height="h-4" width="w-28" />
                      <Skeleton height="h-4" width="w-20" />
                    </div>
                  </div>
                </div>
              </Card>
            </section>
            <div className="space-y-3">
              <Skeleton height="h-5" width="w-28" />
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4" style={{ backgroundColor: fg }}>
                  <div className="flex items-center gap-3">
                    <Skeleton height="h-10" width="w-10" rounded="base" />
                    <div className="flex-1 space-y-1">
                      <Skeleton height="h-4" width="w-40" />
                      <Skeleton height="h-3" width="w-24" />
                    </div>
                    <Skeleton height="h-8" width="w-16" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <aside
          className="w-72 shrink-0 border-l hidden lg:flex flex-col overflow-hidden"
          style={{ borderColor, backgroundColor: fg }}
        >
          <div className="p-3 border-b" style={{ borderColor }}>
            <Skeleton height="h-5" width="w-24" className="mb-2" />
            <Skeleton height="h-4" width="w-full" />
            <Skeleton height="h-4" width="w-3/4" />
          </div>
          <div className="flex-1 p-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton height="h-8" width="w-8" rounded="full" className="shrink-0" />
                <Skeleton height="h-4" width="w-24" className="flex-1" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    )
  }
  if (!project) return <Text className="p-4">Project not found.</Text>

  return (
    <div
      className="flex h-full max-h-full min-h-0 gap-1 w-full overflow-hidden"
      style={{ fontSize: baseFontSize }}
    >
      {/* Left: main content — header height and layout match right sidebar */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden scroll-slim">
        <header
          className="shrink-0 py-3 flex items-center gap-2 border-b"
          style={{ borderColor, paddingLeft: 12, paddingRight: 8 }}
        >
          <div className="min-w-0 flex-1" style={{ paddingLeft: 4 }}>
            <Text className="font-medium truncate" style={{ color: dark }}>
              {project.name}
            </Text>
            <Text variant="sm" className="opacity-70 truncate" style={{ color: dark }}>
              {isExternalContext
                ? `Posted by: ${leadName} · ${(externalPosting?.requiredSkills?.length ?? 0)} skill${(externalPosting?.requiredSkills?.length ?? 0) !== 1 ? 's' : ''}`
                : `Lead: ${leadName} · ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
            </Text>
          </div>
          <div
            className="flex items-center gap-2 shrink-0 py-1 px-1 rounded-base"
            style={{ backgroundColor: `${fg}99`, backdropFilter: 'blur(8px)' }}
          >
            <button
              type="button"
              onClick={() => setFolderModalOpen(true)}
              className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
              style={{ color: dark, backgroundColor: 'transparent' }}
              title="Project files"
              aria-label="Open files and folders"
            >
              <Folder className="w-5 h-5" />
            </button>
            {isInternalProject && (
              <button
                type="button"
                onClick={() =>
                  canContributeTasks
                    ? user?.role === 'consultant'
                      ? setLogTimeModalOpen(true)
                      : setAddTaskOpen(true)
                    : canManageProject
                      ? setAddMilestoneOpen(true)
                      : undefined
                }
                className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                style={{ color: dark, backgroundColor: 'transparent' }}
                title={canContributeTasks ? (user?.role === 'freelancer' ? 'Add task' : 'Log time') : 'Add milestone'}
                aria-label={canContributeTasks ? (user?.role === 'freelancer' ? 'Add task' : 'Log time') : 'Add milestone'}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            {canManageProject && (
              <button
                type="button"
                onClick={() => setBillingOpen(true)}
                className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                style={{ color: dark, backgroundColor: 'transparent' }}
                title="Billing"
                aria-label="Open billing"
              >
                <Receipt className="w-5 h-5" />
              </button>
            )}
            {isInternalProject && (
              <>
                <button
                  type="button"
                  onClick={() => setAnalyticsOpen(true)}
                  className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                  style={{ color: dark, backgroundColor: 'transparent' }}
                  title="View analytics"
                  aria-label="View analytics"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBoardOpen(true)}
                  className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                  style={{ color: dark, backgroundColor: 'transparent' }}
                  title="Board"
                  aria-label="Open board"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </>
            )}
            {(canManageProject || canManageExternalPosting) && (
              <>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                  style={{ color: dark, backgroundColor: 'transparent' }}
                  title="Edit project"
                  aria-label="Edit project"
                  disabled={!isInternalProject}
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSuspendOpen(true)}
                  className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                  style={{ color: dark, backgroundColor: 'transparent' }}
                  title={isExternalContext ? (externalPosting?.status === 'closed' ? 'Resume project' : 'Suspend project') : (project?.status === 'suspended' ? 'Resume project' : 'Suspend project')}
                  aria-label={isExternalContext ? (externalPosting?.status === 'closed' ? 'Resume project' : 'Suspend project') : (project?.status === 'suspended' ? 'Resume project' : 'Suspend project')}
                >
                  {(isExternalContext ? externalPosting?.status === 'closed' : project?.status === 'suspended') ? (
                    <PlayCircle className="w-5 h-5" />
                  ) : (
                    <PauseCircle className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                  style={{ color: dark, backgroundColor: 'transparent' }}
                  title="Delete project"
                  aria-label="Delete project"
                  disabled={!isInternalProject}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            {isInternalProject && (
              <button
                type="button"
                onClick={() => setChatSidebarOpen((prev) => !prev)}
                className="relative shrink-0 p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-0"
                style={{ color: dark, backgroundColor: 'transparent' }}
                title={chatSidebarOpen ? 'Close chat' : 'Open project chat'}
                aria-label={chatSidebarOpen ? 'Close chat' : 'Open project chat'}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCommentsCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-xs font-medium px-1"
                    style={{ backgroundColor: current?.system?.error }}
                  >
                    {unreadCommentsCount > 99 ? '99+' : unreadCommentsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto scroll-slim pr-2 py-4" style={{ backgroundColor: bg }}>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity rounded-base px-1 py-0.5 -ml-1"
              style={{ color: dark, fontSize: baseFontSize }}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              {isExternalContext ? 'Marketplace Projects' : 'Projects'}
            </Link>
            <span className="opacity-50" style={{ color: dark }}>/</span>
            <span style={{ color: dark, fontSize: baseFontSize }} className="font-medium truncate max-w-[200px]">
              {project.name}
            </span>
          </div>
          <section className="mb-6">
            <Card className="p-5" style={{ backgroundColor: fg }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="text-sm opacity-70 mb-0.5" style={{ fontSize: Math.max(minFontSize, baseFontSize * 0.8), color: dark }}>
                      Title
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium truncate" style={{ fontSize: baseFontSize, color: dark }}>
                        {project.name}
                      </p>
                      {project.status && (
                        <Badge variant={project.status === 'suspended' ? 'warning' : 'success'}>
                          {project.status === 'suspended' ? 'Suspended' : 'Active'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm opacity-70 mb-0.5" style={{ fontSize: Math.max(minFontSize, baseFontSize * 0.8), color: dark }}>
                      Description
                    </p>
                    <p
                      className="opacity-90 overflow-hidden"
                      style={{
                        fontSize: baseFontSize,
                        color: dark,
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                      }}
                    >
                      {project.description || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70 mb-2" style={{ fontSize: Math.max(minFontSize, baseFontSize * 0.8), color: dark }}>
                      Details
                    </p>
                    <div className="space-y-3" style={{ fontSize: Math.max(minFontSize, baseFontSize * 0.875) }}>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="opacity-70 shrink-0" style={{ color: dark }}>Lead</span>
                          <span className="rounded-full shrink-0 inline-block" style={{ boxShadow: `0 0 0 2px ${fg}` }}>
                            <Avatar
                              name={leadName}
                              size="sm"
                              src={projectWithMeta?.members.find((m) => m.id === project.projectLeadId)?.avatarUrl}
                            />
                          </span>
                          <span className="truncate font-medium" style={{ color: dark }}>{leadName}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="opacity-70 shrink-0" style={{ color: dark }}>Assigned consultants</span>
                          {heroAssignedConsultants.length > 0 ? (
                            <>
                              <span className="flex -space-x-2">
                                {heroAssignedConsultants.slice(0, 5).map((m) => (
                                  <span
                                    key={m.id}
                                    className="rounded-full shrink-0 inline-block"
                                    style={{ boxShadow: `0 0 0 2px ${fg}` }}
                                  >
                                    <Avatar name={m.name} size="sm" src={m.avatarUrl} />
                                  </span>
                                ))}
                                {heroAssignedConsultants.length > 5 && (
                                  <span
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
                                    style={{
                                      backgroundColor: borderColor ?? 'rgba(0,0,0,0.1)',
                                      color: dark,
                                      boxShadow: `0 0 0 2px ${fg}`,
                                    }}
                                  >
                                    +{heroAssignedConsultants.length - 5}
                                  </span>
                                )}
                              </span>
                              <span className="opacity-75 truncate" style={{ color: dark }}>
                                {heroAssignedConsultants.length === 1
                                  ? heroAssignedConsultants[0].name
                                  : `${heroAssignedConsultants.length} working`}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: dark }}>—</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-4 h-4 shrink-0 opacity-70" style={{ color: dark }} />
                          <span className="opacity-70 shrink-0" style={{ color: dark }}>Created</span>
                          <span style={{ color: dark }}>{formatDate(project.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <CalendarClock className="w-4 h-4 shrink-0 opacity-70" style={{ color: dark }} />
                          <span className="opacity-70 shrink-0" style={{ color: dark }}>Due</span>
                          <span style={{ color: dark }}>{projectDueLabel ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Target className="w-4 h-4 shrink-0 opacity-70" style={{ color: dark }} />
                          <span className="opacity-70 shrink-0" style={{ color: dark }}>
                            {isExternalContext ? 'Budget' : 'Milestones'}
                          </span>
                          <span style={{ color: dark }}>
                            {isExternalContext && externalPosting
                              ? externalPosting.budgetType === 'hourly'
                                ? `${formatMoney(externalPosting.hourlyMin, externalPosting.currency)} – ${formatMoney(externalPosting.hourlyMax, externalPosting.currency)} / hr`
                                : externalPosting.budgetType === 'fixed'
                                  ? `${formatMoney(externalPosting.fixedMin, externalPosting.currency)} – ${formatMoney(externalPosting.fixedMax, externalPosting.currency)}`
                                  : `${formatMoney(externalPosting.hourlyMin, externalPosting.currency)} – ${formatMoney(externalPosting.hourlyMax, externalPosting.currency)} / hr • ${formatMoney(externalPosting.fixedMin, externalPosting.currency)} – ${formatMoney(externalPosting.fixedMax, externalPosting.currency)} fixed`
                              : milestones.length
                                ? `${milestones.length} set`
                                : 'None'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="opacity-70 shrink-0" style={{ color: dark }}>
                            {isExternalContext ? 'Posting status' : 'Assigned consultants'}
                          </span>
                          {isExternalContext && externalPosting ? (
                            <span style={{ color: dark }}>
                              {hiredApplication
                                ? `Assigned to ${getFreelancerProfile(hiredApplication.freelancerId)?.name ?? 'Freelancer'}`
                                : (externalPosting.status === 'open' ? 'Open' : 'Closed')}
                            </span>
                          ) : assignedEmployeeIds.length > 0 ? (
                            <>
                              <span className="flex -space-x-2">
                                {assignedEmployeeIds.slice(0, 5).map((uid) => (
                                  <span
                                    key={uid}
                                    className="rounded-full shrink-0 inline-block"
                                    style={{ boxShadow: `0 0 0 2px ${fg}` }}
                                  >
                                    <Avatar
                                      name={userMap[uid]}
                                      size="sm"
                                      src={users.find((u) => u.id === uid)?.avatarUrl}
                                    />
                                  </span>
                                ))}
                                {assignedEmployeeIds.length > 5 && (
                                  <span
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
                                    style={{
                                      backgroundColor: borderColor ?? 'rgba(0,0,0,0.1)',
                                      color: dark,
                                      boxShadow: `0 0 0 2px ${fg}`,
                                    }}
                                  >
                                    +{assignedEmployeeIds.length - 5}
                                  </span>
                                )}
                              </span>
                              <span className="opacity-75 truncate" style={{ color: dark }}>
                                {assignedEmployeeIds.length === 1
                                  ? userMap[assignedEmployeeIds[0]]
                                  : `${assignedEmployeeIds.length} assigned`}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: dark }}>—</span>
                          )}
                        </div>
                      </div>
                      {isExternalContext && (
                        <div className="flex items-start gap-2 min-w-0 flex-wrap">
                          {externalPosting?.requiredSkills && externalPosting.requiredSkills.length > 0 ? (
                            <span className="flex flex-wrap gap-2">
                              {externalPosting.requiredSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: `${primaryColor}16`, color: dark, border: `1px solid ${borderColor}` }}
                                >
                                  {skill}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span style={{ color: dark }}>—</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="shrink-0 flex items-center gap-3 sm:pl-5"
                  style={{ borderLeft: borderColor ? `1px solid ${borderColor}` : undefined }}
                >
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke={borderColor} strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke={primaryColor}
                        strokeWidth="3"
                        strokeDasharray={`${progressPct * 0.97} 97`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-medium" style={{ fontSize: baseFontSize, color: dark }}>
                      {progressPct}%
                    </span>
                  </div>
                  <div>
                    <Text variant="sm" className="opacity-80" style={{ color: dark }}>Milestones complete</Text>
                    <Text className="font-medium" style={{ color: dark }}>{milestonesDone} of {milestones.length}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {isExternalContext && canManageExternalHiring && (
            <section className="mb-6">
              <Card className="p-5" style={{ backgroundColor: fg }}>
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: dark }} />
                    <Text className="font-medium" style={{ color: dark }}>
                      Applications ({externalApplications.length})
                    </Text>
                  </div>
                  <div className="w-full sm:w-[280px]">
                    <CustomSelect
                      label="Project lead"
                      options={leadOptions}
                      value={hireLeadId}
                      onChange={setHireLeadId}
                      placement="below"
                    />
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  {applicationTabs.map((tab) => {
                    const selected = applicationStatusTab === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setApplicationStatusTab(tab.key)}
                        className="px-3 py-1.5 rounded-base border transition-opacity font-medium"
                        style={{
                          borderColor: selected ? `${primaryColor}55` : borderColor,
                          color: dark,
                          backgroundColor: selected ? `${primaryColor}16` : 'transparent',
                          opacity: selected ? 1 : 0.84,
                        }}
                      >
                        {tab.label} {tab.count}
                      </button>
                    )
                  })}
                </div>
                <div className="space-y-3">
                  {visibleApplications.map((application) => {
                    const freelancer = getFreelancerProfile(application.freelancerId)
                    const isShortlisting = externalActionSavingId === application.id
                    const isHiring = hiringApplicationId === application.id
                    return (
                      <div
                        key={application.id}
                        className="rounded-base p-4"
                        style={{ backgroundColor: bg }}
                      >
                        <div className="flex flex-col gap-3">
                          <div
                            className="rounded-base px-3 py-3 flex items-start justify-between gap-4 flex-wrap"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <div className="min-w-0 flex items-start gap-3">
                              <Avatar
                                name={freelancer?.name ?? 'Freelancer'}
                                src={freelancer?.avatarUrl}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <Text className="font-medium truncate" style={{ color: dark }}>
                                  {freelancer?.name ?? 'Freelancer'}
                                </Text>
                                <Text variant="sm" className="opacity-70 truncate" style={{ color: dark }}>
                                  {freelancer?.email ?? formatRoleLabel(freelancer?.role)}
                                </Text>
                                <Text variant="sm" className="opacity-80 mt-0.5" style={{ color: dark }}>
                                  Applied: {formatDate(application.createdAt)}
                                </Text>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                                style={{ backgroundColor: `${primaryColor}16`, color: dark, border: `1px solid ${borderColor}` }}
                              >
                                {application.status}
                              </span>
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: fg, color: dark }}
                              >
                                {application.currency && application.proposedHourlyRate != null
                                  ? `${formatMoney(application.proposedHourlyRate, application.currency)} / hr`
                                  : application.currency && application.proposedFixed != null
                                    ? `${formatMoney(application.proposedFixed, application.currency)} fixed`
                                    : 'Rate not provided'}
                              </span>
                            </div>
                          </div>
                          {application.coverLetter ? (
                            <div className="rounded-base px-3 py-2" style={{ backgroundColor: 'transparent' }}>
                              <Text variant="sm" className="opacity-80 line-clamp-2" style={{ color: dark }}>
                                {application.coverLetter}
                              </Text>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-2 flex-wrap pt-1 rounded-base px-3 py-2" style={{ backgroundColor: 'transparent' }}>
                            <button
                              type="button"
                              onClick={() => setPendingApplicationAction({ applicationId: application.id, kind: 'shortlist' })}
                              disabled={isShortlisting || isHiring || application.status === 'hired' || application.status === 'shortlisted'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-40"
                              style={{
                                color: dark,
                                backgroundColor: fg,
                                border: `0.5px solid ${borderColor ?? `${dark}44`}`,
                              }}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              {isShortlisting ? 'Shortlisting...' : 'Shortlist'}
                            </button>
                            {application.status === 'hired' ? (
                              <button
                                type="button"
                                onClick={() => setPendingApplicationAction({ applicationId: application.id, kind: 'revoke' })}
                                disabled={isShortlisting || isHiring}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-40"
                                style={{
                                  color: dark,
                                  backgroundColor: fg,
                                  border: `0.5px solid ${borderColor ?? `${dark}44`}`,
                                }}
                              >
                                <UserX className="w-3.5 h-3.5" />
                                {isShortlisting ? 'Revoking...' : 'Revoke'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingApplicationAction({ applicationId: application.id, kind: 'reject' })}
                                disabled={isShortlisting || isHiring || application.status === 'rejected'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-40"
                                style={{
                                  color: dark,
                                  backgroundColor: fg,
                                  border: `0.5px solid ${borderColor ?? `${dark}44`}`,
                                }}
                              >
                                <UserX className="w-3.5 h-3.5" />
                                {isShortlisting ? 'Rejecting...' : 'Reject'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPendingApplicationAction({ applicationId: application.id, kind: 'assign' })}
                              disabled={
                                isHiring ||
                                isShortlisting ||
                                application.status === 'withdrawn' ||
                                !hireLeadId ||
                                (!!hiredApplication && hiredApplication.id !== application.id)
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-40"
                              style={{
                                color: dark,
                                backgroundColor: fg,
                                border: `0.5px solid ${borderColor ?? `${dark}44`}`,
                              }}
                            >
                              <UserRound className="w-3.5 h-3.5" />
                              {isHiring
                                ? 'Assigning...'
                                : hiredApplication?.id === application.id
                                  ? 'Assigned'
                                  : 'Assign'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {visibleApplications.length === 0 && (
                    <Text variant="sm" className="opacity-75" style={{ color: dark }}>
                      No applications in this status.
                    </Text>
                  )}
                </div>
              </Card>
            </section>
          )}

          {/* Timeline — Gantt-style diagram (phases / milestones by date); fills remaining space */}
          {isInternalProject && (
          <section className="flex-1 min-h-0 flex flex-col mb-6 rounded-base overflow-hidden" style={{ backgroundColor: fg }}>
            <p className="text-sm opacity-70 font-medium mb-4 shrink-0 px-4 pt-4" style={{ fontSize: baseFontSize * 0.9, color: dark }}>
              Timeline
            </p>
            <div className="flex-1 min-h-0 flex flex-col rounded-base overflow-hidden px-4 pb-4">
              <ProjectTimelineGantt
                project={project}
                milestones={milestones}
                tasks={tasks}
                userMap={userMap}
                users={users}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                dark={dark ?? '#111'}
                fg={fg ?? '#fff'}
                bg={bg ?? '#f4f4f4'}
                borderColor={borderColor}
                darkMode={darkMode}
                doneStateId={DONE_STATE_ID}
                successColor={current?.system?.success}
                currentUserId={user?.id}
              />
            </div>
          </section>
          )}

        </div>
      </div>

      {/* Chat toggle: top-left when sidebar closed; toggles sidebar with animation */}
      <AnimatePresence initial={false}>
        {isInternalProject && chatSidebarOpen ? (
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
              participantCount={chatParticipantCount}
              comments={comments}
              userMap={userMap}
              userAvatarMap={userAvatarMap}
              lastSeenByAuthor={chatLastSeenByAuthor}
              adminUserIds={chatAdminUserIds}
              leadUserIds={chatLeadUserIds}
              currentUserId={user?.id}
              newComment={newComment}
              onNewCommentChange={setNewComment}
              sending={commentSending}
              onSend={handleAddComment}
              participants={users.filter((u) => chatParticipantIds.includes(u.id)).map((u) => ({
                id: u.id,
                name: u.name,
                avatarUrl: u.avatarUrl,
                role: u.role,
              }))}
              projectDescription={project.description ?? undefined}
              onSaveGroupSettings={async (payload) => {
                if (!id) return
                await projectService.update(id, { name: payload.name, description: payload.description || undefined })
                loadData()
              }}
              onLeaveGroup={() => setChatSidebarOpen(false)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Modal open={isInternalProject && addMilestoneOpen} onClose={() => !saving && setAddMilestoneOpen(false)}>
        <div className="p-6 flex flex-col" style={{ backgroundColor: current?.system?.foreground }}>
          <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize, color: dark }}>Add milestone</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="e.g. Design complete"
              value={milestoneName}
              onChange={(e) => setMilestoneName(e.target.value)}
            />
            <DateSelectInput
              label="Target date"
              value={milestoneTarget}
              onChange={setMilestoneTarget}
              yearMax={new Date().getFullYear() + 10}
              order="dmy"
            />
            <CustomSelect
              label="Priority"
              options={priorityOptions}
              value={milestonePriority}
              onChange={(v) => setMilestonePriority(v || 'medium')}
              placement="below"
            />
            {!isExternalOriginInternalProject && (
              <div>
                <label className="block mb-1"><Text variant="sm" style={{ color: dark }}>Assigned employees</Text></label>
                <div className="flex gap-3 overflow-x-auto scroll-slim pb-1 -mx-0.5" style={{ minHeight: 168 }}>
                  {users.map((u) => {
                    const selected = milestoneAssigneeIds.includes(u.id)
                    const roleLabel = u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null
                    const initials = u.name.trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?'
                    return (
                      <label
                        key={u.id}
                        className="relative flex-shrink-0 w-[120px] aspect-[3/4] rounded-xl overflow-hidden cursor-pointer block transition hover:opacity-95"
                        style={{
                          boxShadow: borderColor ? `0 0 0 1px ${borderColor}` : undefined,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) setMilestoneAssigneeIds((prev) => [...prev, u.id])
                            else setMilestoneAssigneeIds((prev) => prev.filter((id) => id !== u.id))
                          }}
                          className="sr-only"
                          aria-label={`Assign ${u.name}`}
                        />
                        <div className="absolute inset-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-medium text-3xl"
                              style={{
                                backgroundColor: bg ?? 'rgba(0,0,0,0.08)',
                                color: primaryColor,
                              }}
                            >
                              {initials}
                            </div>
                          )}
                        </div>
                        <div
                          className="absolute inset-x-0 bottom-0 pt-8 pb-2 px-2 text-white text-xs"
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                          }}
                        >
                          <p className="font-medium truncate">{u.name}</p>
                          {roleLabel && <p className="truncate opacity-90">{roleLabel}</p>}
                        </div>
                        {selected && (
                          <span
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: fg, color: primaryColor }}
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </span>
                        )}
                      </label>
                    )
                  })}
                  {users.length === 0 && (
                    <span className="text-sm opacity-70 flex items-center" style={{ color: dark }}>No users loaded</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t" style={{ borderColor }}>
            <Button variant="background" label="Cancel" onClick={() => !saving && setAddMilestoneOpen(false)} disabled={saving} />
            <Button label="Add milestone" onClick={handleAddMilestone} disabled={saving || !milestoneName.trim() || !milestoneTarget} />
          </footer>
        </div>
      </Modal>

      {/* Add task modal */}
      <Modal open={isInternalProject && addTaskOpen} onClose={() => !saving && setAddTaskOpen(false)}>
        <div className="p-6 flex flex-col" style={{ backgroundColor: current?.system?.foreground }}>
          <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize, color: dark }}>Add task</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1"><Text variant="sm" style={{ color: dark }}>Title</Text></label>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full px-3 py-2 rounded-base border bg-transparent focus:outline-none focus:ring-2"
                style={{ fontSize: baseFontSize, color: dark, borderColor: current?.system?.border }}
              />
            </div>
            <CustomSelect
              label="Milestone"
              options={milestoneOptions}
              value={taskMilestoneId}
              onChange={(v) => setTaskMilestoneId(v || '')}
              placement="below"
            />
            <CustomSelect
              label="Assignee"
              options={userOptions}
              value={taskOwnerId}
              onChange={(v) => setTaskOwnerId(v || '')}
              placeholder="Select assignee"
              placement="below"
            />
            <CustomSelect
              label="Priority"
              options={priorityOptions}
              value={taskPriority}
              onChange={(v) => setTaskPriority(v || 'medium')}
              placement="below"
            />
            <div>
              <label className="block mb-1"><Text variant="sm" style={{ color: dark }}>Due date (optional)</Text></label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-base border bg-transparent focus:outline-none focus:ring-2"
                style={{ fontSize: baseFontSize, color: dark, borderColor: current?.system?.border }}
              />
            </div>
          </div>
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t" style={{ borderColor }}>
            <Button variant="background" label="Cancel" onClick={() => !saving && setAddTaskOpen(false)} disabled={saving} />
            <Button label="Add task" onClick={handleAddTask} disabled={saving || !taskTitle.trim() || !taskOwnerId} />
          </footer>
        </div>
      </Modal>

      <EditProjectModal
        open={isInternalProject && editOpen}
        onClose={() => setEditOpen(false)}
        saving={editSaving}
        name={editName}
        description={editDescription}
        leadId={editLeadId}
        dueDate={editDueDate}
        onDueDateChange={setEditDueDate}
        onNameChange={setEditName}
        onDescriptionChange={setEditDescription}
        onLeadIdChange={setEditLeadId}
        onSubmit={handleEditSave}
        leadOptions={leadOptions}
      />

      <DeleteProjectModal
        project={deleteOpen ? projectWithMeta : null}
        open={isInternalProject && deleteOpen}
        onClose={() => setDeleteOpen(false)}
        saving={actionSaving}
        onConfirm={handleDeleteConfirm}
      />

      <SuspendProjectModal
        project={suspendOpen ? suspendModalProject : null}
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        saving={actionSaving}
        onConfirm={handleSuspendConfirm}
      />

      <ProjectListAnalyticsModal
        open={isInternalProject && analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        chartDataByProject={analyticsChartData}
        trendData={analyticsTrendData}
        chartColors={analyticsChartColors}
      />

      <Modal open={isInternalProject && boardOpen} onClose={() => setBoardOpen(false)} variant="fullscreen">
        <BoardModal onClose={() => setBoardOpen(false)} initialProjectId={project.id} />
      </Modal>

      <ProjectFilesModal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} projectId={filesProjectId} />

      <Modal
        open={!!pendingApplicationAction}
        onClose={() => !confirmActionLoading && setPendingApplicationAction(null)}
      >
        <div className="p-6 flex flex-col" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-3" style={{ fontSize: baseFontSize, color: dark }}>
            Confirm action
          </h2>
          <Text variant="sm" className="opacity-85" style={{ color: dark }}>
            {pendingApplicationAction?.kind === 'shortlist' && 'Shortlist this freelancer application?'}
            {pendingApplicationAction?.kind === 'reject' && 'Reject this freelancer application?'}
            {pendingApplicationAction?.kind === 'revoke' && 'Revoke this hire and move application back to shortlisted?'}
            {pendingApplicationAction?.kind === 'assign' && 'Assign this freelancer to the project and create assignment?'}
          </Text>
          {pendingActionApplication && (
            <Text variant="sm" className="opacity-75 mt-2" style={{ color: dark }}>
              Candidate: {getFreelancerProfile(pendingActionApplication.freelancerId)?.name ?? 'Freelancer'}
            </Text>
          )}
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t" style={{ borderColor }}>
            <Button
              variant="background"
              label="Cancel"
              onClick={() => setPendingApplicationAction(null)}
              disabled={confirmActionLoading}
            />
            <Button
              label={pendingApplicationAction?.kind === 'assign' ? 'Confirm assign' : 'Confirm'}
              onClick={handleConfirmApplicationAction}
              loading={confirmActionLoading}
              disabled={confirmActionLoading}
            />
          </footer>
        </div>
      </Modal>

      {isInternalProject && user?.role === 'consultant' && (
        <LogTimeModal
          open={logTimeModalOpen}
          onClose={() => setLogTimeModalOpen(false)}
          onSaved={() => loadData()}
          initialProjectId={id ?? undefined}
          initialMilestoneId={milestones[0]?.id ?? undefined}
        />
      )}

      {isInternalProject && !isContributor && (
        <ProjectBillingModal
          open={billingOpen}
          onClose={() => setBillingOpen(false)}
          projectId={project.id}
          projectName={project.name}
        />
      )}
    </div>
  )
}

export default ProjectDetail
