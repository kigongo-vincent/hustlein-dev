import { useEffect, useState } from 'react'
import Text from '../../components/base/Text'
import { Card } from '../../components/ui'
import { reportService } from '../../services'
import { projectService } from '../../services'
import { Authstore } from '../../data/Authstore'
import type { StatCard } from '../../types'

const Dashboard = () => {
  const { user } = Authstore()
  const [stats, setStats] = useState<StatCard[]>([])
  const [projectCount, setProjectCount] = useState(0)

  useEffect(() => {
    reportService.getStatCards().then(setStats)
    projectService.list().then((list) => setProjectCount(list.length))
  }, [])

  return (
    <div className="space-y-6">
      <Text variant="xl" className="font-medium">
        Dashboard
      </Text>
      <Text variant="md" className="opacity-80">
        Welcome back, {user?.name}.
      </Text>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} title={s.label}>
<Text variant="lg" className="font-medium">
            {s.value}
          </Text>
        </Card>
        ))}
        <Card title="Projects">
          <Text variant="lg" className="font-medium">
            {projectCount}
          </Text>
        </Card>
      </div>
      <Card title="Quick actions" subtitle="Navigate from the sidebar">
        <Text variant="sm">Go to Tasks, Milestones, or Reports to manage work.</Text>
      </Card>
    </div>
  )
}

export default Dashboard
