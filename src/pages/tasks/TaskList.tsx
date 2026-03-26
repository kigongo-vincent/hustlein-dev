import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Badge, Select, Input } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { taskService, userService, projectService } from '../../services'
import type { Task, Project } from '../../types'

const TaskList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const ownerIdFromUrl = searchParams.get('ownerId') ?? ''

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [owners, setOwners] = useState<Record<string, string>>({})
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [ownerFilter, setOwnerFilter] = useState<string>(ownerIdFromUrl)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setOwnerFilter((prev) => ownerIdFromUrl || prev)
  }, [ownerIdFromUrl])

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
    const matchOwner = !ownerFilter || t.ownerId === ownerFilter
    const matchSearch =
      !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchProject && matchOwner && matchSearch
  })

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  const ownerOptions = [
    { value: '', label: 'All owners' },
    ...Object.entries(owners).map(([id, name]) => ({ value: id, label: name })),
  ]

  const handleOwnerChange = (value: string) => {
    setOwnerFilter(value)
    if (value) {
      searchParams.set('ownerId', value)
      setSearchParams(searchParams, { replace: true })
    } else {
      searchParams.delete('ownerId')
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <AppPageLayout title="Tasks" subtitle="Filter and manage tasks">
      <div className="space-y-6">
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
            <Select
              label="Owner"
              options={ownerOptions}
              value={ownerFilter}
              onChange={(e) => handleOwnerChange(e.target.value)}
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
        <View bg="fg" noShadow className="rounded-base overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                {['Title', 'Owner', 'Priority', 'Due date', 'State'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 border-b">
                    <Text variant="sm" className="font-medium">
                      {h}
                    </Text>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0">
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
            </tbody>
          </table>
        </View>
      </Card>
      </div>
    </AppPageLayout>
  )
}

export default TaskList
