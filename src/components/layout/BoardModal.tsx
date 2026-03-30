import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { X, Plus, Settings, GripVertical, Trash2, Pencil, Check, ListTodo } from 'lucide-react'
import { Themestore } from '../../data/Themestore'
import { useBoardModal } from '../../data/ModalStore'
import { projectService } from '../../services/projectService'
import { milestoneService } from '../../services/milestoneService'
import { taskService } from '../../services/taskService'
import { userService, assignmentService } from '../../services'
import type { Project, WorkflowState, Milestone, User, Task } from '../../types'
import Text from '../base/Text'
import { baseFontSize } from '../base/Text'
import CustomSelect from '../ui/CustomSelect'
import MilestoneCard from '../../pages/projects/MilestoneCard'
import { WORKFLOW_TEMPLATES, templateToStates } from '../../pages/projects/workflowTemplates'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import DateSelectInput from '../ui/DateSelectInput'
import EmptyState from '../ui/EmptyState'
import { Authstore } from '../../data/Authstore'

export interface BoardModalProps {
  onClose: () => void
  initialProjectId?: string
}

type DragState = { milestoneId: string; stateId: string } | null

export default function BoardModal({ onClose, initialProjectId }: BoardModalProps) {
  const navigate = useNavigate()
  const { current } = Themestore()
  const bg = current?.system?.background
  const fg = current?.system?.foreground
  const borderColor = current?.system?.border
  const dark = current?.system?.dark
  const primary = current?.brand?.primary

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string>(initialProjectId ?? '')
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userMap, setUserMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<DragState>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const [workflowModalOpen, setWorkflowModalOpen] = useBoardModal(projectId, 'workflow')
  const [workflowEditNames, setWorkflowEditNames] = useState<Record<string, string>>({})
  const [addMilestoneOpen, setAddMilestoneOpen] = useBoardModal(projectId, 'addMilestone')
  const [addMilestoneStateId, setAddMilestoneStateId] = useState<string>('')
  const [milestoneName, setMilestoneName] = useState('')
  const [milestoneTarget, setMilestoneTarget] = useState('')
  const [milestonePriority, setMilestonePriority] = useState<string>('medium')
  const [editMilestoneId, setEditMilestoneId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editStateId, setEditStateId] = useState('')
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([])
  const [milestoneAssigneeIds, setMilestoneAssigneeIds] = useState<string[]>([])
  const [defaultMilestoneAssigneeIds, setDefaultMilestoneAssigneeIds] = useState<string[]>([])
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadProjects = useCallback(async () => {
    const list = await projectService.list()
    setProjects(list)
    setProjectId((prev) => {
      if (initialProjectId && list.some((p) => p.id === initialProjectId)) return initialProjectId
      if (prev && list.some((p) => p.id === prev)) return prev
      return list.length > 0 ? list[0].id : ''
    })
  }, [initialProjectId])

  const loadBoard = useCallback(async (pid: string) => {
    if (!pid) return
    setLoading(true)
    try {
      const [workflow, milestoneList, taskList, userList, assignments] = await Promise.all([
        projectService.getWorkflow(pid),
        milestoneService.listByProject(pid),
        taskService.listByProject(pid),
        userService.list(),
        assignmentService.listByProject(pid),
      ])
      const states = (workflow?.states ?? []).slice().sort((a, b) => a.order - b.order)
      setWorkflowStates(states)
      setMilestones(milestoneList)
      setTasks(taskList)
      setUsers(userList)
      setDefaultMilestoneAssigneeIds(
        assignments.filter((assignment) => assignment.status === 'active').map((assignment) => assignment.freelancerId)
      )
      const map: Record<string, string> = {}
      userList.forEach((u) => { map[u.id] = u.name ?? u.email })
      setUserMap(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])
  useEffect(() => { if (projectId) loadBoard(projectId) }, [projectId, loadBoard])

  const firstStateId = workflowStates[0]?.id ?? ''
  const selectedProject = projects.find((p) => p.id === projectId) ?? null
  const isExternalOriginProject = selectedProject?.projectType === 'external'
  const milestonesByState = useMemo(() => {
    const map: Record<string, Milestone[]> = {}
    workflowStates.forEach((s) => { map[s.id] = [] })
    milestones.forEach((m) => {
      const sid = m.workflowStateId && workflowStates.some((st) => st.id === m.workflowStateId)
        ? m.workflowStateId
        : firstStateId
      if (!map[sid]) map[sid] = []
      map[sid].push(m)
    })
    return map
  }, [workflowStates, milestones, firstStateId])

  const assigneeIdsByMilestone = useMemo(() => {
    const map: Record<string, string[]> = {}
    milestones.forEach((m) => {
      const fromTasks = tasks.filter((t) => t.milestoneId === m.id).map((t) => t.ownerId)
      const fromMilestone = m.assigneeIds ?? []
      map[m.id] = [...new Set([...fromMilestone, ...fromTasks])]
    })
    return map
  }, [milestones, tasks])

  const moveMilestone = useCallback(async (milestoneId: string, workflowStateId: string) => {
    const updated = await milestoneService.update(milestoneId, { workflowStateId })
    if (updated) setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? updated : m)))
  }, [])

  const handleDragStart = (e: React.DragEvent, m: Milestone) => {
    const stateId = m.workflowStateId && workflowStates.some((s) => s.id === m.workflowStateId) ? m.workflowStateId : firstStateId
    setDragging({ milestoneId: m.id, stateId })
    e.dataTransfer.setData('application/json', JSON.stringify({ milestoneId: m.id }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDragging(null)
    setDropTarget(null)
  }

  const handleDragOver = (e: React.DragEvent, stateId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(stateId)
  }

  const handleDragLeave = () => setDropTarget(null)

  const handleDrop = (e: React.DragEvent, targetStateId: string) => {
    e.preventDefault()
    setDropTarget(null)
    try {
      const data = e.dataTransfer.getData('application/json')
      const { milestoneId } = JSON.parse(data || '{}') as { milestoneId?: string }
      if (milestoneId && dragging?.milestoneId === milestoneId && targetStateId !== dragging.stateId) {
        moveMilestone(milestoneId, targetStateId)
      }
    } finally {
      setDragging(null)
    }
  }

  const openWorkflowModal = () => {
    const names: Record<string, string> = {}
    workflowStates.forEach((s) => { names[s.id] = s.name })
    setWorkflowEditNames(names)
    setWorkflowModalOpen(true)
  }

  const saveWorkflow = async () => {
    if (!projectId) return
    setSaving(true)
    try {
      const next = workflowStates.map((s, i) => ({
        ...s,
        name: workflowEditNames[s.id] ?? s.name,
        order: i,
      }))
      const updated = await projectService.updateWorkflowStates(projectId, next)
      if (updated) setWorkflowStates(updated.states.slice().sort((a, b) => a.order - b.order))
      setWorkflowModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const addWorkflowState = () => {
    const maxOrder = workflowStates.length ? Math.max(...workflowStates.map((s) => s.order)) : -1
    const newId = `s${Date.now()}`
    setWorkflowStates((prev) => [...prev, { id: newId, name: 'New column', order: maxOrder + 1 }])
    setWorkflowEditNames((prev) => ({ ...prev, [newId]: 'New column' }))
  }

  const removeWorkflowState = (stateId: string) => {
    const fallbackId = workflowStates.find((s) => s.id !== stateId)?.id
    setWorkflowStates((prev) => prev.filter((s) => s.id !== stateId))
    setWorkflowEditNames((prev) => {
      const next = { ...prev }
      delete next[stateId]
      return next
    })
    if (fallbackId) {
      milestones.filter((m) => (m.workflowStateId ?? firstStateId) === stateId).forEach((m) => {
        milestoneService.update(m.id, { workflowStateId: fallbackId }).then((updated) => {
          if (updated) setMilestones((prev) => prev.map((x) => (x.id === m.id ? updated : x)))
        })
      })
    }
  }

  const applyWorkflowTemplate = (template: (typeof WORKFLOW_TEMPLATES)[number]) => {
    const states = templateToStates(template)
    setWorkflowStates(states)
    setWorkflowEditNames(states.reduce<Record<string, string>>((acc, s) => ({ ...acc, [s.id]: s.name }), {}))
  }

  const openAddMilestone = (stateId: string) => {
    setAddMilestoneStateId(stateId)
    setMilestoneName('')
    const d = new Date()
    setMilestoneTarget(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    )
    setMilestonePriority('medium')
    setMilestoneAssigneeIds(defaultMilestoneAssigneeIds)
    setAddMilestoneOpen(true)
  }

  const handleCreateMilestone = async () => {
    if (!projectId || !milestoneName.trim() || !milestoneTarget) return
    setSaving(true)
    try {
      const created = await milestoneService.create({
        projectId,
        name: milestoneName.trim(),
        priority: milestonePriority as 'high' | 'medium' | 'low',
        targetDate: milestoneTarget,
        taskIds: [],
        workflowStateId: addMilestoneStateId || firstStateId,
        assigneeIds: milestoneAssigneeIds.length ? milestoneAssigneeIds : (defaultMilestoneAssigneeIds.length ? defaultMilestoneAssigneeIds : undefined),
      })
      setMilestones((prev) => [...prev, created])
      setAddMilestoneOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const openEditMilestone = (m: Milestone) => {
    setEditMilestoneId(m.id)
    setEditName(m.name)
    setEditTarget(m.targetDate)
    setEditPriority(m.priority)
    setEditStateId(m.workflowStateId && workflowStates.some((s) => s.id === m.workflowStateId) ? m.workflowStateId : firstStateId)
    setEditAssigneeIds([...new Set([...(m.assigneeIds ?? []), ...(assigneeIdsByMilestone[m.id] ?? [])])])
  }

  const handleUpdateMilestone = async () => {
    if (!editMilestoneId) return
    setSaving(true)
    try {
      const updated = await milestoneService.update(editMilestoneId, {
        name: editName.trim(),
        targetDate: editTarget,
        priority: editPriority as 'high' | 'medium' | 'low',
        workflowStateId: editStateId || undefined,
        assigneeIds: editAssigneeIds.length ? editAssigneeIds : undefined,
      })
      if (updated) setMilestones((prev) => prev.map((m) => (m.id === editMilestoneId ? updated : m)))
      setEditMilestoneId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMilestone = async () => {
    if (!deleteMilestoneId) return
    setSaving(true)
    try {
      await milestoneService.remove(deleteMilestoneId)
      setMilestones((prev) => prev.filter((m) => m.id !== deleteMilestoneId))
      setDeleteMilestoneId(null)
    } finally {
      setSaving(false)
    }
  }

  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  const { user } = Authstore()
  const canTakeAction = user?.role == "company_admin" || user?.role == "project_lead"

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: fg, color: dark, fontSize: baseFontSize }}>
      <header className="flex items-center justify-between gap-4 shrink-0 px-4 py-3 border-b" style={{ borderColor }}>
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <h2 className="font-semibold truncate" style={{ fontSize: baseFontSize }}>
            {projects.find((p) => p.id === projectId)?.name ?? ''}
          </h2>

          {
            canTakeAction

            &&

            <button
              type="button"
              onClick={openWorkflowModal}
              className="flex items-center gap-2 px-3 py-2 rounded-base opacity-90 hover:opacity-100 transition font-medium"
              style={{ color: dark, backgroundColor: bg, fontSize: baseFontSize }}
            >
              <Settings className="w-4 h-4" />
              Manage workflow
            </button>
          }
          {
            canTakeAction
            &&
            <Button
              size="sm"
              label="Add milestone"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => openAddMilestone(firstStateId)}
            />
          }
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-base opacity-80 hover:opacity-100 transition"
          style={{ color: dark }}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 min-h-0 flex flex-col px-4 py-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Text variant="sm" style={{ color: dark }}>Loading...</Text>
          </div>
        ) : workflowStates.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 px-4">
            <EmptyState
              variant="columns"
              title="No columns yet"
              description="Add columns to organise milestones. Use a template or create your own in Manage workflow."
              className="py-8 max-w-md"
            >
              <Button
                label="Manage workflow"
                startIcon={<Settings className="w-4 h-4" />}
                onClick={openWorkflowModal}
              />
            </EmptyState>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scroll-slim">
            <div className="flex gap-3 h-full min-h-0 lg:flex-nowrap lg:w-max">
              {workflowStates.map((state) => {
                const stateMilestones = milestonesByState[state.id] ?? []
                const isDropTarget = dropTarget === state.id
                return (
                  <div
                    key={state.id}
                    className="flex flex-col flex-1 min-w-0 min-h-0 rounded-base overflow-hidden h-full lg:flex-none lg:min-w-[30vw] lg:w-[30vw]"
                    style={{ backgroundColor: bg ?? 'rgba(0,0,0,0.04)', minHeight: 200 }}
                    draggable={canTakeAction}
                    onDragOver={(e) => handleDragOver(e, state.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, state.id)}
                  >
                    <div
                      className="shrink-0 flex items-center justify-between gap-2 py-2 px-2 border-b"
                      style={{
                        color: dark,
                        backgroundColor: isDropTarget ? (primary ? `${primary}18` : 'rgba(255,150,0,0.12)') : undefined,
                        fontSize: baseFontSize,
                        borderColor: borderColor ?? 'rgba(0,0,0,0.08)',
                      }}
                    >
                      <span className="font-medium truncate">{state.name}</span>
                      <span className="opacity-70 shrink-0" style={{ fontSize: baseFontSize }}>{stateMilestones.length}</span>
                      <button
                        type="button"
                        onClick={() => openAddMilestone(state.id)}
                        className="p-1.5 rounded-base opacity-70 hover:opacity-100 transition shrink-0"
                        style={{ color: dark }}
                        title="Add milestone to this column"
                        aria-label="Add milestone"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto scroll-slim space-y-2 pt-3 px-2 pb-2 flex flex-col">
                      {stateMilestones.length === 0 ? (
                        <div
                          className="flex-1 min-h-[140px] flex flex-col items-center justify-center py-2 px-2 rounded-base"
                          style={{
                            color: dark,
                            backgroundColor: 'rgba(0,0,0,0.04)',
                          }}
                        >
                          <EmptyState
                            variant="task"
                            compact
                            title={`No milestones in ${state.name}`}
                            description="Add one with + or drag from another column."
                            className="py-4 px-0 text-center"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            label={`Add to ${state.name}`}
                            startIcon={<Plus className="w-4 h-4" />}
                            onClick={() => openAddMilestone(state.id)}
                            className="shrink-0"
                          />
                        </div>
                      ) : (
                        stateMilestones.map((m) => {
                          const assigneeIds = assigneeIdsByMilestone[m.id] ?? []
                          return (
                            <div
                              key={m.id}
                              draggable={canTakeAction}
                              onDragStart={(e) => handleDragStart(e, m)}
                              onDragEnd={handleDragEnd}
                              className="cursor-grab active:cursor-grabbing touch-none group relative"
                            >
                              <MilestoneCard
                                milestone={m}
                                assigneeIds={assigneeIds}
                                userMap={userMap}
                                users={users}
                                fg={fg}
                                dark={dark}
                                borderColor={borderColor}
                                compact
                                isDragging={dragging?.milestoneId === m.id}
                              />
                              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose()
                                    navigate(`/app/projects/${projectId}/milestones/${m.id}`)
                                  }}
                                  className="p-1.5 rounded-base hover:opacity-100"
                                  style={{ backgroundColor: bg, color: dark }}
                                  title="View tasks"
                                  aria-label="View tasks under this milestone"
                                >
                                  <ListTodo className="w-3.5 h-3.5" />
                                </button>
                                {canTakeAction && (<>
                                  <button
                                    type="button"
                                    onClick={() => openEditMilestone(m)}
                                    className="p-1.5 rounded-base hover:opacity-100"
                                    style={{ backgroundColor: bg, color: dark }}
                                    title="Edit"
                                    aria-label="Edit milestone"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteMilestoneId(m.id)}
                                    className="p-1.5 rounded-base hover:opacity-100"
                                    style={{ backgroundColor: bg, color: current?.system?.error ?? dark }}
                                    title="Delete"
                                    aria-label="Delete milestone"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>)}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manage workflow modal */}
      <Modal open={workflowModalOpen} onClose={() => setWorkflowModalOpen(false)} variant="wide">
        <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-2" style={{ fontSize: baseFontSize * 1.2, color: dark }}>Edit boards</h2>
          <Text variant="sm" className="opacity-80 mb-4" style={{ color: dark }}>
            Add, rename, or remove columns. Start from a template below or build your own.
          </Text>

          <div className="mb-6">
            <Text variant="sm" className="font-medium opacity-90 mb-2 block" style={{ color: dark }}>
              Start from a template
            </Text>
            <div className="flex flex-wrap gap-3">
              {WORKFLOW_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyWorkflowTemplate(template)}
                  className="text-left px-4 py-3 rounded-base transition opacity-90 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center gap-4"
                  style={{
                    color: dark,
                    backgroundColor: bg ?? 'transparent',
                    ['--tw-ring-color' as string]: primary,
                  }}
                >
                  {template.id === 'simple' && (
                    <svg width="40" height="32" viewBox="0 0 40 32" fill="none" className="shrink-0" aria-hidden>
                      <rect x="2" y="4" width="10" height="24" rx="2" fill={primary} fillOpacity="0.2" />
                      <rect x="15" y="4" width="10" height="24" rx="2" fill={primary} fillOpacity="0.35" />
                      <rect x="28" y="4" width="10" height="24" rx="2" fill={primary} fillOpacity="0.5" />
                    </svg>
                  )}
                  {template.id === 'kanban' && (
                    <svg width="40" height="32" viewBox="0 0 40 32" fill="none" className="shrink-0" aria-hidden>
                      <rect x="2" y="2" width="6" height="28" rx="1.5" fill={primary} fillOpacity="0.25" />
                      <rect x="10" y="2" width="6" height="28" rx="1.5" fill={primary} fillOpacity="0.4" />
                      <rect x="18" y="2" width="6" height="28" rx="1.5" fill={primary} fillOpacity="0.55" />
                      <rect x="26" y="2" width="6" height="28" rx="1.5" fill={primary} fillOpacity="0.7" />
                      <rect x="34" y="2" width="4" height="28" rx="1" fill={primary} fillOpacity="0.9" />
                    </svg>
                  )}
                  {template.id === 'full' && (
                    <svg width="40" height="32" viewBox="0 0 40 32" fill="none" className="shrink-0" aria-hidden>
                      <rect x="1" y="4" width="5" height="24" rx="1.5" fill={primary} fillOpacity="0.2" />
                      <rect x="8" y="4" width="5" height="24" rx="1.5" fill={primary} fillOpacity="0.32" />
                      <rect x="15" y="4" width="5" height="24" rx="1.5" fill={primary} fillOpacity="0.44" />
                      <rect x="22" y="4" width="5" height="24" rx="1.5" fill={primary} fillOpacity="0.56" />
                      <rect x="29" y="4" width="5" height="24" rx="1.5" fill={primary} fillOpacity="0.68" />
                      <rect x="36" y="4" width="3" height="24" rx="1" fill={primary} fillOpacity="0.85" />
                    </svg>
                  )}
                  <div className="min-w-0">
                    <span className="font-medium block mb-0.5" style={{ fontSize: baseFontSize }}>
                      {template.name}
                    </span>
                    <span className="text-xs opacity-70" style={{ color: dark }}>
                      {template.states.map((s) => s.name).join(' → ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Text variant="sm" className="font-medium opacity-90 mb-2 block" style={{ color: dark }}>
            Your columns
          </Text>
          <ul className="space-y-2 mb-4">
            {workflowStates.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 opacity-50 shrink-0" style={{ color: dark }} aria-hidden />
                <input
                  type="text"
                  value={workflowEditNames[s.id] ?? s.name}
                  onChange={(e) => setWorkflowEditNames((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-base border bg-transparent focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{
                    fontSize: baseFontSize,
                    color: dark,
                    borderColor: borderColor,
                    ['--tw-ring-color' as string]: primary,
                  }}
                  aria-label={`Column ${s.name}`}
                />
                <button
                  type="button"
                  onClick={() => removeWorkflowState(s.id)}
                  disabled={workflowStates.length <= 1}
                  className="p-2 rounded-base opacity-70 hover:opacity-100 disabled:opacity-40 shrink-0"
                  style={{ color: current?.system?.error ?? dark }}
                  aria-label="Remove column"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
            <Button size="sm" variant="background" label="Cancel" onClick={() => setWorkflowModalOpen(false)} />
            <Button size="sm" variant="background" label="Add column" startIcon={<Plus className="w-4 h-4" />} onClick={addWorkflowState} />
            <Button size="sm" label="Save" onClick={saveWorkflow} disabled={saving} loading={saving} />
          </footer>
        </div>
      </Modal>

      {/* Add milestone modal */}
      <Modal open={addMilestoneOpen} onClose={() => !saving && setAddMilestoneOpen(false)}>
        <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.2, color: dark }}>Add milestone</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="Milestone name"
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
              onChange={setMilestonePriority}
              aria-label="Priority"
              placement="below"
            />
            <CustomSelect
              label="Column"
              options={workflowStates.map((s) => ({ value: s.id, label: s.name }))}
              value={addMilestoneStateId || firstStateId}
              onChange={setAddMilestoneStateId}
              aria-label="Column"
              placement="above"
            />
            {!isExternalOriginProject && (
              <div>
                <label className="block mb-1">
                  <Text variant="sm" style={{ color: dark }}>Assigned employees</Text>
                </label>
                <div className="flex gap-3 overflow-x-auto scroll-slim pb-1 -mx-0.5" style={{ minHeight: 168 }}>
                  {users.map((u) => {
                    const selected = milestoneAssigneeIds.includes(u.id)
                    const roleLabel = u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null
                    const displayName = userMap[u.id] ?? u.name ?? u.email
                    const initials = (u.name || u.email || '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?'
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
                          aria-label={`Assign ${displayName}`}
                        />
                        <div className="absolute inset-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-medium text-3xl"
                              style={{
                                backgroundColor: bg ?? 'rgba(0,0,0,0.08)',
                                color: primary,
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
                          <p className="font-medium truncate">{displayName}</p>
                          {(roleLabel ?? u.email) && <p className="truncate opacity-90">{roleLabel ?? u.email}</p>}
                        </div>
                        {selected && (
                          <span
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: fg, color: primary }}
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
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
            <Button variant="background" label="Cancel" onClick={() => !saving && setAddMilestoneOpen(false)} disabled={saving} />
            <Button label="Add milestone" onClick={handleCreateMilestone} disabled={saving || !milestoneName.trim() || !milestoneTarget} loading={saving} />
          </footer>
        </div>
      </Modal>

      {/* Edit milestone modal */}
      <Modal open={!!editMilestoneId} onClose={() => !saving && setEditMilestoneId(null)}>
        <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.2, color: dark }}>Edit milestone</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="Milestone name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <DateSelectInput
              label="Target date"
              value={editTarget}
              onChange={setEditTarget}
              yearMax={new Date().getFullYear() + 10}
              order="dmy"
            />
            <CustomSelect
              label="Priority"
              options={priorityOptions}
              value={editPriority}
              onChange={setEditPriority}
              aria-label="Priority"
              placement="below"
            />
            <CustomSelect
              label="Column"
              options={workflowStates.map((s) => ({ value: s.id, label: s.name }))}
              value={editStateId || firstStateId}
              onChange={setEditStateId}
              aria-label="Column"
              placement="above"
            />
            <div>
              <label className="block mb-1">
                <Text variant="sm" style={{ color: dark }}>Assigned employees</Text>
              </label>
              <div className="flex gap-3 overflow-x-auto scroll-slim pb-1 -mx-0.5" style={{ minHeight: 168 }}>
                {users.map((u) => {
                  const selected = editAssigneeIds.includes(u.id)
                  const roleLabel = u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null
                  const displayName = userMap[u.id] ?? u.name ?? u.email
                  const initials = (u.name || u.email || '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?'
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
                          if (e.target.checked) setEditAssigneeIds((prev) => [...prev, u.id])
                          else setEditAssigneeIds((prev) => prev.filter((id) => id !== u.id))
                        }}
                        className="sr-only"
                        aria-label={`Assign ${displayName}`}
                      />
                      <div className="absolute inset-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center font-medium text-3xl"
                            style={{
                              backgroundColor: bg ?? 'rgba(0,0,0,0.08)',
                              color: primary,
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
                        <p className="font-medium truncate">{displayName}</p>
                        {(roleLabel ?? u.email) && <p className="truncate opacity-90">{roleLabel ?? u.email}</p>}
                      </div>
                      {selected && (
                        <span
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: fg, color: primary }}
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
          </div>
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
            <Button variant="background" label="Cancel" onClick={() => !saving && setEditMilestoneId(null)} disabled={saving} />
            <Button label="Save" onClick={handleUpdateMilestone} disabled={saving || !editName.trim() || !editTarget} loading={saving} />
          </footer>
        </div>
      </Modal>

      {/* Delete milestone confirm */}
      <Modal open={!!deleteMilestoneId} onClose={() => !saving && setDeleteMilestoneId(null)}>
        <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: fg }}>
          <h2 className="font-medium mb-2" style={{ fontSize: baseFontSize * 1.2, color: dark }}>Delete milestone?</h2>
          <Text variant="sm" className="opacity-80 mb-4" style={{ color: dark }}>
            {deleteMilestoneId
              ? `Are you sure you want to delete "${milestones.find((m) => m.id === deleteMilestoneId)?.name ?? 'this milestone'}"? This cannot be undone.`
              : 'This cannot be undone.'}
          </Text>
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
            <Button variant="background" label="Cancel" onClick={() => !saving && setDeleteMilestoneId(null)} disabled={saving} />
            <Button variant="danger" label="Delete" onClick={handleDeleteMilestone} disabled={saving} loading={saving} />
          </footer>
        </div>
      </Modal>
    </div>
  )
}
