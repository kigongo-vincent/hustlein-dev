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
  Cell,
} from 'recharts'
import { baseFontSize } from '../../components/base/Text'
import { Button, Card, Modal, EmptyState } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { chartTickStyle } from './utils'

type ChartBarItem = { name: string; tasks: number; fullName: string }
type TrendItem = { month: string; projects: number }

type ProjectListAnalyticsModalProps = {
  open: boolean
  onClose: () => void
  chartDataByProject: ChartBarItem[]
  trendData: TrendItem[]
  chartColors: string[]
}

const ProjectListAnalyticsModal = ({
  open,
  onClose,
  chartDataByProject,
  trendData,
  chartColors,
}: ProjectListAnalyticsModalProps) => {
  const { current, mode } = Themestore()
  const dark = current?.system?.dark
  const primaryColor = current?.brand?.primary ?? '#682308'
  const chartPrimary = mode === 'dark' ? (dark ?? '#e0e0e0') : primaryColor
  const gridColor = current?.system?.dark ? `${current.system.dark}40` : 'rgba(0,0,0,0.08)'
  const tickProps = current?.system?.dark ? { ...chartTickStyle, fill: current.system.dark } : chartTickStyle
  const tooltipCursor =
    mode === 'dark'
      ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)', stroke: current?.system?.border ?? 'rgba(255,255,255,0.08)' }
      : { fill: 'rgba(0,0,0,0.04)', stroke: current?.system?.border ?? 'rgba(0,0,0,0.1)' }

  return (
    <Modal open={open} onClose={onClose} variant="wide">
      <div className="min-w-0 w-full flex flex-col flex-1 min-h-0 p-6" style={{ backgroundColor: current?.system?.foreground }}>
        <h2 className="font-bold mb-4" style={{ fontSize: baseFontSize * 1.5, color: dark }}>
          Project analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <Card title="Tasks per project" subtitle="Task count by project" className="px-4 pb-4">
            <div className="h-[280px] w-full">
              {chartDataByProject.length === 0 ? (
                <EmptyState variant="chart" compact description="No data yet" className="h-full min-h-[200px]" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByProject} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" tick={tickProps} />
                    <YAxis tick={tickProps} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [Number(value ?? 0), 'Tasks']}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
                      contentStyle={{
                        fontSize: baseFontSize * 1.08,
                        backgroundColor: current?.system?.foreground,
                        border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 4,
                        color: dark,
                      }}
                      cursor={tooltipCursor}
                    />
                    <Bar key="tasks" dataKey="tasks" radius={[4, 4, 0, 0]}>
                      {chartDataByProject.map((_, index) => (
                        <Cell key={index} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
          <Card title="Projects over time" subtitle="New projects by month" className="px-4 pb-4">
            <div className="h-[280px] w-full">
              {trendData.length === 0 ? (
                <EmptyState variant="chart" compact description="No data yet" className="h-full min-h-[200px]" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={tickProps} />
                    <YAxis tick={tickProps} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [Number(value ?? 0), 'Projects']}
                      contentStyle={{
                        fontSize: baseFontSize * 1.08,
                        backgroundColor: current?.system?.foreground,
                        border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 4,
                        color: dark,
                      }}
                      cursor={tooltipCursor}
                    />
                    <Line
                      type="monotone"
                      dataKey="projects"
                      stroke={chartPrimary}
                      strokeWidth={2}
                      name="Projects"
                      dot={{ fill: chartPrimary, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        <footer className="flex justify-end pt-4 mt-4 border-t shrink-0" style={{ borderColor: current?.system?.border }}>
          <Button variant="background" label="Close" onClick={onClose} />
        </footer>
      </div>
    </Modal>
  )
}

export default ProjectListAnalyticsModal
