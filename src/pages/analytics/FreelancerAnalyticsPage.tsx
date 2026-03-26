import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import View from '../../components/base/View'
import Text, { baseFontSize } from '../../components/base/Text'
import { Card, Skeleton } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { assignmentService, marketplaceService, taskService } from '../../services'
import type { Task } from '../../types'
import { Activity, Sparkles, BriefcaseBusiness, Inbox, ListTodo } from 'lucide-react'

type Stat = { label: string; value: string; caption: string; icon: React.ReactNode; tint: string }

function safeIsoDay(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function FreelancerAnalyticsPage() {
  const { current, mode } = Themestore()
  const user = Authstore((s) => s.user)
  const dark = current?.system?.dark

  const primary = current?.brand?.primary ?? current?.system?.dark ?? '#111827'
  const secondary = current?.brand?.secondary ?? current?.system?.foreground ?? '#111827'
  const neutralBg = current?.system?.background ?? 'rgba(0,0,0,0.04)'

  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [contractsCount, setContractsCount] = useState(0)
  const [applicationsCount, setApplicationsCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        if (!user?.id) return
        const [contracts, apps, myTasks] = await Promise.all([
          assignmentService.listMine().catch(() => []),
          marketplaceService.listMyApplications().catch(() => []),
          taskService.listByOwner(user.id).catch(() => []),
        ])
        if (cancelled) return
        setContractsCount(contracts.filter((c) => c.status === 'active').length)
        setApplicationsCount(apps.filter((a) => a.status !== 'withdrawn').length)
        setTasks(myTasks)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const stats: Stat[] = useMemo(() => {
    const base = [
      {
        label: 'Active contracts',
        value: String(contractsCount),
        caption: 'Across companies',
        icon: <BriefcaseBusiness className="w-5 h-5" />,
        tint: primary,
      },
      {
        label: 'Applications',
        value: String(applicationsCount),
        caption: 'Not withdrawn',
        icon: <Inbox className="w-5 h-5" />,
        tint: secondary,
      },
      {
        label: 'My tasks',
        value: String(tasks.length),
        caption: 'Assigned work',
        icon: <ListTodo className="w-5 h-5" />,
        tint: primary,
      },
      {
        label: 'Momentum',
        value: tasks.length > 0 ? 'Good' : '—',
        caption: 'Keep it rolling',
        icon: <Activity className="w-5 h-5" />,
        tint: secondary,
      },
    ] satisfies Stat[]
    return base
  }, [contractsCount, applicationsCount, tasks.length, primary, secondary])

  const chartData = useMemo(() => {
    const now = new Date()
    const days: { day: string; tasks: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = safeIsoDay(d)
      const count = tasks.filter((t) => (t.createdAt ?? '').slice(0, 10) === key).length
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        tasks: count,
      })
    }
    return days
  }, [tasks])

  const gridColor = dark ? `${dark}35` : 'rgba(0,0,0,0.08)'
  const tooltipContentStyle = {
    fontSize: 12,
    backgroundColor: current?.system?.foreground,
    borderRadius: 6,
    color: dark,
  }
  const tooltipCursor =
    mode === 'dark'
      ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)' }
      : { fill: 'rgba(0,0,0,0.04)' }

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="bg" className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-base flex items-center justify-center"
                style={{ backgroundColor: neutralBg }}
              >
                <Sparkles className="w-5 h-5" style={{ color: current?.system?.dark ?? undefined }} />
              </span>
              <div className="min-w-0">
                <Text className="font-medium">Analytics</Text>
                <Text variant="sm" className="opacity-80">
                  A quick pulse check on your freelance work.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </View>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i} className="min-h-[7rem] py-4 px-4" noShadow>
                <Skeleton height="h-4" width="w-28" className="mb-2" />
                <Skeleton height="h-8" width="w-16" />
              </Card>
            ))
          : stats.map((s) => (
              <Card
                key={s.label}
                title={s.label}
                subtitle={s.caption}
                rightIcon={
                  <span
                    className="w-9 h-9 rounded-base flex items-center justify-center"
                    style={{ backgroundColor: neutralBg, color: s.tint }}
                  >
                    {s.icon}
                  </span>
                }
                className="min-h-[7rem] py-4 px-4"
                noShadow
              >
                <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
                  {s.value}
                </Text>
              </Card>
            ))}
      </div>

      <Card title="Tasks created (last 7 days)" subtitle="A simple momentum signal" className="px-4 pb-4" noShadow>
        <div className="h-[280px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton height="h-48" width="w-3/4" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: dark }} />
                <YAxis tick={{ fontSize: 12, fill: dark }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipContentStyle} cursor={tooltipCursor} />
                <Legend wrapperStyle={{ fontSize: 12, ...(dark ? { color: dark } : {}) }} />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke={secondary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  )
}

