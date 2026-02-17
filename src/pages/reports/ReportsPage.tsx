import { useEffect, useState } from 'react'
import Text from '../../components/base/Text'
import { Card, Table, Select } from '../../components/ui'
import { reportService, projectService } from '../../services'
import type { StatCard, TaskCompletionByOwner, Project } from '../../types'

const ReportsPage = () => {
  const [stats, setStats] = useState<StatCard[]>([])
  const [byOwner, setByOwner] = useState<TaskCompletionByOwner[]>([])
  const [progressData, setProgressData] = useState<{ date: string; completed: number }[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectFilter, setProjectFilter] = useState<string>('')

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
    <div className="space-y-6">
      <Text variant="xl" className="font-medium">
        Reports
      </Text>
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
          <Card key={s.label} title={s.label}>
            <Text variant="lg" className="font-medium">
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
          <ul className="space-y-1">
            {progressData.map(({ date, completed }) => (
              <li key={date} className="flex justify-between">
                <Text variant="sm">{date}</Text>
                <Text variant="sm">{completed}</Text>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Task completion by owner">
        <Table headers={['Owner', 'Completed', 'Total']}>
          {byOwner.map((r) => (
            <tr key={r.ownerId}>
              <td className="px-4 py-2">
                <Text variant="sm">{r.ownerName}</Text>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{r.completed}</Text>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{r.total}</Text>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}

export default ReportsPage
