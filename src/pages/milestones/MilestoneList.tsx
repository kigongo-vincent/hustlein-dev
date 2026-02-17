import { useEffect, useState } from 'react'
import Text from '../../components/base/Text'
import { Card, Badge, Table } from '../../components/ui'
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
    <div className="space-y-6">
      <Text variant="xl" className="font-medium">
        Milestones
      </Text>
      <Card title="All milestones" subtitle={`${milestones.length} total`}>
        <Table headers={['Name', 'Project', 'Priority', 'Target date', 'Tasks']}>
          {milestones.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-2">
                <Text variant="sm">{m.name}</Text>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{projects[m.projectId]?.name ?? m.projectId}</Text>
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
    </div>
  )
}

export default MilestoneList
