import { useCallback, useEffect, useMemo, useState } from 'react'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button, Input, Badge, LogTimeModal } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { taskService, projectService, userService } from '../../services'
import type { Task, Project } from '../../types'
import { Search, SlidersHorizontal, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const FILTER_SIDEBAR_DURATION_MS = 280

export default function ConsultantTasksPage() {
  const { current } = Themestore()
  const user = Authstore((s) => s.user)
  const dark = current?.system?.dark
  const primary = current?.brand?.primary ?? '#682308'
  const secondary = current?.brand?.secondary ?? '#FF9600'
  const borderColor = current?.system?.border ?? 'rgba(0,0,0,0.1)'

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Record<string, Project>>({})
  const [projectList, setProjectList] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSidebarExiting, setFilterSidebarExiting] = useState(false)
  const [logTimeOpen, setLogTimeOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const taskList = await taskService.listByOwner(user.id)
      setTasks(taskList)
      const projectIds = [...new Set(taskList.map((t) => t.projectId).filter(Boolean))]
      const projResults = await Promise.all(projectIds.map((id) => projectService.get(id)))
      const projList = projResults.filter((p): p is Project => p != null)
      const byId: Record<string, Project> = {}
      projList.forEach((p) => {
        byId[p.id] = p
      })
      setProjects(byId)
      setProjectList(projList)
    } catch {
      setTasks([])
      setProjectList([])
      setProjects({})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const searchLower = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchProject = !projectFilter || t.projectId === projectFilter
      const matchSearch =
        !searchLower ||
        (t.title ?? '').toLowerCase().includes(searchLower) ||
        (projects[t.projectId]?.name ?? '').toLowerCase().includes(searchLower)
      return matchProject && matchSearch
    })
  }, [tasks, projectFilter, searchLower, projects])

  const chartByProject = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach((t) => {
      const name = projects[t.projectId]?.name ?? t.projectId ?? 'Unknown'
      counts[name] = (counts[name] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, count, fullName: name }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [tasks, projects])

  const chartByWeek = useMemo(() => {
    const byWeek: Record<string, number> = {}
    tasks.forEach((t) => {
      const created = t.createdAt ?? ''
      if (!created) return
      const d = new Date(created)
      const start = new Date(d)
      start.setDate(d.getDate() - d.getDay())
      const key = start.toISOString().slice(0, 10)
      byWeek[key] = (byWeek[key] ?? 0) + 1
    })
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([week, count]) => ({
        week: new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count,
      }))
  }, [tasks])

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'All projects' },
      ...projectList.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projectList]
  )

  const closeFilterSidebar = useCallback(() => {
    setFilterSidebarExiting(true)
    const t = setTimeout(() => {
      setFilterOpen(false)
      setFilterSidebarExiting(false)
    }, FILTER_SIDEBAR_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  const gridColor = dark ? `${dark}40` : 'rgba(0,0,0,0.08)'
  const tooltipStyle = {
    fontSize: 13,
    backgroundColor: current?.system?.foreground ?? '#fff',
    border: `1px solid ${borderColor}`,
    borderRadius: 4,
    color: dark,
  }

  return (
    <AppPageLayout title="Tasks" subtitle="Your tasks and time logs">
      <div className="w-full flex flex-col gap-4 min-h-0 flex-1">
        <View bg="fg" className="p-3 rounded-base shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Text className="font-medium" style={{ color: dark }}>
                My tasks
              </Text>
              <Text variant="sm" className="opacity-80 mt-0.5 block" style={{ color: dark }}>
                View and filter your logged tasks; log time from the header.
              </Text>
            </div>
            <Button
              label="Log time"
              startIcon={<Clock className="w-4 h-4 shrink-0" />}
              onClick={() => setLogTimeOpen(true)}
            />
          </div>
        </View>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Tasks by project" subtitle="Your tasks per project" className="p-4">
            {chartByProject.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center opacity-70" style={{ color: dark }}>
                <Text variant="sm">No tasks yet</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartByProject} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: dark }} />
                  <YAxis tick={{ fontSize: 11, fill: dark }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill={primary} radius={[4, 4, 0, 0]} name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card title="Tasks over time" subtitle="Created per week" className="p-4">
            {chartByWeek.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center opacity-70" style={{ color: dark }}>
                <Text variant="sm">No tasks yet</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartByWeek} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: dark }} />
                  <YAxis tick={{ fontSize: 11, fill: dark }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke={secondary} strokeWidth={2} dot={{ r: 3 }} name="Tasks" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card
          className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col"
          titleSuffix={
            <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
              <div
                className="flex items-center flex-1 min-w-0 rounded-base overflow-hidden"
                style={{ border: `1px solid ${borderColor}` }}
              >
                <div className="flex-1 min-w-0 relative flex items-center">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none shrink-0"
                    style={{ color: dark }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or project…"
                    className="w-full py-2 pl-9 pr-3 bg-transparent focus:outline-none focus:ring-0 border-0 placeholder:opacity-60"
                    style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
                    aria-label="Search tasks"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="shrink-0 p-2.5 transition-opacity hover:opacity-100 opacity-90"
                  style={{
                    color: dark,
                    backgroundColor: filterOpen ? current?.system?.background : 'transparent',
                  }}
                  title="Filter"
                  aria-label="Open filters"
                  aria-expanded={filterOpen}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
              <div className="shrink-0" style={{ fontSize: baseFontSize, color: dark }}>
                {loading ? '—' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          }
        >
          <div className="flex-1 min-h-0 overflow-auto scroll-slim">
            <table className="w-full border-collapse" style={{ borderColor }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <th className="text-left py-2.5 px-3 font-medium" style={{ fontSize: baseFontSize, color: dark }}>
                    Title
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium" style={{ fontSize: baseFontSize, color: dark }}>
                    Project
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium w-24" style={{ fontSize: baseFontSize, color: dark }}>
                    Priority
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium w-28" style={{ fontSize: baseFontSize, color: dark }}>
                    Due date
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium w-24" style={{ fontSize: baseFontSize, color: dark }}>
                    State
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <td className="py-2 px-3">
                        <div className="h-4 w-48 rounded bg-black/10 animate-pulse" />
                      </td>
                      <td className="py-2 px-3">
                        <div className="h-4 w-32 rounded bg-black/10 animate-pulse" />
                      </td>
                      <td className="py-2 px-3">
                        <div className="h-5 w-16 rounded bg-black/10 animate-pulse" />
                      </td>
                      <td className="py-2 px-3">
                        <div className="h-4 w-20 rounded bg-black/10 animate-pulse" />
                      </td>
                      <td className="py-2 px-3">
                        <div className="h-4 w-16 rounded bg-black/10 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center opacity-70" style={{ color: dark }}>
                      No tasks match your search or filters. Log time to create tasks.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t hover:opacity-90"
                      style={{ borderColor, backgroundColor: current?.system?.foreground }}
                    >
                      <td className="py-2 px-3" style={{ fontSize: baseFontSize, color: dark }}>
                        {t.title}
                      </td>
                      <td className="py-2 px-3" style={{ fontSize: baseFontSize, color: dark }}>
                        {projects[t.projectId]?.name ?? t.projectId ?? '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={t.priority ?? 'medium'}>{t.priority ?? 'medium'}</Badge>
                      </td>
                      <td className="py-2 px-3" style={{ fontSize: baseFontSize, color: dark }}>
                        {t.dueDate ?? '—'}
                      </td>
                      <td className="py-2 px-3" style={{ fontSize: baseFontSize, color: dark }}>
                        {t.workflowStateId ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {filterOpen && (
          <div
            className="fixed inset-0 z-40 md:z-30"
            aria-hidden
            onClick={closeFilterSidebar}
          />
        )}
        <div
          className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-lg flex flex-col transition-transform duration-200 ease-out ${
            filterOpen ? 'translate-x-0' : 'translate-x-full'
          } ${filterSidebarExiting ? 'translate-x-full' : ''}`}
          style={{
            backgroundColor: current?.system?.foreground,
            borderLeft: `1px solid ${borderColor}`,
          }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor }}>
            <Text className="font-medium" style={{ color: dark }}>
              Filters
            </Text>
            <button
              type="button"
              onClick={closeFilterSidebar}
              className="p-2 rounded-base opacity-80 hover:opacity-100"
              style={{ color: dark }}
              aria-label="Close filters"
            >
              ×
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium" style={{ color: dark }}>
                Project
              </label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-base border bg-transparent focus:outline-none focus:ring-2"
                style={{ fontSize: baseFontSize, color: dark, borderColor }}
              >
                {projectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              label="Reset filters"
              onClick={() => {
                setProjectFilter('')
                setSearch('')
              }}
            />
          </div>
        </div>
      </div>

      <LogTimeModal
        open={logTimeOpen}
        onClose={() => setLogTimeOpen(false)}
        onSaved={() => loadData()}
      />
    </AppPageLayout>
  )
}
