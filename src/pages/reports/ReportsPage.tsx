import { useEffect, useState } from 'react'
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
import { ListTodo, CheckCircle, FolderKanban, BarChart3 } from 'lucide-react'
import { Card, Select } from '../../components/ui'
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

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  return (
    <AppPageLayout title="Reports" subtitle="Progress and completion by project">
      <div className="space-y-6">
      <div className="flex gap-4">
        <div className="min-w-[200px]">
          <Select
            label="Project"
            options={projectOptions}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          />
        </div>
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
          <Text variant="sm" className="opacity-70">
            No data yet.
          </Text>
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
        {byOwner.length === 0 ? (
          <Text variant="sm" className="opacity-70">
            No data yet.
          </Text>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byOwner.map((r) => ({ name: r.ownerName, completed: r.completed, total: r.total }))}
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
        {byOwner.length > 0 && (
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
              {byOwner.map((r) => (
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
      </div>
    </AppPageLayout>
  )
}

export default ReportsPage
