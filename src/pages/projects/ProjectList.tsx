import { useCallback, useEffect, useMemo, useState } from 'react'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button, Skeleton } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { useProjectListModal } from '../../data/ModalStore'
import { projectService, userService, taskService } from '../../services'
import type { Project } from '../../types'
import { FolderKanban, ListTodo, User, BarChart3, Search, Plus, SlidersHorizontal } from 'lucide-react'
import { Authstore } from '../../data/Authstore'
import {
  PEXELS_AVATAR_FALLBACKS,
  PEXELS_AVATAR_LIST,
  FILTER_SIDEBAR_DURATION_MS,
} from './constants'
import type { ProjectMember, ProjectWithMeta } from './types'
import { getChartColors } from './utils'
import ProjectCard from './ProjectCard'
import ProjectListFilters from './ProjectListFilters'
import CreateProjectModal from './CreateProjectModal'
import EditProjectModal from './EditProjectModal'
import DeleteProjectModal from './DeleteProjectModal'
import SuspendProjectModal from './SuspendProjectModal'
import ProjectListAnalyticsModal from './ProjectListAnalyticsModal'

const ProjectList = () => {
  const { current } = Themestore()
  const user = Authstore((s) => s.user)
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Record<string, string>>({})
  const [taskCountByProject, setTaskCountByProject] = useState<Record<string, number>>({})
  const [membersByProject, setMembersByProject] = useState<Record<string, ProjectMember[]>>({})
  const [loading, setLoading] = useState(true)
  const [analyticsOpen, setAnalyticsOpen] = useProjectListModal('analytics')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLeadId, setFilterLeadId] = useState<string>('')
  const [filterSort, setFilterSort] = useState<string>('name_asc')
  const [filterOpen, setFilterOpen] = useProjectListModal('filter')
  const [filterSidebarExiting, setFilterSidebarExiting] = useState(false)
  const [filterSidebarEntered, setFilterSidebarEntered] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useProjectListModal('create')
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createLeadId, setCreateLeadId] = useState('')
  const [createDueDate, setCreateDueDate] = useState('')
  const [createSaving, setCreateSaving] = useState(false)
  const [deleteProject, setDeleteProject] = useState<ProjectWithMeta | null>(null)
  const [editProject, setEditProject] = useState<ProjectWithMeta | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLeadId, setEditLeadId] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [suspendProject, setSuspendProject] = useState<ProjectWithMeta | null>(null)
  const [actionSaving, setActionSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [projectList, userList] = await Promise.all([
        projectService.list(),
        userService.list(),
      ])
      setProjects(projectList)
      const leadMap: Record<string, string> = {}
      const uMap: Record<string, { name: string; avatarUrl?: string }> = {}
      userList.forEach((u) => {
        leadMap[u.id] = u.name
        uMap[u.id] = { name: u.name, avatarUrl: u.avatarUrl }
      })
      setLeads(leadMap)

      const counts: Record<string, number> = {}
      const members: Record<string, ProjectMember[]> = {}
      await Promise.all(
        projectList.map(async (p) => {
          const tasks = await taskService.listByProject(p.id)
          counts[p.id] = tasks.length
          const ids = new Set<string>([p.projectLeadId])
          tasks.forEach((t) => ids.add(t.ownerId))
          members[p.id] = Array.from(ids)
            .map((id, idx) => ({
              id,
              name: uMap[id]?.name ?? id,
              avatarUrl: uMap[id]?.avatarUrl ?? PEXELS_AVATAR_FALLBACKS[id] ?? PEXELS_AVATAR_LIST[idx % PEXELS_AVATAR_LIST.length],
            }))
            .filter((m) => m.name)
        })
      )
      setTaskCountByProject(counts)
      setMembersByProject(members)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const projectsWithMeta: ProjectWithMeta[] = useMemo(
    () =>
      projects.map((p) => ({
        ...p,
        leadName: leads[p.projectLeadId] ?? p.projectLeadId,
        taskCount: taskCountByProject[p.id] ?? 0,
        members: membersByProject[p.id] ?? [],
      })),
    [projects, leads, taskCountByProject, membersByProject]
  )

  const leadOptions = useMemo(
    () =>
      Object.entries(leads)
        .map(([id, name]) => ({ value: id, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [leads]
  )

  const searchLower = searchQuery.trim().toLowerCase()
  const filteredProjects = useMemo(() => {
    return projectsWithMeta.filter((p) => {
      const matchSearch =
        !searchLower ||
        p.name.toLowerCase().includes(searchLower) ||
        (p.description ?? '').toLowerCase().includes(searchLower) ||
        (p.leadName ?? '').toLowerCase().includes(searchLower)
      const matchLead = !filterLeadId || p.projectLeadId === filterLeadId
      return matchSearch && matchLead
    })
  }, [projectsWithMeta, searchLower, filterLeadId])

  const sortedProjects = useMemo(() => {
    const list = [...filteredProjects]
    if (filterSort === 'name_asc') return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    if (filterSort === 'name_desc') return list.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }))
    if (filterSort === 'date_desc') return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (filterSort === 'date_asc') return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return list
  }, [filteredProjects, filterSort])

  useEffect(() => {
    if (filterOpen) {
      setFilterSidebarExiting(false)
      setFilterSidebarEntered(false)
      const start = requestAnimationFrame(() => {
        requestAnimationFrame(() => setFilterSidebarEntered(true))
      })
      return () => cancelAnimationFrame(start)
    } else {
      setFilterSidebarEntered(false)
    }
  }, [filterOpen])

  const closeFilterSidebar = useCallback(() => {
    setFilterSidebarExiting(true)
    const t = setTimeout(() => {
      setFilterOpen(false)
      setFilterSidebarExiting(false)
    }, FILTER_SIDEBAR_DURATION_MS)
    return () => clearTimeout(t)
  }, [setFilterOpen])

  const handleCreateProject = useCallback(async () => {
    if (!user?.companyId || !createName.trim() || !createLeadId) return
    setCreateSaving(true)
    try {
      await projectService.create({
        companyId: user.companyId,
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        projectLeadId: createLeadId,
        workflowId: 'w1',
        dueDate: createDueDate.trim() || undefined,
      })
      setCreateModalOpen(false)
      setCreateName('')
      setCreateDescription('')
      setCreateLeadId('')
      setCreateDueDate('')
      loadData()
    } finally {
      setCreateSaving(false)
    }
  }, [user?.companyId, createName, createDescription, createLeadId, createDueDate, loadData])

  useEffect(() => {
    if (editProject) {
      setEditName(editProject.name)
      setEditDescription(editProject.description ?? '')
      setEditLeadId(editProject.projectLeadId)
      setEditDueDate(editProject.dueDate ?? '')
    }
  }, [editProject])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteProject) return
    setActionSaving(true)
    try {
      await projectService.delete(deleteProject.id)
      setDeleteProject(null)
      loadData()
    } finally {
      setActionSaving(false)
    }
  }, [deleteProject, loadData])

  const handleSuspendConfirm = useCallback(async () => {
    if (!suspendProject) return
    setActionSaving(true)
    try {
      const nextStatus = suspendProject.status === 'suspended' ? 'active' : 'suspended'
      await projectService.update(suspendProject.id, { status: nextStatus })
      setSuspendProject(null)
      loadData()
    } finally {
      setActionSaving(false)
    }
  }, [suspendProject, loadData])

  const handleEditSave = useCallback(async () => {
    if (!editProject || !editName.trim() || !editLeadId) return
    setEditSaving(true)
    try {
      await projectService.update(editProject.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        projectLeadId: editLeadId,
        dueDate: editDueDate.trim() || undefined,
      })
      setEditProject(null)
      loadData()
    } finally {
      setEditSaving(false)
    }
  }, [editProject, editName, editDescription, editLeadId, editDueDate, loadData])

  const totalTasks = useMemo(
    () => Object.values(taskCountByProject).reduce((a, b) => a + b, 0),
    [taskCountByProject]
  )
  const uniqueLeads = useMemo(
    () => new Set(projects.map((p) => p.projectLeadId)).size,
    [projects]
  )

  const avgTasksPerProject = projects.length > 0 ? Math.round((totalTasks / projects.length) * 10) / 10 : 0
  const statCards = useMemo(
    () => [
      { label: 'Total projects', value: String(projects.length), caption: 'Across the workspace', icon: FolderKanban },
      { label: 'Total tasks', value: String(totalTasks), caption: 'Across all projects', icon: ListTodo },
      { label: 'Avg tasks per project', value: String(avgTasksPerProject), caption: 'Average across projects', icon: ListTodo },
      { label: 'Project leads', value: String(uniqueLeads), caption: 'Unique leads', icon: User },
    ],
    [projects.length, totalTasks, uniqueLeads, avgTasksPerProject]
  )

  const primaryColor = current?.brand?.primary ?? '#682308'
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'
  const dark = current?.system?.dark

  const chartDataByProject = useMemo(
    () =>
      projectsWithMeta
        .map((p) => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name, tasks: p.taskCount, fullName: p.name }))
        .sort((a, b) => b.tasks - a.tasks),
    [projectsWithMeta]
  )

  const trendData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    projects.forEach((p) => {
      const key = p.createdAt.slice(0, 7)
      byMonth[key] = (byMonth[key] ?? 0) + 1
    })
    const entries = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b))
    return entries.map(([month]) => {
      const d = new Date(month + '-01')
      return {
        month: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        projects: byMonth[month] ?? 0,
      }
    })
  }, [projects])

  const chartColors = getChartColors(primaryColor, secondaryColor, Math.max(chartDataByProject.length, 2))

  return (
    <>
      <div className="w-full h-full mx-auto flex flex-col min-h-0">
        <div className="shrink-0 space-y-4">
          <View bg="bg" className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Text className="font-medium">Projects</Text>
                <Text variant="sm" className="opacity-80">
                  Upwork-style overview and analytics
                </Text>
              </div>
              <div className="flex items-center gap-2 flex-nowrap">
                <Button
                  variant="outlinePrimary"
                  size="sm"
                  label="Create project"
                  startIcon={<Plus className="w-4 h-4 shrink-0" />}
                  onClick={() => setCreateModalOpen(true)}
                />
                <Button
                  variant="secondaryBrand"
                  size="sm"
                  label="View analytics"
                  startIcon={<BarChart3 className="w-4 h-4 shrink-0" />}
                  onClick={() => setAnalyticsOpen(true)}
                  disabled={loading || projects.length === 0}
                />
              </div>
            </div>
          </View>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {loading
              ? [1, 2, 3].map((i) => (
                <Card key={i} className="min-h-[7rem] py-4 px-4">
                  <Skeleton height="h-4" width="w-24" className="mb-2" />
                  <Skeleton height="h-4" width="w-16" className="mb-1" />
                  <Skeleton height="h-8" width="w-12" />
                </Card>
              ))
              : statCards.map((s) => (
                <Card
                  key={s.label}
                  title={s.label}
                  rightIcon={<s.icon className="w-5 h-5 opacity-80" />}
                  className="min-h-[7rem] py-4 px-4"
                >
                  <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
                    {s.value}
                  </Text>
                  <Text variant="sm" className="opacity-55 mt-0.5">
                    {s.caption}
                  </Text>
                </Card>
              ))}
          </div>
        </div>

        {/* Search + filter toggler (same row) */}
        <View bg="fg" className="rounded-base p-0 overflow-hidden mt-5">
          <div
            className="flex items-center rounded-base"
            style={{ border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.12)'}` }}
            role="search"
          >
            <Search
              className="ml-3 w-4 h-4 opacity-60 shrink-0"
              style={{ color: dark }}
              aria-hidden
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, description or lead…"
              className="flex-1 min-w-0 py-3 pl-3 pr-4 bg-transparent focus:outline-none focus:ring-0 border-0 placeholder:opacity-60"
              style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
              aria-label="Search projects"
            />
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="shrink-0 p-2.5 transition-opacity hover:opacity-100 opacity-90 focus:outline-none focus:ring-0"
              style={{
                color: dark,
                backgroundColor: filterOpen ? current?.system?.background : 'transparent',
              }}
              title="Filters"
              aria-label="Open filters"
              aria-expanded={filterOpen}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </View>

        {/* List — 2 cards per row (50% each), no padding on scroll container */}
        <div className="flex-1 min-h-0 overflow-auto scroll-slim mt-3 p-0">
          {loading ? (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-5 min-h-[160px]" style={{ backgroundColor: current?.system?.foreground, border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.12)'}` }}>
                  <Skeleton height="h-5" width="w-1/3" className="mb-2" />
                  <Skeleton height="h-4" width="w-2/3" className="mb-1" />
                  <Skeleton height="h-4" width="w-1/2" />
                </Card>
              ))}
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="p-8 text-center">
              <Text variant="sm" className="opacity-70">
                {projectsWithMeta.length === 0
                  ? 'No projects yet. Create one to get started.'
                  : 'No projects match your search or filters.'}
              </Text>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {sortedProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProjectListFilters
        open={filterOpen}
        exiting={filterSidebarExiting}
        entered={filterSidebarEntered}
        onClose={closeFilterSidebar}
        filterLeadId={filterLeadId}
        filterSort={filterSort}
        onFilterLeadChange={setFilterLeadId}
        onFilterSortChange={setFilterSort}
        onReset={() => {
          setFilterLeadId('')
          setFilterSort('name_asc')
        }}
        leadOptions={leadOptions}
        durationMs={FILTER_SIDEBAR_DURATION_MS}
      />

      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        saving={createSaving}
        name={createName}
        description={createDescription}
        leadId={createLeadId}
        dueDate={createDueDate}
        onNameChange={setCreateName}
        onDescriptionChange={setCreateDescription}
        onLeadIdChange={setCreateLeadId}
        onDueDateChange={setCreateDueDate}
        onSubmit={handleCreateProject}
        leadOptions={leadOptions}
      />

      <DeleteProjectModal
        project={deleteProject}
        open={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        saving={actionSaving}
        onConfirm={handleDeleteConfirm}
      />

      <EditProjectModal
        open={!!editProject}
        onClose={() => setEditProject(null)}
        saving={editSaving}
        name={editName}
        description={editDescription}
        leadId={editLeadId}
        dueDate={editDueDate}
        onNameChange={setEditName}
        onDescriptionChange={setEditDescription}
        onLeadIdChange={setEditLeadId}
        onDueDateChange={setEditDueDate}
        onSubmit={handleEditSave}
        leadOptions={leadOptions}
      />

      <SuspendProjectModal
        project={suspendProject}
        open={!!suspendProject}
        onClose={() => setSuspendProject(null)}
        saving={actionSaving}
        onConfirm={handleSuspendConfirm}
      />

      <ProjectListAnalyticsModal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        chartDataByProject={chartDataByProject}
        trendData={trendData}
        chartColors={chartColors}
      />
    </>
  )
}

export default ProjectList
