import { useEffect, useMemo, useState, type DragEvent } from 'react'
import Text, { baseFontSize } from '../../components/base/Text'
import { Button, Card, DatePicker, Modal, EmptyState } from '../../components/ui'
import Avatar from '../../components/base/Avatar'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { billingService, userService, milestoneService, projectService, taskService } from '../../services'
import type { BillingMilestone, Invoice, Milestone, ProjectAssignment, Task, TimesheetEntry, User, WorkflowState } from '../../types'
import { FileText, Receipt, Shield, UserStar } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

function minutesToHours(m: number) {
  return Math.round((m / 60) * 100) / 100
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function ProjectBillingModal({ open, onClose, projectId, projectName }: Props) {
  const { current } = Themestore()
  const dark = current?.system?.dark

  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [selectedConsultantIds, setSelectedConsultantIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [approvedTimesheets, setApprovedTimesheets] = useState<TimesheetEntry[]>([])
  const [milestones, setMilestones] = useState<BillingMilestone[]>([])
  const [includedMilestoneIds, setIncludedMilestoneIds] = useState<string[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  // User data for enhanced consultant cards
  const [users, setUsers] = useState<User[]>([])
  const [userMap, setUserMap] = useState<Record<string, User>>({})

  // Board milestones state
  const [boardMilestones, setBoardMilestones] = useState<Milestone[]>([])
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([])
  const [includedBoardMilestoneIds, setIncludedBoardMilestoneIds] = useState<string[]>([])

  // Drag state
  const [draggingType, setDraggingType] = useState<'consultant' | 'milestone' | 'boardMilestone' | null>(null)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [billingMode, setBillingMode] = useState<'hourly' | 'fixed'>('hourly')
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null)
  const [bulkNotice, setBulkNotice] = useState('')
  const [generateMode, setGenerateMode] = useState<'assignment' | 'project'>('assignment')

  const availableConsultants = useMemo(() => {
    const seen = new Set<string>()
    return assignments.filter((a) => {
      if (seen.has(a.freelancerId)) return false
      seen.add(a.freelancerId)
      return true
    })
  }, [assignments])

  const selectedConsultants = useMemo(
    () => availableConsultants.filter((a) => selectedConsultantIds.includes(a.freelancerId)),
    [availableConsultants, selectedConsultantIds]
  )

  const selectedAssignment = useMemo(() => {
    if (generateMode !== 'assignment') return null
    const freelancerId = selectedConsultantIds[0]
    return availableConsultants.find((a) => a.freelancerId === freelancerId) ?? null
  }, [availableConsultants, selectedConsultantIds, generateMode])

  const availableMilestones = useMemo(
    () => milestones.filter((m) => m.status === 'approved' && !includedMilestoneIds.includes(m.id)),
    [milestones, includedMilestoneIds]
  )

  const includedMilestones = useMemo(
    () => milestones.filter((m) => includedMilestoneIds.includes(m.id)),
    [milestones, includedMilestoneIds]
  )



  const milestoneSubtotal = useMemo(() => {
    // For fixed billing, use milestone amounts
    // For hourly billing, milestone amounts are not used in calculation
    if (billingMode === 'fixed') {
      return includedMilestones.reduce((sum, m) => sum + (m.amount ?? 0), 0)
    }
    return 0
  }, [includedMilestones, billingMode])

  // Board milestones computed values
  const lastWorkflowStateId = useMemo(() => {
    if (workflowStates.length === 0) return ''
    return workflowStates.reduce((prev, curr) => (prev.order > curr.order ? prev : curr)).id
  }, [workflowStates])

  const availableBoardMilestones = useMemo(
    () =>
      boardMilestones.filter(
        (m) =>
          (m.workflowStateId === lastWorkflowStateId || !m.workflowStateId) &&
          !includedBoardMilestoneIds.includes(m.id)
      ),
    [boardMilestones, lastWorkflowStateId, includedBoardMilestoneIds]
  )

  const includedBoardMilestones = useMemo(
    () => boardMilestones.filter((m) => includedBoardMilestoneIds.includes(m.id)),
    [boardMilestones, includedBoardMilestoneIds]
  )

  const approvedHours = useMemo(() => {
    // Calculate hours from milestone summary data for the selected consultant
    if (!selectedAssignment) return 0

    // Use summary data from billing milestones if available
    const billingHours = includedMilestones.reduce((sum, m) => {
      if (!m.summary) return sum
      const userSummary = m.summary.find(s => s.userId === selectedAssignment.freelancerId)
      return sum + (userSummary?.totalDuration ?? 0)
    }, 0)

    // Use summary data from board milestones if available
    const boardHours = includedBoardMilestones.reduce((sum, m) => {
      if (!m.summary) return sum
      const userSummary = m.summary.find(s => s.userId === selectedAssignment.freelancerId)
      return sum + (userSummary?.totalDuration ?? 0)
    }, 0)

    const totalHours = billingHours + boardHours

    // Debug logging
    console.log('Billing Calculation Debug:', {
      selectedAssignment: selectedAssignment.freelancerId,
      includedMilestoneIds,
      includedBoardMilestoneIds,
      billingHours,
      boardHours,
      totalHours,
      milestonesWithSummary: includedMilestones.filter(m => m.summary && m.summary.length > 0).length,
      boardMilestonesWithSummary: includedBoardMilestones.filter(m => m.summary && m.summary.length > 0).length,
    })

    return Math.round(totalHours * 100) / 100
  }, [includedMilestones, includedBoardMilestones, selectedAssignment])

  const hourlySubtotal = useMemo(() => {
    if (!selectedAssignment || !selectedAssignment.hourlyRate) return 0
    return Math.round(approvedHours * selectedAssignment.hourlyRate)
  }, [approvedHours, selectedAssignment])

  // Board milestones don't have an amount field - calculate from milestone summary
  // For hourly billing: sum of task durations * hourly rate
  // For fixed billing: sum of task estimates (if available)
  const boardMilestoneSubtotal = useMemo(() => {
    if (!selectedAssignment) return 0

    // Use summary data from board milestones if available
    const totalHours = includedBoardMilestones.reduce((sum, m) => {
      if (!m.summary) return sum
      const userSummary = m.summary.find(s => s.userId === selectedAssignment.freelancerId)
      return sum + (userSummary?.totalDuration ?? 0)
    }, 0)

    if (billingMode === 'hourly') {
      return selectedAssignment.hourlyRate ? Math.round(totalHours * selectedAssignment.hourlyRate) : 0
    }

    // For fixed billing, use total hours as estimate
    return Math.round(totalHours * 100) / 100
  }, [includedBoardMilestones, selectedAssignment, billingMode])

  const estimatedTotal = useMemo(() => {
    if (billingMode === 'hourly') {
      return Math.round((hourlySubtotal + boardMilestoneSubtotal) * 100) / 100
    }
    return Math.round((milestoneSubtotal + boardMilestoneSubtotal) * 100) / 100
  }, [hourlySubtotal, milestoneSubtotal, boardMilestoneSubtotal, billingMode])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setLastInvoice(null)
    setIncludedMilestoneIds([])
    setIncludedBoardMilestoneIds([])
    setSelectedConsultantIds([])
    setBulkNotice('')
      ; (async () => {
        try {
          const [list, userList, workflow, boardMs] = await Promise.all([
            billingService.listProjectAssignments(projectId),
            userService.list(),
            projectService.getWorkflow(projectId),
            milestoneService.listByProject(projectId),
          ])
          setAssignments(list)
          setUsers(userList)
          setUserMap(Object.fromEntries(userList.map((u) => [u.id, u])))
          setWorkflowStates(workflow?.states ?? [])
          setBoardMilestones(boardMs)
        } finally {
          setLoading(false)
        }
      })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId])

  const reloadDetails = async (aid: string) => {
    if (!aid) return
    setLoading(true)
    try {
      const ms = await billingService.listMilestones(aid)
      setMilestones(ms)
      setIncludedMilestoneIds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !selectedAssignment?.id) return
    reloadDetails(selectedAssignment.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedAssignment?.id])

  // Load tasks when consultant is selected or milestones change
  useEffect(() => {
    if (!open || !selectedAssignment?.id) {
      setTasks([])
      return
    }
    ; (async () => {
      try {
        const allTasks: Task[] = []

        // Load tasks for selected billing milestones
        for (const milestoneId of includedMilestoneIds) {
          const milestoneTasks = await taskService.listByMilestone(milestoneId)
          allTasks.push(...milestoneTasks)
        }

        // Load tasks for selected board milestones
        for (const milestoneId of includedBoardMilestoneIds) {
          const milestoneTasks = await taskService.listByMilestone(milestoneId)
          allTasks.push(...milestoneTasks)
        }

        // Remove duplicates
        const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values())
        setTasks(uniqueTasks)
      } catch {
        setTasks([])
      }
    })()
  }, [open, selectedAssignment?.id, includedMilestoneIds, includedBoardMilestoneIds])

  useEffect(() => {
    if (!open || !selectedAssignment?.id) return
      ; (async () => {
        try {
          const approved = await billingService.listTimesheets(selectedAssignment.id, {
            status: 'approved',
            from: from || undefined,
            to: to || undefined,
          })
          setApprovedTimesheets(approved)
        } catch {
          setApprovedTimesheets([])
        }
      })()
  }, [open, selectedAssignment?.id, from, to])


  const generateInvoice = async () => {
    setLoading(true)
    setBulkNotice('')
    try {
      if (generateMode === 'project') {
        const companyId = Authstore.getState().user?.companyId
        if (!companyId) {
          setBulkNotice('Company context unavailable; cannot generate project invoices')
          return
        }
        const allConsultants = Array.from(new Set(assignments.map((a) => a.freelancerId))).filter(Boolean)
        const invoices = await billingService.generateBulkInvoices(companyId, {
          consultants: selectedConsultantIds.length ? selectedConsultantIds : allConsultants.length > 0 ? allConsultants : undefined,
          from: from || '',
          to: to || '',
          hybridChoice: billingMode,
        })
        setBulkNotice(`${invoices.length} invoices generated`)
        if (invoices.length > 0) {
          setLastInvoice(invoices[0])
        }
      } else {
        if (!selectedAssignment?.id) {
          setBulkNotice('Select exactly one consultant for assignment invoice')
          return
        }
        // Reload tasks to ensure we have the latest data before generating invoice
        if (includedMilestoneIds.length > 0) {
          try {
            const allTasks: Task[] = []
            for (const milestoneId of includedMilestoneIds) {
              const milestoneTasks = await taskService.listByMilestone(milestoneId)
              allTasks.push(...milestoneTasks)
            }
            setTasks(allTasks)
          } catch {
            setTasks([])
          }
        }
        const payload: { from?: string; to?: string; milestoneIds?: string[] } = {
          from: from || undefined,
          to: to || undefined,
        }
        // Include both billing milestones and board milestones
        const allMilestoneIds = [...includedMilestoneIds, ...includedBoardMilestoneIds]
        if (allMilestoneIds.length > 0) {
          payload.milestoneIds = allMilestoneIds
        }
        const inv = await billingService.generateInvoice(selectedAssignment.id, payload)
        setLastInvoice(inv)
        await reloadDetails(selectedAssignment.id)
        setBulkNotice(`Invoice total estimate: ${inv.amount} ${selectedAssignment.currency}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const moveConsultantToSelected = (freelancerId: string) => {
    setSelectedConsultantIds((prev) => Array.from(new Set([...prev, freelancerId])))
  }

  const removeConsultantFromSelected = (freelancerId: string) => {
    setSelectedConsultantIds((prev) => prev.filter((id) => id !== freelancerId))
  }

  const addMilestone = (milestoneId: string) => {
    setIncludedMilestoneIds((prev) => Array.from(new Set([...prev, milestoneId])))
  }

  const removeMilestone = (milestoneId: string) => {
    setIncludedMilestoneIds((prev) => prev.filter((id) => id !== milestoneId))
  }

  const addBoardMilestone = (milestoneId: string) => {
    setIncludedBoardMilestoneIds((prev) => Array.from(new Set([...prev, milestoneId])))
  }

  const removeBoardMilestone = (milestoneId: string) => {
    setIncludedBoardMilestoneIds((prev) => prev.filter((id) => id !== milestoneId))
  }

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    type: 'consultant' | 'milestone' | 'boardMilestone',
    id: string
  ) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({ type, id }))
    setDraggingType(type)
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    targetType: 'consultant' | 'milestone' | 'boardMilestone',
    targetList: 'available' | 'selected'
  ) => {
    event.preventDefault()
    const data = event.dataTransfer.getData('text/plain')
    try {
      const parsed = JSON.parse(data)
      // For milestone drop zones, accept both 'milestone' and 'boardMilestone' types
      const isMilestoneDrop = targetType === 'milestone' && (parsed.type === 'milestone' || parsed.type === 'boardMilestone')
      if (parsed.type !== targetType && !isMilestoneDrop) return
      if (targetType === 'consultant') {
        const freelancerId = parsed.id as string
        if (targetList === 'selected') moveConsultantToSelected(freelancerId)
        else removeConsultantFromSelected(freelancerId)
      } else if (isMilestoneDrop) {
        const milestoneId = parsed.id as string
        if (parsed.type === 'boardMilestone') {
          if (targetList === 'selected') addBoardMilestone(milestoneId)
          else removeBoardMilestone(milestoneId)
        } else {
          if (targetList === 'selected') addMilestone(milestoneId)
          else removeMilestone(milestoneId)
        }
      } else if (targetType === 'boardMilestone') {
        const milestoneId = parsed.id as string
        if (targetList === 'selected') addBoardMilestone(milestoneId)
        else removeBoardMilestone(milestoneId)
      }
    } catch {
      // ignore invalid drag data
    }
    setDraggingType(null)
  }

  const handleDragEnd = () => {
    setDraggingType(null)
  }

  return (
    <Modal open={open} onClose={() => !loading && onClose()} variant="wide">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15, color: dark }}>
              Billing • {projectName}
            </Text>
            <Text variant="sm" className="opacity-75" style={{ color: dark }}>
              Drag consultant profiles and approved milestones into the selected panel, then generate invoices.
            </Text>
          </div>
          <Button label="Close" variant="background" onClick={onClose} />
        </div>

        <Card className="p-4">
          <Text className="font-semibold mb-3">Consultants</Text>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div
              className="rounded-base border border-dashed border-slate-500/40 p-3 min-h-[260px]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event as unknown as DragEvent<HTMLDivElement>, 'consultant', 'available')}
            >
              <Text className="font-semibold mb-3">Available consultants</Text>
              {availableConsultants.length === 0 ? (
                <EmptyState variant="users" compact description="No consultants found." className="py-4 px-0" />
              ) : (
                <div className="space-y-3">
                  {availableConsultants
                    .filter((a) => !selectedConsultantIds.includes(a.freelancerId))
                    .map((a) => {
                      const user = userMap[a.freelancerId]
                      const isOnline = user?.lastSeen === 'online'
                      const isAdmin = user?.role === 'company_admin' || user?.role === 'super_admin'
                      const isLead = user?.role === 'project_lead'

                      return (
                        <div
                          key={a.freelancerId}
                          draggable
                          onDragStart={(event) => handleDragStart(event, 'consultant', a.freelancerId)}
                          onDragEnd={handleDragEnd}
                          className="group flex items-center gap-3 rounded-base border border-slate-600/10 p-3 cursor-grab transition hover:border-brand"
                        >
                          <div className="relative shrink-0">
                            <Avatar
                              name={user?.name ?? a.freelancerName ?? a.freelancerId}
                              src={user?.avatarUrl}
                              size="md"
                            />
                            {isLead && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-sm"
                                style={{
                                  backgroundColor: current?.system?.foreground,
                                  color: current?.brand?.primary,
                                  borderColor: current?.system?.border ?? 'rgba(255,255,255,0.5)',
                                }}
                                aria-hidden
                              >
                                <UserStar className="w-4 h-4" />
                              </span>
                            )}
                            {!isLead && isAdmin && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-sm"
                                style={{
                                  backgroundColor: current?.system?.foreground,
                                  color: current?.brand?.primary,
                                  borderColor: current?.system?.border ?? 'rgba(255,255,255,0.5)',
                                }}
                                aria-hidden
                              >
                                <Shield className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Text variant="sm" className="font-semibold truncate">
                              {user?.name ?? a.freelancerName ?? `Consultant ${a.freelancerId.slice(0, 8)}…`}
                            </Text>
                            <div className="flex items-center gap-1.5">
                              {isOnline && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden />}
                              <Text variant="sm" className="opacity-75 truncate">
                                {a.billingType.toUpperCase()} • {a.currency}
                              </Text>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            <div
              className="rounded-base border border-dashed border-slate-500/40 p-3 min-h-[260px]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event as unknown as DragEvent<HTMLDivElement>, 'consultant', 'selected')}
            >
              <Text className="font-semibold mb-3">Selected consultants</Text>
              {selectedConsultants.length === 0 ? (
                <EmptyState variant="users" compact description="Drag a consultant here to include." className="py-4 px-0" />
              ) : (
                <div className="space-y-3">
                  {selectedConsultants.map((a) => {
                    const user = userMap[a.freelancerId]
                    const isOnline = user?.lastSeen === 'online'
                    const isAdmin = user?.role === 'company_admin' || user?.role === 'super_admin'
                    const isLead = user?.role === 'project_lead'

                    return (
                      <div
                        key={a.freelancerId}
                        draggable
                        onDragStart={(event) => handleDragStart(event, 'consultant', a.freelancerId)}
                        onDragEnd={handleDragEnd}
                        className="group flex items-center gap-3 rounded-base border border-slate-600/10 p-3 cursor-grab transition hover:border-brand"
                      >
                        <div className="relative shrink-0">
                          <Avatar
                            name={user?.name ?? a.freelancerName ?? a.freelancerId}
                            src={user?.avatarUrl}
                            size="md"
                          />
                          {isLead && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-sm"
                              style={{
                                backgroundColor: current?.system?.foreground,
                                color: current?.brand?.primary,
                                borderColor: current?.system?.border ?? 'rgba(255,255,255,0.5)',
                              }}
                              aria-hidden
                            >
                              <UserStar className="w-4 h-4" />
                            </span>
                          )}
                          {!isLead && isAdmin && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-sm"
                              style={{
                                backgroundColor: current?.system?.foreground,
                                color: current?.brand?.primary,
                                borderColor: current?.system?.border ?? 'rgba(255,255,255,0.5)',
                              }}
                              aria-hidden
                            >
                              <Shield className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Text variant="sm" className="font-semibold truncate">
                            {user?.name ?? a.freelancerName ?? `Consultant ${a.freelancerId.slice(0, 8)}…`}
                          </Text>
                          <div className="flex items-center gap-1.5">
                            {isOnline && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden />}
                            <Text variant="sm" className="opacity-75 truncate">
                              {a.billingType.toUpperCase()} • {a.currency}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          {generateMode === 'assignment' && selectedConsultantIds.length !== 1 && (
            <Text variant="sm" className="opacity-75 mt-3">
              Select exactly one consultant to generate a single assignment invoice.
            </Text>
          )}
          {generateMode === 'assignment' && selectedAssignment && (
            <div className="mt-3 p-3 rounded-base border" style={{ borderColor: current?.system?.border }}>
              <Text variant="sm" className="font-semibold mb-2">Selected consultant</Text>
              <div className="flex items-center justify-between">
                <Text variant="sm" className="opacity-75">
                  {selectedAssignment.freelancerName || `Consultant ${selectedAssignment.freelancerId.slice(0, 8)}…`}
                </Text>
                <Text variant="sm" className="font-medium">
                  {selectedAssignment.billingType.toUpperCase()} • {selectedAssignment.currency}
                </Text>
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Milestones" subtitle="Choose milestones to include" className="p-4 lg:col-span-2">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div
                className="rounded-base border p-3"
                style={{ borderColor: current?.system?.border }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event as unknown as DragEvent<HTMLDivElement>, 'milestone', 'available')}
              >
                <Text className="font-semibold mb-3">Available milestones</Text>
                {availableMilestones.length === 0 && availableBoardMilestones.length === 0 ? (
                  <EmptyState variant="task" compact description="No milestones available." className="py-4 px-0" />
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {availableMilestones.map((m) => (
                      <div
                        key={m.id}
                        draggable
                        onDragStart={(event) => handleDragStart(event, 'milestone', m.id)}
                        onDragEnd={handleDragEnd}
                        className="w-full rounded-base border border-slate-600/10 px-3 py-2 cursor-grab transition hover:border-brand"
                      >
                        <Text variant="sm" className="font-medium">{m.title}</Text>
                        <Text variant="sm" className="opacity-75">{m.amount} {m.currency} • Approved</Text>
                      </div>
                    ))}
                    {availableBoardMilestones.map((m) => {
                      // Calculate amount for this board milestone
                      const milestoneTasks = tasks.filter(
                        (t) => t.ownerId === selectedAssignment?.freelancerId && t.milestoneId === m.id
                      )
                      let amount = 0
                      if (billingMode === 'hourly') {
                        const totalMinutes = milestoneTasks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
                        const hours = Math.round((totalMinutes / 60) * 100) / 100
                        amount = selectedAssignment?.hourlyRate ? Math.round(hours * selectedAssignment.hourlyRate) : 0
                      } else {
                        const totalMinutes = milestoneTasks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
                        amount = Math.round((totalMinutes / 60) * 100) / 100
                      }
                      return (
                        <div
                          key={m.id}
                          draggable
                          onDragStart={(event) => handleDragStart(event, 'boardMilestone', m.id)}
                          onDragEnd={handleDragEnd}
                          className="w-full rounded-base border border-slate-600/10 px-3 py-2 cursor-grab transition hover:border-brand"
                        >
                          <Text variant="sm" className="font-medium">{m.name}</Text>
                          <Text variant="sm" className="opacity-75">
                            {amount > 0 ? `${amount} ${selectedAssignment?.currency ?? ''}` : 'Board milestone'}
                          </Text>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div
                className="rounded-base border p-3"
                style={{ borderColor: current?.system?.border }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event as unknown as DragEvent<HTMLDivElement>, 'milestone', 'selected')}
              >
                <Text className="font-semibold mb-3">Milestones to include</Text>
                {includedMilestones.length === 0 && includedBoardMilestones.length === 0 ? (
                  <EmptyState variant="task" compact description="Drag milestones here to include." className="py-4 px-0" />
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {includedMilestones.map((m) => (
                      <div
                        key={m.id}
                        draggable
                        onDragStart={(event) => handleDragStart(event, 'milestone', m.id)}
                        onDragEnd={handleDragEnd}
                        className="w-full rounded-base border border-slate-600/10 px-3 py-2 cursor-grab transition hover:border-brand"
                      >
                        <Text variant="sm" className="font-medium">{m.title}</Text>
                        <Text variant="sm" className="opacity-75">{m.amount} {m.currency}</Text>
                      </div>
                    ))}
                    {includedBoardMilestones.map((m) => {
                      // Calculate amount for this board milestone
                      const milestoneTasks = tasks.filter(
                        (t) => t.ownerId === selectedAssignment?.freelancerId && t.milestoneId === m.id
                      )
                      let amount = 0
                      if (billingMode === 'hourly') {
                        const totalMinutes = milestoneTasks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
                        const hours = Math.round((totalMinutes / 60) * 100) / 100
                        amount = selectedAssignment?.hourlyRate ? Math.round(hours * selectedAssignment.hourlyRate) : 0
                      } else {
                        const totalMinutes = milestoneTasks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
                        amount = Math.round((totalMinutes / 60) * 100) / 100
                      }
                      return (
                        <div
                          key={m.id}
                          draggable
                          onDragStart={(event) => handleDragStart(event, 'boardMilestone', m.id)}
                          onDragEnd={handleDragEnd}
                          className="w-full rounded-base border border-slate-600/10 px-3 py-2 cursor-grab transition hover:border-brand"
                        >
                          <Text variant="sm" className="font-medium">{m.name}</Text>
                          <Text variant="sm" className="opacity-75">
                            {amount > 0 ? `${amount} ${selectedAssignment?.currency ?? ''}` : 'Board milestone'}
                          </Text>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card title="Generate invoice" subtitle="Benchmarked: invoice from approved hours + milestones" className="p-4">
          <div className="grid grid-cols-1 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={generateMode === 'assignment' ? 'primary' : 'secondary'}
                label="Single consultant"
                onClick={() => setGenerateMode('assignment')}
              />
              <Button
                size="sm"
                variant={generateMode === 'project' ? 'primary' : 'secondary'}
                label="Project invoices"
                onClick={() => setGenerateMode('project')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={billingMode === 'hourly' ? 'primary' : 'secondary'}
                label="Hourly"
                onClick={() => setBillingMode('hourly')}
              />
              <Button
                size="sm"
                variant={billingMode === 'fixed' ? 'primary' : 'secondary'}
                label="Fixed"
                onClick={() => setBillingMode('fixed')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DatePicker label="From" value={from} onChange={setFrom} />
              <DatePicker label="To" value={to} onChange={setTo} />
              <div className="flex items-end">
                <Button
                  label={generateMode === 'project' ? 'Generate all invoices' : 'Generate invoice'}
                  startIcon={<Receipt className="w-4 h-4 shrink-0" />}
                  onClick={generateInvoice}
                  disabled={loading || (generateMode === 'assignment' && selectedConsultantIds.length !== 1)}
                  loading={loading}
                />
              </div>
            </div>
          </div>

          {/* Warning for milestones with no summary data */}
          {billingMode === 'hourly' && (includedMilestones.filter(m => !m.summary || m.summary.length === 0).length > 0 || includedBoardMilestones.filter(m => !m.summary || m.summary.length === 0).length > 0) && (
            <div className="mb-3 p-2 rounded-base border border-yellow-500/50 bg-yellow-500/10">
              <Text variant="sm" className="text-yellow-600">
                ⚠️ {includedMilestones.filter(m => !m.summary || m.summary.length === 0).length + includedBoardMilestones.filter(m => !m.summary || m.summary.length === 0).length} milestone(s) have no task duration data.
                These will not be included in the hourly calculation.
              </Text>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 border-t pt-4" style={{ borderColor: current?.system?.border }}>
            <div>
              <Text variant="sm" className="opacity-80">
                {billingMode === 'hourly' ? 'Task hours' : 'Milestone amount'}
              </Text>
              <Text className="font-semibold">
                {billingMode === 'hourly' ? `${approvedHours}h` : `${milestoneSubtotal} ${selectedAssignment?.currency}`}
              </Text>
              {billingMode === 'hourly' && selectedAssignment?.hourlyRate ? (
                <Text variant="sm" className="opacity-75">Rate: {selectedAssignment.hourlyRate} {selectedAssignment.currency}</Text>
              ) : null}
              {billingMode === 'hourly' && (includedMilestones.length > 0 || includedBoardMilestones.length > 0) && (
                <Text variant="sm" className="opacity-75">From {includedMilestones.length + includedBoardMilestones.length} milestone(s)</Text>
              )}
            </div>
            <div>
              <Text variant="sm" className="opacity-80">Selected milestones</Text>
              <Text className="font-semibold">{includedMilestones.length + includedBoardMilestones.length} items</Text>
              <Text variant="sm" className="opacity-75">
                {billingMode === 'fixed' && `Billing: ${milestoneSubtotal} ${selectedAssignment?.currency}`}
                {billingMode === 'hourly' && `Billing: ${milestoneSubtotal} ${selectedAssignment?.currency}`}
                {includedBoardMilestones.length > 0 && ` • Board: ${boardMilestoneSubtotal} ${selectedAssignment?.currency}`}
              </Text>
            </div>
            <div>
              <Text variant="sm" className="opacity-80">Estimated total</Text>
              <Text className="font-semibold">{estimatedTotal} {selectedAssignment?.currency}</Text>
              <Text variant="sm" className="opacity-75">
                {billingMode === 'hourly' ? 'Hours × Rate' : 'Milestone amounts'}
              </Text>
            </div>
          </div>

          {generateMode === 'project' && selectedConsultantIds.length > 0 && (
            <div className="mt-4 p-3 rounded-base border" style={{ borderColor: current?.system?.border }}>
              <Text variant="sm" className="font-semibold mb-2">Selected consultants summary</Text>
              <div className="space-y-1">
                {selectedConsultantIds.map((id) => {
                  const consultant = availableConsultants.find((c) => c.freelancerId === id)
                  if (!consultant) return null
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <Text variant="sm" className="opacity-75">
                        {consultant.freelancerName || `Consultant ${id.slice(0, 8)}…`}
                      </Text>
                      <Text variant="sm" className="font-medium">
                        {consultant.billingType.toUpperCase()} • {consultant.currency}
                      </Text>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {bulkNotice && (
            <Text variant="sm" className="opacity-85 mt-2" style={{ color: current?.system?.foreground || '#666' }}>
              {bulkNotice}
            </Text>
          )}

          {lastInvoice && (
            <div className="mt-3 flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5" style={{ color: current?.system?.success }} />
              <div className="min-w-0">
                <Text variant="sm" className="font-medium">Invoice created: {lastInvoice.number}</Text>
                <Text variant="sm" className="opacity-75">Amount: {lastInvoice.amount} {lastInvoice.currency} • Due {lastInvoice.dueDate}</Text>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Modal>
  )
}

