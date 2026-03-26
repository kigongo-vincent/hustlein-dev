import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import Text, { baseFontSize } from '../../components/base/Text'
import { Card, Skeleton } from '../../components/ui'
import { ListTodo, CheckCircle, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import View from '../../components/base/View'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { projectService, taskService } from '../../services'
import type { Project, Task } from '../../types'

const chartTickStyle = { fontSize: 12 }

interface StatCard {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  trendPercent: number
}

interface WeekData {
  day: string
  hours: number
}

function getStatIcon(label: string) {
  const n = label.toLowerCase()
  if (n.includes('task')) return <ListTodo />
  if (n.includes('complet')) return <CheckCircle />
  return <BarChart3 />
}

function getChartColors(primary: string, secondary: string, count = 4): string[] {
  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1)
    const r1 = parseInt(primary.slice(1, 3), 16)
    const g1 = parseInt(primary.slice(3, 5), 16)
    const b1 = parseInt(primary.slice(5, 7), 16)
    const r2 = parseInt(secondary.slice(1, 3), 16)
    const g2 = parseInt(secondary.slice(3, 5), 16)
    const b2 = parseInt(secondary.slice(5, 7), 16)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    colors.push(`#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`)
  }
  return colors
}

const STAT_CAPTIONS: Record<string, string> = {
  'Total projects': 'Across company',
  'Total tasks': 'All projects',
  'Tasks this week': 'Created this week',
  'Tasks last week': 'Previous week',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const ConsultantDashboard = () => {
  const { current, mode } = Themestore()
  const { user } = Authstore()
  const dark = current?.system?.dark
  const primaryColor = current?.brand?.primary ?? '#682308'
  const chartPrimary = mode === 'dark' ? (dark ?? '#e0e0e0') : primaryColor
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'
  const chartColors = getChartColors(chartPrimary, secondaryColor, 5)
  const gridColor = dark ? `${dark}40` : 'rgba(0,0,0,0.08)'
  const tickProps = dark ? { ...chartTickStyle, fill: dark } : chartTickStyle
  const tooltipContentStyle = {
    fontSize: 12,
    backgroundColor: current?.system?.foreground,
    border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
    borderRadius: 4,
    color: dark,
  }
  const tooltipCursor =
    mode === 'dark'
      ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)', stroke: current?.system?.border ?? 'rgba(255,255,255,0.08)' }
      : { fill: 'rgba(0,0,0,0.04)', stroke: current?.system?.border ?? 'rgba(0,0,0,0.1)' }
  const legendWrapperStyle = { fontSize: 12, ...(dark ? { color: dark } : {}) }

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.companyId) {
        setLoading(false)
        return
      }
      try {
        const [projectList, taskList] = await Promise.all([
          projectService.list(),
          taskService.list(),
        ])
        if (cancelled) return
        const byCompany = projectList.filter((p) => p.companyId === user.companyId)
        const projectIds = new Set(byCompany.map((p) => p.id))
        const companyTasks = taskList.filter((t) => projectIds.has(t.projectId))
        setProjects(byCompany)
        setTasks(companyTasks)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.companyId])

  const stats = useMemo((): StatCard[] => {
    const totalProjects = projects.length
    const totalTasks = tasks.length
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)
    const weekTasks = tasks.filter((t) => new Date(t.createdAt) >= thisWeekStart)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekTasks = tasks.filter(
      (t) => new Date(t.createdAt) >= lastWeekStart && new Date(t.createdAt) < thisWeekStart
    )
    const trend = weekTasks.length >= lastWeekTasks.length ? 'up' : 'down'
    const trendPercent =
      lastWeekTasks.length === 0 ? (weekTasks.length === 0 ? 0 : 100) : Math.round(((weekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100)
    return [
      { label: 'Total projects', value: String(totalProjects), trend: 'neutral', trendPercent: 0 },
      { label: 'Total tasks', value: String(totalTasks), trend: 'neutral', trendPercent: 0 },
      { label: 'Tasks this week', value: String(weekTasks.length), trend, trendPercent },
      { label: 'Tasks last week', value: String(lastWeekTasks.length), trend: 'neutral', trendPercent: 0 },
    ]
  }, [projects.length, tasks])

  const weekData = useMemo((): WeekData[] => {
    const byDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    tasks.forEach((t) => {
      const d = new Date(t.createdAt)
      byDay[d.getDay()] = (byDay[d.getDay()] ?? 0) + 1
    })
    return DAYS.map((day, i) => ({ day, hours: byDay[i] ?? 0 }))
  }, [tasks])

  const chartData = useMemo(() => stats.map((s) => ({ name: s.label, value: parseInt(s.value) || 0 })), [stats])

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="bg" className="p-3">
        <Text className="font-medium">Company Dashboard</Text>
        <Text variant="sm" className="opacity-80">
          overview of your projects, tasks, and progress
        </Text>
      </View>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="min-h-[7rem] py-4 px-4">
              <Skeleton height="h-4" width="w-24" className="mb-2" />
              <Skeleton height="h-8" width="w-16" />
            </Card>
          ))
        ) : (
          stats.map((s) => (
            <Card key={s.label} title={s.label} rightIcon={getStatIcon(s.label)} className="min-h-[7rem] py-4 px-4">
              <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
                {s.value}
              </Text>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <Text variant="sm" className="opacity-55">{STAT_CAPTIONS[s.label] ?? ''}</Text>
              {s.trend !== 'neutral' && (
                <span
                  className="flex items-center gap-0.5 text-sm shrink-0"
                  style={{ color: s.trend === 'up' ? (current?.system?.success ?? 'green') : (current?.system?.error ?? 'red') }}
                >
                  {s.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{s.trendPercent > 0 ? `+${s.trendPercent}%` : `${s.trendPercent}%`}</span>
                </span>
              )}
            </div>
          </Card>
          ))
        )}
      </div>

      {/* Tasks by day of week (created) */}
      <Card title="Tasks by day of week" subtitle="Tasks created by day" className="px-4 pb-4">
        <div className="h-[280px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton height="h-48" width="w-3/4" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" tick={tickProps} />
                <YAxis tick={tickProps} allowDecimals={false} />
                <Tooltip contentStyle={tooltipContentStyle} cursor={tooltipCursor} />
                <Legend wrapperStyle={legendWrapperStyle} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke={chartPrimary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Overview Bar Chart */}
      <Card title="Overview" subtitle="Stats at a glance" className="px-4 pb-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={tickProps} />
              <YAxis tick={tickProps} allowDecimals={false} />
              <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Count']} contentStyle={tooltipContentStyle} cursor={tooltipCursor} />
              <Legend
                content={() => (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 justify-center list-none m-0 p-0 text-xs" style={dark ? { color: dark } : undefined}>
                    {chartData.map((entry, index) => (
                      <li key={entry.name} className="flex items-center gap-1.5">
                        <span
                          className="shrink-0 rounded-sm"
                          style={{ width: 10, height: 10, backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span>{entry.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              />
              <Bar key="value" dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name ?? index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default ConsultantDashboard