import type { Task } from '../../types'

const now = new Date().toISOString()
const data: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    milestoneId: 'm1',
    title: 'Design homepage mockups',
    workflowStateId: 's3',
    ownerId: 'u3',
    priority: 'high',
    dueDate: '2026-03-01',
    dependencyIds: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 't2',
    projectId: 'p1',
    milestoneId: 'm1',
    title: 'Implement header component',
    workflowStateId: 's2',
    ownerId: 'u4',
    priority: 'medium',
    dueDate: '2026-03-10',
    dependencyIds: ['t1'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 't3',
    projectId: 'p1',
    milestoneId: 'm2',
    title: 'Content migration',
    workflowStateId: 's6',
    ownerId: 'u3',
    priority: 'low',
    dueDate: '2026-02-15',
    dependencyIds: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 't4',
    projectId: 'p2',
    title: 'Campaign brief',
    workflowStateId: 's4',
    ownerId: 'u3',
    priority: 'high',
    dueDate: '2026-02-20',
    dependencyIds: [],
    createdAt: now,
    updatedAt: now,
  },
]

export const taskRepo = {
  async getAll(): Promise<Task[]> {
    return Promise.resolve([...data])
  },
  async getById(id: string): Promise<Task | null> {
    return Promise.resolve(data.find((t) => t.id === id) ?? null)
  },
  async getByProject(projectId: string): Promise<Task[]> {
    return Promise.resolve(data.filter((t) => t.projectId === projectId))
  },
  async getByMilestone(milestoneId: string): Promise<Task[]> {
    return Promise.resolve(data.filter((t) => t.milestoneId === milestoneId))
  },
  async getByOwner(ownerId: string): Promise<Task[]> {
    return Promise.resolve(data.filter((t) => t.ownerId === ownerId))
  },
  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const next: Task = {
      ...task,
      id: `t${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Task>): Promise<Task | null> {
    const i = data.findIndex((t) => t.id === id)
    if (i === -1) return Promise.resolve(null)
    const updated = { ...data[i], ...patch, updatedAt: new Date().toISOString() }
    data[i] = updated
    return Promise.resolve(updated)
  },
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((t) => t.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}
