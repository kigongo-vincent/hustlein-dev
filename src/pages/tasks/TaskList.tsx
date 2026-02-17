import { useEffect, useState } from 'react'
import Text from '../../components/base/Text'
import { Card, Badge, Table, Select, Input } from '../../components/ui'
import { taskService, userService, projectService } from '../../services'
import type { Task, Project } from '../../types'

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [owners, setOwners] = useState<Record<string, string>>({})
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    taskService.list().then(setTasks)
    projectService.list().then(setProjects)
    userService.list().then((users) => {
      const map: Record<string, string> = {}
      users.forEach((u) => (map[u.id] = u.name))
      setOwners(map)
    })
  }, [])

  const filtered = tasks.filter((t) => {
    const matchProject = !projectFilter || t.projectId === projectFilter
    const matchSearch =
      !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchProject && matchSearch
  })

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="space-y-6">
      <Text variant="xl" className="font-medium">
        Tasks
      </Text>
      <Card title="Filters">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px]">
            <Select
              label="Project"
              options={projectOptions}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            />
          </div>
          <div className="min-w-[200px]">
            <Input
              label="Search"
              placeholder="Task title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>
      <Card title="Task list" subtitle={`${filtered.length} tasks`}>
        <Table headers={['Title', 'Owner', 'Priority', 'Due date', 'State']}>
          {filtered.map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-2">
                <Text variant="sm">{t.title}</Text>
              </td>
              <td className="px-4 py-2">
                <Text variant="sm">{owners[t.ownerId] ?? t.ownerId}</Text>
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
  )
}

export default TaskList
