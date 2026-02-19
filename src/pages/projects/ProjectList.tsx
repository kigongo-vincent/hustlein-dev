import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Text from '../../components/base/Text'
import { Card, Button } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { projectService, userService } from '../../services'
import type { Project } from '../../types'

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Record<string, string>>({})

  useEffect(() => {
    projectService.list().then(setProjects)
    userService.list().then((users) => {
      const map: Record<string, string> = {}
      users.forEach((u) => (map[u.id] = u.name))
      setLeads(map)
    })
  }, [])

  return (
    <AppPageLayout title="Projects" subtitle="View and manage your projects">
      <div className="grid gap-4">
        {projects.map((p) => (
          <Link key={p.id} to={`/app/projects/${p.id}`}>
            <Card title={p.name} subtitle={p.description}>
              <div className="flex justify-between items-center mt-2">
                <Text variant="sm">Lead: {leads[p.projectLeadId] ?? p.projectLeadId}</Text>
                <Button variant="secondary" size="sm" label="View" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppPageLayout>
  )
}

export default ProjectList
