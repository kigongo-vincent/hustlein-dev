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
import Text, { baseFontSize } from '../../components/base/Text'
import { Button, Card, Modal } from '../../components/ui'
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
  const { current } = Themestore()
  const dark = current?.system?.dark
  const primaryColor = current?.brand?.primary ?? '#682308'
  const gridColor = current?.system?.dark ? `${current.system.dark}18` : 'rgba(0,0,0,0.08)'

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
                <div className="h-full flex items-center justify-center">
                  <Text variant="sm" className="opacity-70">No data yet</Text>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByProject} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" tick={chartTickStyle} />
                    <YAxis tick={chartTickStyle} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [Number(value ?? 0), 'Tasks']}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
                      contentStyle={{
                        fontSize: baseFontSize * 1.08,
                        backgroundColor: current?.system?.background ?? undefined,
                        border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 4,
                      }}
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
                <div className="h-full flex items-center justify-center">
                  <Text variant="sm" className="opacity-70">No data yet</Text>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={chartTickStyle} />
                    <YAxis tick={chartTickStyle} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [Number(value ?? 0), 'Projects']}
                      contentStyle={{
                        fontSize: baseFontSize * 1.08,
                        backgroundColor: current?.system?.background ?? undefined,
                        border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 4,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="projects"
                      stroke={primaryColor}
                      strokeWidth={2}
                      name="Projects"
                      dot={{ fill: primaryColor, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        <footer className="flex justify-end pt-4 mt-4 border-t shrink-0" style={{ borderColor: current?.system?.border }}>
          <Button variant="secondary" label="Close" onClick={onClose} />
        </footer>
      </div>
    </Modal>
  )
}

export default ProjectListAnalyticsModal
