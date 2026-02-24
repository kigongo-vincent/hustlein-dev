import { useEffect, useState } from 'react'
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
import { Card, Button, Skeleton, AddConsultantModal } from '../../components/ui'
import { reportService, projectService } from '../../services'
import { Themestore } from '../../data/Themestore'
import type { StatCard } from '../../types'
import { ListTodo, CheckCircle, FolderKanban, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import View from '../../components/base/View'

const chartTickStyle = { fontSize: 12 }
const legendStyle = { fontSize: 12 }

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m) return [0, 0, 0]
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)]
}

function mixHex(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/** Build chart bar colors as variants between primary and secondary */
function getChartColors(primary: string, secondary: string, count = 4): string[] {
  const primaryHex = primary || '#682308'
  const secondaryHex = secondary || '#FF9600'
  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1)
    colors.push(mixHex(primaryHex, secondaryHex, t))
  }
  return colors
}

const STAT_CAPTIONS: Record<string, string> = {
  'Total tasks': 'Across all projects',
  'Completed': 'Done this period',
  'Overdue': 'Past due date',
  'Projects': 'Active projects',
}

function getStatIcon(label: string) {
  const n = label.toLowerCase()
  if (n.includes('task')) return <ListTodo />
  if (n.includes('complet')) return <CheckCircle />
  if (n.includes('project')) return <FolderKanban />
  return <BarChart3 />
}

const Dashboard = () => {
  const { current } = Themestore()
  const [stats, setStats] = useState<StatCard[]>([])
  const [projectCount, setProjectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addConsultantOpen, setAddConsultantOpen] = useState(false)

  useEffect(() => {
    let done = 0
    const onDone = () => {
      done += 1
      if (done >= 2) setLoading(false)
    }
    reportService.getStatCards().then((s) => { setStats(s); onDone() })
    projectService.list().then((list) => { setProjectCount(list.length); onDone() })
  }, [])

  const chartData = [
    ...stats.map((s) => ({ name: s.label.replace(' ', '\n'), value: Number(s.value) })),
    { name: 'Projects', value: projectCount },
  ]

  // Data for the two extra graphs (same row)
  const trendData = [
    { week: 'W1', tasks: 12, completed: 8 },
    { week: 'W2', tasks: 18, completed: 14 },
    { week: 'W3', tasks: 15, completed: 12 },
    { week: 'W4', tasks: 22, completed: 19 },
  ]
  const departmentDataFull = [
    { name: 'Engineering', tasks: 42, consultants: 8 },
    { name: 'Operations', tasks: 28, consultants: 5 },
    { name: 'Sales', tasks: 18, consultants: 4 },
  ]
  const departmentData = departmentDataFull.slice(0, 3)

  const gridColor = current?.system?.dark ? `${current.system.dark}18` : 'rgba(0,0,0,0.08)'
  const chartColors = getChartColors(
    current?.brand?.primary ?? '#682308',
    current?.brand?.secondary ?? '#FF9600',
    Math.max(chartData.length, 4)
  )
  const primaryColor = current?.brand?.primary ?? '#682308'
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'

  return (
    <div className="w-full  mx-auto space-y-4">
      <View bg='bg' className='p-3'>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Text className="font-medium">Dashboard</Text>
            <Text variant="sm" className="opacity-80">manage all your consultants and departments at one glance</Text>
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            <Button size="sm" label="Create consultant" onClick={() => setAddConsultantOpen(true)} />
            {/* <Link to="/app/projects" className="inline-flex shrink-0">
              <Button variant="primary" size="sm" label="Create project" startIcon={<FolderPlus className="w-4 h-4 shrink-0" />} />
            </Link> */}
          </div>
        </div>
        <AddConsultantModal
          open={addConsultantOpen}
          onClose={() => setAddConsultantOpen(false)}
        />
      </View>
      {/* <Text className="opacity-80">
        Welcome back, {user?.name}.
      </Text> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="min-h-[7rem] py-4 px-4">
                <Skeleton height="h-4" width="w-24" className="mb-2" />
                <Skeleton height="h-4" width="w-16" className="mb-1" />
                <Skeleton height="h-8" width="w-12" />
              </Card>
            ))}
          </>
        ) : (
          <>
            {stats.map((s) => (
              <Card
                key={s.label}
                title={s.label}
                rightIcon={getStatIcon(s.label)}
                className="min-h-[7rem] py-4 px-4"
              >
                <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>{s.value}</Text>
                <div className="flex items-baseline justify-between gap-2 mt-0.5">
                  <Text variant="sm" className="opacity-55">{STAT_CAPTIONS[s.label]}</Text>
                  {s.trend != null && s.trend !== 'neutral' && s.trendPercent != null && (
                    <span className="flex items-center gap-0.5 text-sm shrink-0" style={{ color: s.trend === 'up' ? current?.system?.success : current?.system?.error }}>
                      {s.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{s.trendPercent > 0 ? `+${s.trendPercent}%` : `${s.trendPercent}%`}</span>
                    </span>
                  )}
                </div>
              </Card>
            ))}
            <Card
              title="Projects"
              rightIcon={<FolderKanban />}
              className="min-h-[7rem] py-4 px-4"
            >
              <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>{projectCount}</Text>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <Text variant="sm" className="opacity-55">{STAT_CAPTIONS['Projects']}</Text>
                <span className="flex items-center gap-0.5 text-sm shrink-0 opacity-70" style={{ color: current?.system?.dark }}>
                  <TrendingUp size={14} />
                  <span>+2%</span>
                </span>
              </div>
            </Card>
          </>
        )}
      </div>
      {/* Row 1: Two extra graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card key="weekly-trend" title="Weekly trend" subtitle="Tasks vs completed" className="px-4 pb-4">
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                {[50, 70, 60, 85].map((pct, i) => (
                  <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key="weekly-trend">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="week" tick={chartTickStyle} />
                  <YAxis tick={chartTickStyle} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 13.5,
                      backgroundColor: current?.system?.background ?? undefined,
                      border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                      borderRadius: 4,
                    }}
                  />
                  <Legend wrapperStyle={legendStyle} />
                  <Line key="tasks" type="monotone" dataKey="tasks" stroke={primaryColor} strokeWidth={2} dot={{ r: 4 }} name="Tasks" />
                  <Line key="completed" type="monotone" dataKey="completed" stroke={secondaryColor} strokeWidth={2} dot={{ r: 4 }} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card key="by-department" title="By department" subtitle="Workload and headcount per team (max 3)" className="px-4 pb-4">
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                {[60, 80, 70].map((pct, i) => (
                  <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key="by-department">
                <BarChart data={departmentData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={chartTickStyle} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={chartTickStyle} width={80} />
                  <Tooltip
                    formatter={(value: number | undefined, name?: string) => [value ?? 0, name ?? '']}
                    contentStyle={{
                      fontSize: 13.5,
                      backgroundColor: current?.system?.background ?? undefined,
                      border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                      borderRadius: 4,
                    }}
                  />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar key="tasks" dataKey="tasks" fill={primaryColor} radius={[0, 4, 4, 0]} name="Tasks" />
                  <Bar key="consultants" dataKey="consultants" fill={secondaryColor} radius={[0, 4, 4, 0]} name="Consultants" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Overview bar chart */}
      <Card key="overview" title="Overview" subtitle="Tasks and projects at a glance" className="px-4 pb-4">
        <div className="h-[320px] w-full">
          {loading ? (
            <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
              {[40, 65, 45, 80, 55].map((pct, i) => (
                <Skeleton key={i} height="h-8" className="max-w-full" style={{ width: `${pct}%` }} />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" key="overview">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" tick={chartTickStyle} />
                <YAxis tick={chartTickStyle} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number | undefined) => [value ?? 0, 'Count']}
                  contentStyle={{
                    fontSize: 13.5,
                    backgroundColor: current?.system?.background ?? undefined,
                    border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 4,
                  }}
                />
                <Legend
                  content={() => (
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 justify-center list-none m-0 p-0 text-xs">
                      {chartData.map((entry, index) => (
                        <li key={entry.name} className="flex items-center gap-1.5">
                          <span
                            className="shrink-0 rounded-sm"
                            style={{ width: 10, height: 10, backgroundColor: chartColors[index % chartColors.length] }}
                          />
                          <span>{entry.name.replace(/\n/g, ' ')}</span>
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
          )}
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
