import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Badge, Button, CustomSelect } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { taskService, userService, projectService } from '../../services'
import type { Task, Project } from '../../types'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Themestore } from '../../data/Themestore'

const TaskList = () => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const [searchParams, setSearchParams] = useSearchParams()
  const ownerIdFromUrl = searchParams.get('ownerId') ?? ''

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [owners, setOwners] = useState<Record<string, string>>({})
  const [stateNames, setStateNames] = useState<Record<string, string>>({})
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [ownerFilter, setOwnerFilter] = useState<string>(ownerIdFromUrl)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSidebarExiting, setFilterSidebarExiting] = useState(false)
  const [filterSidebarEntered, setFilterSidebarEntered] = useState(false)
  const [draftProjectFilter, setDraftProjectFilter] = useState('')
  const [draftOwnerFilter, setDraftOwnerFilter] = useState(ownerIdFromUrl)
  const FILTER_SIDEBAR_DURATION_MS = 220

  useEffect(() => {
    setOwnerFilter((prev) => ownerIdFromUrl || prev)
    setDraftOwnerFilter((prev) => ownerIdFromUrl || prev)
  }, [ownerIdFromUrl])

  useEffect(() => {
    if (filterOpen) {
      setFilterSidebarExiting(false)
      setFilterSidebarEntered(false)
      setDraftProjectFilter(projectFilter)
      setDraftOwnerFilter(ownerFilter)
      const start = requestAnimationFrame(() => {
        requestAnimationFrame(() => setFilterSidebarEntered(true))
      })
      return () => cancelAnimationFrame(start)
    }
    setFilterSidebarEntered(false)
  }, [filterOpen, projectFilter, ownerFilter])

  const closeFilterSidebar = useCallback(() => {
    setFilterSidebarExiting(true)
    const t = setTimeout(() => {
      setFilterOpen(false)
      setFilterSidebarExiting(false)
    }, FILTER_SIDEBAR_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    taskService.list().then(setTasks)
    projectService.list().then(async (list) => {
      setProjects(list)
      const workflowMap: Record<string, string> = {}
      await Promise.all(
        list.map(async (p) => {
          try {
            const wf = await projectService.getWorkflow(p.id)
            if (!wf) return
            wf.states.forEach((s) => {
              workflowMap[s.id] = s.name
            })
          } catch {
            // Ignore missing workflow for legacy projects
          }
        })
      )
      setStateNames(workflowMap)
    })
    userService.list().then((users) => {
      const map: Record<string, string> = {}
      users.forEach((u) => (map[u.id] = u.name))
      setOwners(map)
    })
  }, [])

  const filtered = tasks.filter((t) => {
    const matchProject = !projectFilter || t.projectId === projectFilter
    const matchOwner = !ownerFilter || t.ownerId === ownerFilter
    const matchSearch =
      !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchProject && matchOwner && matchSearch
  })

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  const ownerOptions = [
    { value: '', label: 'All owners' },
    ...Object.entries(owners).map(([id, name]) => ({ value: id, label: name })),
  ]

  const handleOwnerChange = (value: string) => {
    setOwnerFilter(value)
    if (value) {
      searchParams.set('ownerId', value)
      setSearchParams(searchParams, { replace: true })
    } else {
      searchParams.delete('ownerId')
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <AppPageLayout title="Tasks" subtitle="Filter and manage tasks">
      <div className="space-y-6">
      <div className="flex items-center rounded-base overflow-hidden" style={{ backgroundColor: current?.system?.foreground }} role="search">
        <Search className="ml-3 w-4 h-4 opacity-60 shrink-0" style={{ color: dark }} aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search task title..."
          className="flex-1 min-w-0 py-2 pl-3 pr-4 bg-transparent focus:outline-none focus:ring-0 border-0 placeholder:opacity-60"
          style={{ color: dark }}
          aria-label="Search tasks"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="shrink-0 opacity-35 hover:opacity-80 transition-opacity mr-2">
            <X className="w-3.5 h-3.5" style={{ color: dark }} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="shrink-0 p-2.5 transition-opacity hover:opacity-100 opacity-90"
          style={{ color: dark, backgroundColor: filterOpen ? current?.system?.background : 'transparent' }}
          title="Filter"
          aria-label="Open filters"
          aria-expanded={filterOpen}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
      <Card title="Task list" subtitle={`${filtered.length} tasks`}>
        <View bg="fg" noShadow className="rounded-base overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                {['Title', 'Owner', 'Priority', 'Due date', 'State'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 border-b">
                    <Text variant="sm" className="font-medium">
                      {h}
                    </Text>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2">
                    <Text variant="sm">{t.title}</Text>
                  </td>
                  <td className="px-4 py-2">
                    <Text variant="sm">{owners[t.ownerId] ?? '—'}</Text>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={t.priority}>{t.priority}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Text variant="sm">{t.dueDate ?? '—'}</Text>
                  </td>
                  <td className="px-4 py-2">
                    <Text variant="sm">{stateNames[t.workflowStateId] ?? '—'}</Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </View>
      </Card>
      {(filterOpen || filterSidebarExiting) && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 z-40 transition-opacity ease-out"
            style={{
              backgroundColor: 'rgba(0,0,0,0.35)',
              opacity: filterSidebarEntered && !filterSidebarExiting ? 1 : 0,
              transitionDuration: `${FILTER_SIDEBAR_DURATION_MS}ms`,
            }}
            onClick={closeFilterSidebar}
            aria-hidden
          />
          <aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col shadow-lg transition-transform ease-out"
            style={{
              backgroundColor: current?.system?.foreground ?? '#fff',
              borderLeft: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
              transform: filterSidebarEntered && !filterSidebarExiting ? 'translateX(0)' : 'translateX(100%)',
              transitionDuration: `${FILTER_SIDEBAR_DURATION_MS}ms`,
            }}
            aria-label="Filter tasks"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: current?.system?.border }}>
              <Text className="font-medium">Filters</Text>
              <button type="button" onClick={closeFilterSidebar} className="p-2 rounded-base opacity-80 hover:opacity-100" style={{ color: dark }} aria-label="Close filters">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto scroll-slim flex-1 min-h-0 space-y-5">
              <CustomSelect
                label="Project"
                options={projectOptions}
                value={draftProjectFilter}
                onChange={setDraftProjectFilter}
                mode="fill"
                placement="below"
              />
              <CustomSelect
                label="Owner"
                options={ownerOptions}
                value={draftOwnerFilter}
                onChange={setDraftOwnerFilter}
                mode="fill"
                placement="below"
              />
              <div className="pt-3 mt-1 space-y-3 border-t" style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)' }}>
                <Button
                  size="sm"
                  fullWidth
                  label="Apply filters"
                  onClick={() => {
                    setProjectFilter(draftProjectFilter)
                    handleOwnerChange(draftOwnerFilter)
                    closeFilterSidebar()
                  }}
                />
                <Button
                  size="sm"
                  fullWidth
                  variant="background"
                  label="Reset filters"
                  onClick={() => {
                    setDraftProjectFilter('')
                    setDraftOwnerFilter('')
                    setProjectFilter('')
                    handleOwnerChange('')
                  }}
                  disabled={!projectFilter && !ownerFilter && !draftProjectFilter && !draftOwnerFilter}
                />
              </div>
            </div>
          </aside>
        </>
      )}
      </div>
    </AppPageLayout>
  )
}

export default TaskList
