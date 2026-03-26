import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Text from '../../components/base/Text'
import { Card, Badge, Table } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { milestoneService, projectService } from '../../services'
import type { Milestone, Project } from '../../types'

const MilestoneList = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [projects, setProjects] = useState<Record<string, Project>>({})

  useEffect(() => {
    milestoneService.list().then(setMilestones)
    projectService.list().then((list) => {
      const map: Record<string, Project> = {}
      list.forEach((p) => (map[p.id] = p))
      setProjects(map)
    })
  }, [])

  return (
    <AppPageLayout title="Milestones" subtitle={`${milestones.length} total`}>
      <Card title="All milestones" subtitle={`${milestones.length} total`}>
        <Table headers={['Name', 'Project', 'Priority', 'Target date', 'Tasks']}>
          {milestones.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-2">
                <Link
                  to={`/app/projects/${m.projectId}/milestones/${m.id}`}
                  className="underline-offset-2 hover:underline"
                >
                  <Text variant="sm">{m.name}</Text>
                </Link>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{projects[m.projectId]?.name ?? '—'}</Text>
              </td>
              <td className="px-4 py-2">
                <Badge variant={m.priority}>{m.priority}</Badge>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{m.targetDate}</Text>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{m.taskIds.length}</Text>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </AppPageLayout>
  )
}

export default MilestoneList
