import { useEffect, useState } from 'react'
import View from '../base/View'
import Text from '../base/Text'
import { Card, Button } from '../ui'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { taskService } from '../../services'
import type { Task } from '../../types'
import { Sparkles, ListTodo, BriefcaseBusiness } from 'lucide-react'
import { useNavigate } from 'react-router'

const Freelancer = () => {
  const { current } = Themestore()
  const user = Authstore((s) => s.user)
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user) return
      try {
        const list = await taskService.listByOwner(user.id)
        if (!cancelled) setTasks(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const openCount = tasks.filter((t) => t.priority && t.workflowStateId).length

  return (
    <div className="space-y-4">
      <View bg="bg" className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Text className="font-medium">Welcome{user?.name ? `, ${user.name}` : ''}</Text>
            <Text variant="sm" className="opacity-80">
              Find projects, apply, and track your work across companies.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              label="Browse marketplace"
              startIcon={<Sparkles className="w-4 h-4 shrink-0" />}
              onClick={() => navigate('/app/marketplace')}
            />
            <Button
              size="sm"
              variant="secondary"
              label="My projects"
              startIcon={<BriefcaseBusiness className="w-4 h-4 shrink-0" />}
              onClick={() => navigate('/app/assigned')}
            />
          </div>
        </div>
      </View>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card
          title="My tasks"
          subtitle={loading ? 'Loading…' : `${tasks.length} total`}
          rightIcon={<ListTodo className="w-5 h-5" />}
          className="px-4 py-4"
        >
          <Text variant="sm" className="opacity-80" style={{ color: current?.system?.dark }}>
            {loading ? 'Fetching your tasks…' : `You have ${openCount} tasks in progress.`}
          </Text>
          <div className="mt-3">
            <Button size="sm" label="Go to tasks" onClick={() => navigate('/app/tasks')} />
          </div>
        </Card>
        <Card
          title="Next steps"
          subtitle="Start earning faster"
          rightIcon={<Sparkles className="w-5 h-5" />}
          className="px-4 py-4"
        >
          <ul className="text-sm space-y-2 opacity-90" style={{ color: current?.system?.dark }}>
            <li>Apply to 2–3 relevant postings today</li>
            <li>Log time on assigned projects</li>
            <li>Keep your skills updated for better matches</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default Freelancer

