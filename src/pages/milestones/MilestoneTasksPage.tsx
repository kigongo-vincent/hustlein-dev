import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import Text, { baseFontSize } from '../../components/base/Text'
import { Card, Badge, Table, Modal, Button, Input, CustomSelect, DateSelectInput } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { milestoneService, projectService, taskService, userService } from '../../services'
import type { Milestone, Project, Task, WorkflowState } from '../../types'
import { getChartColors, formatDate } from '../projects/utils'
import { Themestore } from '../../data/Themestore'
import {
  ChevronLeft,
  ListTodo,
  CheckCircle,
  Loader2,
  Users,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import View from '../../components/base/View'
import Avatar from '../../components/base/Avatar'

const chartTickStyle = { fontSize: 12 }

const MilestoneTasksPage = () => {
  const { projectId, milestoneId } = useParams<{ projectId: string; milestoneId: string }>()
  const { current, mode } = Themestore()
  const dark = current?.system?.dark
  const primary = current?.brand?.primary ?? '#682308'
  const secondary = current?.brand?.secondary ?? '#FF9600'
  const borderColor = current?.system?.border
  const fg = current?.system?.foreground
  const gridColor = dark ? `${dark}40` : 'rgba(0,0,0,0.08)'
  const tickProps = dark ? { ...chartTickStyle, fill: dark } : chartTickStyle
  const tooltipContentStyle = {
    fontSize: 13.5,
    backgroundColor: fg ?? undefined,
    border: `1px solid ${borderColor ?? 'rgba(0,0,0,0.1)'}`,
    borderRadius: 4,
    color: dark,
  }
  const tooltipCursor =
    mode === 'dark'
      ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)', stroke: borderColor ?? 'rgba(255,255,255,0.08)' }
      : { fill: 'rgba(0,0,0,0.04)', stroke: borderColor ?? 'rgba(0,0,0,0.1)' }

  const [milestone, setMilestone] = useState<Milestone | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; avatarUrl?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editOwnerId, setEditOwnerId] = useState('')
  const [editPriority, setEditPriority] = useState<string>('medium')
  const [editStateId, setEditStateId] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [actionSaving, setActionSaving] = useState(false)

  const loadTasks = useCallback(() => {
    if (!milestoneId) return
    taskService.listByMilestone(milestoneId).then(setTasks)
  }, [milestoneId])

  useEffect(() => {
    if (!projectId || !milestoneId) return
    setLoading(true)
    Promise.all([
      milestoneService.get(milestoneId),
      projectService.get(projectId),
      taskService.listByMilestone(milestoneId),
      projectService.getWorkflow(projectId).then((w) => w?.states ?? []),
      userService.list().then((list) =>
        list.map((u) => ({ id: u.id, name: u.name ?? u.email, avatarUrl: u.avatarUrl }))
      ),
    ])
      .then(([m, p, t, states, u]) => {
        setMilestone(m ?? null)
        setProject(p ?? null)
        setTasks(t)
        setWorkflowStates(states)
        setUsers(u)
      })
      .finally(() => setLoading(false))
  }, [projectId, milestoneId])

  const stateName = (stateId: string) =>
    workflowStates.find((s) => s.id === stateId)?.name ?? 'Unknown'

  const doneStateIds = useMemo(
    () =>
      new Set(
        workflowStates
          .filter((s) => /done|complete/i.test(s.name))
          .map((s) => s.id)
      ),
    [workflowStates]
  )

  const completedCount = useMemo(
    () => tasks.filter((t) => doneStateIds.has(t.workflowStateId)).length,
    [tasks, doneStateIds]
  )
  const inProgressCount = tasks.length - completedCount
  const assigneeIds = useMemo(
    () => [...new Set(tasks.map((t) => t.ownerId).filter(Boolean))],
    [tasks]
  )

  const contributionData = useMemo(() => {
    const byOwner: Record<string, number> = {}
    tasks.forEach((t) => {
      const id = t.ownerId || 'Unassigned'
      byOwner[id] = (byOwner[id] ?? 0) + 1
    })
    return Object.entries(byOwner)
      .map(([ownerId, count]) => ({
        name: users.find((u) => u.id === ownerId)?.name ?? 'Unknown user',
        ownerId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [tasks, users])

  const stateData = useMemo(() => {
    const byState: Record<string, number> = {}
    tasks.forEach((t) => {
      const name = stateName(t.workflowStateId)
      byState[name] = (byState[name] ?? 0) + 1
    })
    return Object.entries(byState).map(([name, count]) => ({ name, count }))
  }, [tasks, workflowStates])

  const chartColors = getChartColors(primary, secondary, Math.max(contributionData.length, 4))

  const openEdit = (t: Task) => {
    setEditTask(t)
    setEditTitle(t.title)
    setEditOwnerId(t.ownerId)
    setEditPriority(t.priority)
    setEditStateId(t.workflowStateId)
    setEditDueDate(t.dueDate ?? '')
  }

  const handleSaveEdit = useCallback(async () => {
    if (!editTask) return
    setActionSaving(true)
    try {
      await taskService.update(editTask.id, {
        title: editTitle.trim(),
        ownerId: editOwnerId,
        priority: editPriority as Task['priority'],
        workflowStateId: editStateId || editTask.workflowStateId,
        dueDate: editDueDate || undefined,
      })
      loadTasks()
      setEditTask(null)
    } finally {
      setActionSaving(false)
    }
  }, [editTask, editTitle, editOwnerId, editPriority, editStateId, editDueDate, loadTasks])

  const handleDelete = useCallback(async () => {
    if (!deleteTaskId) return
    setActionSaving(true)
    try {
      await taskService.remove(deleteTaskId)
      loadTasks()
      setDeleteTaskId(null)
    } finally {
      setActionSaving(false)
    }
  }, [deleteTaskId, loadTasks])

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name })),
    [users]
  )
  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]
  const stateOptions = useMemo(
    () => workflowStates.map((s) => ({ value: s.id, label: s.name })),
    [workflowStates]
  )

  if (loading) {
    return (
      <AppPageLayout title="Milestone" subtitle="Loading…">
        <View bg="fg" className="rounded-base shadow-custom p-8 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin opacity-70" style={{ color: dark }} />
          <Text variant="sm" className="opacity-70">Loading…</Text>
        </View>
      </AppPageLayout>
    )
  }

  if (!milestone || !project) {
    return (
      <AppPageLayout title="Milestone" subtitle="Not found">
        <Card title="Not found">
          <Text variant="sm">Milestone or project not found.</Text>
          <Link to="/app/projects" className="mt-2 inline-block text-sm underline">
            Back to projects
          </Link>
        </Card>
      </AppPageLayout>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <View bg="bg" className="p-3 rounded-base">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/app/projects/${projectId}`}
              className="shrink-0 p-1.5 rounded-base opacity-80 hover:opacity-100 transition"
              style={{ color: dark }}
              aria-label="Back to project"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <Text className="font-medium truncate" style={{ color: dark }}>
                {milestone.name}
              </Text>
              <Text variant="sm" className="opacity-80 truncate block">
                {project.name} · Target {formatDate(milestone.targetDate)}
              </Text>
            </div>
            <Badge variant={milestone.priority}>{milestone.priority}</Badge>
          </div>
        </div>
      </View>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          title="Total tasks"
          rightIcon={<ListTodo className="w-4 h-4" />}
          className="min-h-[7rem] py-4 px-4"
        >
          <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
            {tasks.length}
          </Text>
          <Text variant="sm" className="opacity-55 mt-0.5">
            Logged on this milestone
          </Text>
        </Card>
        <Card
          title="Completed"
          rightIcon={<CheckCircle className="w-4 h-4" />}
          className="min-h-[7rem] py-4 px-4"
        >
          <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
            {completedCount}
          </Text>
          <Text variant="sm" className="opacity-55 mt-0.5">
            Tasks in Done
          </Text>
        </Card>
        <Card
          title="In progress"
          rightIcon={<Loader2 className="w-4 h-4" />}
          className="min-h-[7rem] py-4 px-4"
        >
          <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
            {inProgressCount}
          </Text>
          <Text variant="sm" className="opacity-55 mt-0.5">
            Not yet done
          </Text>
        </Card>
        <Card
          title="Assigned employees"
          rightIcon={<Users className="w-4 h-4" />}
          className="min-h-[7rem] py-4 px-4"
        >
          <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
            {assigneeIds.length}
          </Text>
          <Text variant="sm" className="opacity-55 mt-0.5">
            Contributing to milestone
          </Text>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card
          title="Contribution by assignee"
          subtitle="Tasks logged per employee"
          className="px-4 pb-4"
        >
          <div className="h-[280px] w-full">
            {contributionData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Text variant="sm" className="opacity-60">
                  No tasks yet. Assignees will appear as they log work.
                </Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={contributionData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 60 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={tickProps} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={tickProps}
                    width={100}
                    tickFormatter={(v) => (v.length > 12 ? v.slice(0, 11) + '…' : v)}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Tasks']}
                    contentStyle={tooltipContentStyle}
                    cursor={tooltipCursor}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tasks">
                    {contributionData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card
          title="Tasks by state"
          subtitle="Workflow distribution"
          className="px-4 pb-4"
        >
          <div className="h-[280px] w-full">
            {stateData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Text variant="sm" className="opacity-60">
                  No tasks to show.
                </Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stateData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={tickProps}
                    angle={stateData.length > 4 ? -25 : 0}
                    textAnchor={stateData.length > 4 ? 'end' : 'middle'}
                    interval={0}
                  />
                  <YAxis tick={tickProps} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Tasks']}
                    contentStyle={tooltipContentStyle}
                    cursor={tooltipCursor}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stateData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card title="Task list" subtitle={`${tasks.length} task(s)`}>
        {tasks.length === 0 ? (
          <Text variant="sm" className="opacity-70">
            No tasks under this milestone yet. Assigned employees log tasks here.
          </Text>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Title', 'Assignee', 'Priority', 'Due date', 'State', 'Actions']}>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2">
                    <Text variant="sm">{t.title}</Text>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <Avatar
                        name={users.find((u) => u.id === t.ownerId)?.name}
                        size="sm"
                        src={users.find((u) => u.id === t.ownerId)?.avatarUrl}
                      />
                      <Text variant="sm">
                        {users.find((u) => u.id === t.ownerId)?.name ?? t.ownerId ?? '—'}
                      </Text>
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={t.priority}>{t.priority}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Text variant="sm">{t.dueDate ? formatDate(t.dueDate) : '—'}</Text>
                  </td>
                  <td className="px-4 py-2">
                    <Text variant="sm">{stateName(t.workflowStateId)}</Text>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewTask(t)}
                        className="p-1.5 rounded-base opacity-70 hover:opacity-100 transition"
                        style={{ color: dark }}
                        title="View"
                        aria-label="View task"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-base opacity-70 hover:opacity-100 transition"
                        style={{ color: dark }}
                        title="Edit"
                        aria-label="Edit task"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTaskId(t.id)}
                        className="p-1.5 rounded-base opacity-70 hover:opacity-100 transition"
                        style={{ color: current?.system?.error ?? dark }}
                        title="Delete"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </Card>

      {/* View task modal */}
      <Modal open={!!viewTask} onClose={() => setViewTask(null)}>
        <div className="p-6 flex flex-col max-w-md" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.1, color: dark }}>
            Task details
          </h2>
          {viewTask && (
            <div className="space-y-4">
              <div>
                <Text variant="sm" className="opacity-70 block mb-0.5">Title</Text>
                <Text style={{ color: dark }}>{viewTask.title}</Text>
              </div>
              {viewTask.description && (
                <div>
                  <Text variant="sm" className="opacity-70 block mb-0.5">Description</Text>
                  <Text variant="sm" style={{ color: dark }}>{viewTask.description}</Text>
                </div>
              )}
              <div>
                <Text variant="sm" className="opacity-70 block mb-0.5">Assignee</Text>
                <Text style={{ color: dark }}>
                  {users.find((u) => u.id === viewTask.ownerId)?.name ?? viewTask.ownerId ?? '—'}
                </Text>
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <Text variant="sm" className="opacity-70 block mb-0.5">Priority</Text>
                  <Badge variant={viewTask.priority}>{viewTask.priority}</Badge>
                </div>
                <div>
                  <Text variant="sm" className="opacity-70 block mb-0.5">State</Text>
                  <Text style={{ color: dark }}>{stateName(viewTask.workflowStateId)}</Text>
                </div>
                <div>
                  <Text variant="sm" className="opacity-70 block mb-0.5">Due date</Text>
                  <Text style={{ color: dark }}>{viewTask.dueDate ? formatDate(viewTask.dueDate) : '—'}</Text>
                </div>
              </div>
            </div>
          )}
          <footer className="flex justify-end pt-4 mt-4 border-t" style={{ borderColor }}>
            <Button variant="background" label="Close" onClick={() => setViewTask(null)} />
          </footer>
        </div>
      </Modal>

      {/* Edit task modal */}
      <Modal open={!!editTask} onClose={() => !actionSaving && setEditTask(null)}>
        <div className="p-6 flex flex-col max-w-md" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.1, color: dark }}>
            Edit task
          </h2>
          <div className="space-y-4">
            <Input
              label="Title"
              type="text"
              placeholder="Task title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <CustomSelect
              label="Assignee"
              options={userOptions}
              value={editOwnerId}
              onChange={(v) => setEditOwnerId(v || '')}
              placeholder="Select assignee"
              placement="below"
            />
            <CustomSelect
              label="Priority"
              options={priorityOptions}
              value={editPriority}
              onChange={(v) => setEditPriority(v || 'medium')}
              placement="below"
            />
            <CustomSelect
              label="State"
              options={stateOptions}
              value={editStateId}
              onChange={(v) => setEditStateId(v || '')}
              placeholder="Select state"
              placement="below"
            />
            <DateSelectInput
              label="Due date (optional)"
              value={editDueDate}
              onChange={setEditDueDate}
              yearMax={new Date().getFullYear() + 5}
              order="dmy"
            />
          </div>
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t" style={{ borderColor }}>
            <Button variant="background" label="Cancel" onClick={() => !actionSaving && setEditTask(null)} disabled={actionSaving} />
            <Button label="Save" onClick={handleSaveEdit} disabled={actionSaving || !editTitle.trim() || !editOwnerId} />
          </footer>
        </div>
      </Modal>

      {/* Delete task confirm */}
      <Modal open={!!deleteTaskId} onClose={() => !actionSaving && setDeleteTaskId(null)}>
        <div className="p-6 flex flex-col max-w-md" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-2" style={{ fontSize: baseFontSize * 1.1, color: dark }}>
            Delete task?
          </h2>
          <Text variant="sm" className="opacity-80 mb-4">
            This task will be removed from the milestone. This action cannot be undone.
          </Text>
          <footer className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor }}>
            <Button variant="background" label="Cancel" onClick={() => !actionSaving && setDeleteTaskId(null)} disabled={actionSaving} />
            <Button variant="danger" label="Delete" onClick={handleDelete} disabled={actionSaving} />
          </footer>
        </div>
      </Modal>
    </div>
  )
}

export default MilestoneTasksPage
