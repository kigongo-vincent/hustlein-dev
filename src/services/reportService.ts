import { taskRepo, userRepo } from '../repos'
import type { StatCard, TaskCompletionByOwner } from '../types'

const doneStateId = 's6'

export const reportService = {
  async getStatCards(projectId?: string): Promise<StatCard[]> {
    const tasks = projectId
      ? await taskRepo.getByProject(projectId)
      : await taskRepo.getAll()
    const total = tasks.length
    const completed = tasks.filter((t) => t.workflowStateId === doneStateId).length
    const overdue = tasks.filter((t) => {
      if (!t.dueDate) return false
      return t.workflowStateId !== doneStateId && new Date(t.dueDate) < new Date()
    }).length
    return [
      { label: 'Total tasks', value: total },
      { label: 'Completed', value: completed, trend: 'up' },
      { label: 'Overdue', value: overdue, trend: overdue > 0 ? 'down' : 'neutral' },
    ]
  },
  async getCompletionByOwner(projectId?: string): Promise<TaskCompletionByOwner[]> {
    const tasks = projectId
      ? await taskRepo.getByProject(projectId)
      : await taskRepo.getAll()
    const users = await userRepo.getAll()
    const byOwner = new Map<string, { completed: number; total: number }>()
    for (const t of tasks) {
      const cur = byOwner.get(t.ownerId) ?? { completed: 0, total: 0 }
      cur.total += 1
      if (t.workflowStateId === doneStateId) cur.completed += 1
      byOwner.set(t.ownerId, cur)
    }
    return Array.from(byOwner.entries()).map(([ownerId, { completed, total }]) => ({
      ownerId,
      ownerName: users.find((u) => u.id === ownerId)?.name ?? 'Unknown',
      completed,
      total,
    }))
  },
  async getProgressOverTime(projectId?: string): Promise<{ date: string; completed: number }[]> {
    const tasks = projectId
      ? await taskRepo.getByProject(projectId)
      : await taskRepo.getAll()
    const done = tasks.filter((t) => t.workflowStateId === doneStateId)
    const byDate = new Map<string, number>()
    for (const t of done) {
      const d = t.updatedAt.slice(0, 10)
      byDate.set(d, (byDate.get(d) ?? 0) + 1)
    }
    return Array.from(byDate.entries())
      .map(([date, completed]) => ({ date, completed }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
}
