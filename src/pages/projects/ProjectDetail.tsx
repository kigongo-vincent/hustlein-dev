import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import Text from '../../components/base/Text'
import { Card, Button, Badge, Table } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { projectService, taskService, milestoneService, userService } from '../../services'
import type { Project, Task, Milestone } from '../../types'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [leadName, setLeadName] = useState('')

  useEffect(() => {
    if (!id) return
    projectService.get(id).then(setProject)
    taskService.listByProject(id).then(setTasks)
    milestoneService.listByProject(id).then(setMilestones)
  }, [id])

  useEffect(() => {
    if (!project) return
    userService.get(project.projectLeadId).then((u) => setLeadName(u?.name ?? ''))
  }, [project])

  if (!project) return <Text>Loading…</Text>

  return (
    <AppPageLayout title={project.name} subtitle={project.description}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/app/projects">
            <Button variant="ghost" size="sm" label="← Projects" />
          </Link>
          <Text variant="sm" className="opacity-80">Project lead: {leadName}</Text>
        </div>
      <Card title="Milestones" subtitle={`${milestones.length} total`}>
        <ul className="space-y-2">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <Text>{m.name}</Text>
              <Badge variant={m.priority}>{m.priority}</Badge>
              <Text variant="sm" className="opacity-70">
                Target: {m.targetDate}
              </Text>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Tasks" subtitle={`${tasks.length} tasks`}>
        <Table headers={['Title', 'Priority', 'Due date', 'State']}>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-2">
                <Text variant="sm">{t.title}</Text>
              </td>
              <td className="px-4 py-2">
                <Badge variant={t.priority}>{t.priority}</Badge>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{t.dueDate ?? '—'}</Text>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{t.workflowStateId}</Text>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      </div>
    </AppPageLayout>
  )
}

export default ProjectDetail
