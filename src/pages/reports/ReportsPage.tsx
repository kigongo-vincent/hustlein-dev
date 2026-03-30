import { useCallback, useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Text, { baseFontSize } from '../../components/base/Text'
import { ListTodo, CheckCircle, FolderKanban, BarChart3, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button, Card, CustomSelect, EmptyState } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { reportService, projectService } from '../../services'
import { Themestore } from '../../data/Themestore'
import type { StatCard, TaskCompletionByOwner, Project } from '../../types'

const chartTickStyle = { fontSize: baseFontSize }

function getStatIcon(label: string) {
  const n = label.toLowerCase()
  if (n.includes('task')) return <ListTodo />
  if (n.includes('complet')) return <CheckCircle />
  if (n.includes('project')) return <FolderKanban />
  return <BarChart3 />
}

const ReportsPage = () => {
  const { current } = Themestore()
  const [stats, setStats] = useState<StatCard[]>([])
  const [byOwner, setByOwner] = useState<TaskCompletionByOwner[]>([])
  const [progressData, setProgressData] = useState<{ date: string; completed: number }[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSidebarExiting, setFilterSidebarExiting] = useState(false)
  const [filterSidebarEntered, setFilterSidebarEntered] = useState(false)
  const [draftProjectFilter, setDraftProjectFilter] = useState('')
  const FILTER_SIDEBAR_DURATION_MS = 220
  const primaryColor = current?.brand?.primary || '#682308'
  const dark = current?.system?.dark
  const mode = Themestore((s) => s.mode)
  const chartPrimary = mode === 'dark' ? (dark ?? '#e0e0e0') : primaryColor
  const gridColor = dark ? `${dark}40` : 'rgba(0,0,0,0.08)'
  const barMuted = dark ? `${dark}60` : 'rgba(0,0,0,0.2)'
  const tickProps = dark ? { ...chartTickStyle, fill: dark } : chartTickStyle
  const tooltipCursor =
    mode === 'dark'
      ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)', stroke: current?.system?.border ?? 'rgba(255,255,255,0.08)' }
      : { fill: 'rgba(0,0,0,0.04)', stroke: current?.system?.border ?? 'rgba(0,0,0,0.1)' }

  useEffect(() => {
    projectService.list().then(setProjects)
  }, [])

  useEffect(() => {
    const pid = projectFilter || undefined
    reportService.getStatCards(pid).then(setStats)
    reportService.getCompletionByOwner(pid).then(setByOwner)
    reportService.getProgressOverTime(pid).then(setProgressData)
  }, [projectFilter])

  useEffect(() => {
    if (filterOpen) {
      setFilterSidebarExiting(false)
      setFilterSidebarEntered(false)
      setDraftProjectFilter(projectFilter)
      const start = requestAnimationFrame(() => {
        requestAnimationFrame(() => setFilterSidebarEntered(true))
      })
      return () => cancelAnimationFrame(start)
    }
    setFilterSidebarEntered(false)
  }, [filterOpen, projectFilter])

  const closeFilterSidebar = useCallback(() => {
    setFilterSidebarExiting(true)
    const t = setTimeout(() => {
      setFilterOpen(false)
      setFilterSidebarExiting(false)
    }, FILTER_SIDEBAR_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]
  const searchLower = searchQuery.trim().toLowerCase()
  const visibleByOwner = byOwner.filter((r) => !searchLower || r.ownerName.toLowerCase().includes(searchLower))

  return (
    <AppPageLayout title="Reports" subtitle="Progress and completion by project">
      <div className="space-y-6">
      <div
        className="flex items-center rounded-base overflow-hidden"
        style={{ backgroundColor: current?.system?.foreground }}
        role="search"
      >
        <Search className="ml-3 w-4 h-4 opacity-60 shrink-0" style={{ color: dark }} aria-hidden />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search owner..."
          className="flex-1 min-w-0 py-2 pl-3 pr-4 bg-transparent focus:outline-none focus:ring-0 border-0 placeholder:opacity-60"
          style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
          aria-label="Search report owners"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} className="shrink-0 opacity-35 hover:opacity-80 transition-opacity mr-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} title={s.label} rightIcon={getStatIcon(s.label)}>
            <Text className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
              {s.value}
            </Text>
          </Card>
        ))}
      </div>
      <Card title="Progress over time" subtitle="Completed tasks by date">
        {progressData.length === 0 ? (
          <EmptyState variant="chart" compact description="No data yet." className="py-8 min-h-[200px]" />
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartPrimary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={chartPrimary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={tickProps} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={tickProps} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number | undefined) => [value ?? 0, 'Completed']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    fontSize: baseFontSize,
                    backgroundColor: current?.system?.foreground,
                    border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 4,
                    color: current?.system?.dark,
                  }}
                  cursor={tooltipCursor}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke={chartPrimary}
                  strokeWidth={2}
                  fill="url(#progressGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <Card title="Task completion by owner" subtitle="Completed vs total tasks">
        {visibleByOwner.length === 0 ? (
          <EmptyState variant="chart" compact description="No data yet." className="py-8 min-h-[200px]" />
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={visibleByOwner.map((r) => ({ name: r.ownerName, completed: r.completed, total: r.total }))}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={tickProps} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={tickProps} />
                <Tooltip
                  formatter={(value: number | undefined, name?: string) => [value ?? 0, name === 'completed' ? 'Completed' : 'Total']}
                  contentStyle={{
                    fontSize: baseFontSize,
                    backgroundColor: current?.system?.foreground,
                    border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 4,
                    color: current?.system?.dark,
                  }}
                  cursor={tooltipCursor}
                />
                <Bar dataKey="completed" name="completed" fill={chartPrimary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="total" name="total" fill={barMuted} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {visibleByOwner.length > 0 && (
          <table className="w-full mt-4 text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-2 pr-4">
                  <Text variant="sm" className="font-medium">Owner</Text>
                </th>
                <th className="py-2 pr-4">
                  <Text variant="sm" className="font-medium">Completed</Text>
                </th>
                <th className="py-2">
                  <Text variant="sm" className="font-medium">Total</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleByOwner.map((r) => (
                <tr key={r.ownerId} className="border-b border-black/5">
                  <td className="py-2 pr-4"><Text variant="sm">{r.ownerName}</Text></td>
                  <td className="py-2 pr-4"><Text variant="sm">{r.completed}</Text></td>
                  <td className="py-2"><Text variant="sm">{r.total}</Text></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
            aria-label="Filter reports"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: current?.system?.border }}>
              <Text className="font-medium">Filters</Text>
              <button type="button" onClick={closeFilterSidebar} className="p-2 rounded-base opacity-80 hover:opacity-100" style={{ color: current?.system?.dark }} aria-label="Close filters">
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
              <div className="pt-3 mt-1 space-y-3 border-t" style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)' }}>
                <Button
                  size="sm"
                  fullWidth
                  label="Apply filters"
                  onClick={() => {
                    setProjectFilter(draftProjectFilter)
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
                    setProjectFilter('')
                  }}
                  disabled={!projectFilter && !draftProjectFilter}
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

export default ReportsPage
