import { useEffect, useState } from 'react'
import Text from '../../components/base/Text'
import { Card, Badge } from '../../components/ui'
import { taskService } from '../../services'
import { Authstore } from '../../data/Authstore'
import type { Task } from '../../types'

const FocusPage = () => {
  const { user } = Authstore()
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [overdue, setOverdue] = useState<Task[]>([])
  const [completedToday, setCompletedToday] = useState<Task[]>([])

  useEffect(() => {
    if (!user?.id) return
    taskService.listByOwner(user.id).then((all) => {
      const today = new Date().toISOString().slice(0, 10)
      setTodayTasks(
        all.filter(
          (t) => t.dueDate === today && t.workflowStateId !== 's6'
        )
      )
      setOverdue(
        all.filter((t) => {
          if (!t.dueDate || t.workflowStateId === 's6') return false
          return new Date(t.dueDate) < new Date()
        })
      )
      setCompletedToday(
        all.filter((t) => t.workflowStateId === 's6')
      )
    })
  }, [user?.id])

  return (
    <div className="space-y-6">
      <Text variant="xl" className="font-medium">
        Focus
      </Text>
      <Text variant="md" className="opacity-80">
        Today&apos;s priorities, urgent overdue, and completed.
      </Text>
      <Card title="Today's priorities" subtitle={`${todayTasks.length} tasks`}>
        <ul className="space-y-2">
          {todayTasks.length === 0 ? (
            <Text variant="sm" className="opacity-70">
              No tasks due today.
            </Text>
          ) : (
            todayTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <Text variant="md">{t.title}</Text>
                <Badge variant={t.priority}>{t.priority}</Badge>
              </li>
            ))
          )}
        </ul>
      </Card>
      <Card title="Urgent overdue" subtitle={`${overdue.length} tasks`}>
        <ul className="space-y-2">
          {overdue.length === 0 ? (
            <Text variant="sm" className="opacity-70">
              None.
            </Text>
          ) : (
            overdue.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <Text variant="md">{t.title}</Text>
                <Badge variant="error">Overdue</Badge>
                <Text variant="sm" className="opacity-70">
                  Due {t.dueDate}
                </Text>
              </li>
            ))
          )}
        </ul>
      </Card>
      <Card title="Completed today" subtitle={`${completedToday.length} tasks`}>
        <ul className="space-y-2">
          {completedToday.length === 0 ? (
            <Text variant="sm" className="opacity-70">
              None yet.
            </Text>
          ) : (
            completedToday.map((t) => (
              <li key={t.id}>
                <Text variant="md">{t.title}</Text>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}

export default FocusPage
