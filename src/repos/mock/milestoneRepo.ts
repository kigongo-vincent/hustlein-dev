import type { Milestone } from '../../types'

const data: Milestone[] = [
  {
    id: 'm1',
    projectId: 'p1',
    name: 'Design phase complete',
    priority: 'high',
    targetDate: '2026-03-15',
    taskIds: ['t1', 't2'],
    createdAt: '2025-01-20T00:00:00Z',
  },
  {
    id: 'm2',
    projectId: 'p1',
    name: 'Content ready',
    priority: 'medium',
    targetDate: '2026-02-28',
    taskIds: ['t3'],
    createdAt: '2025-01-20T00:00:00Z',
  },
  {
    id: 'm3',
    projectId: 'p2',
    name: 'Campaign launch',
    priority: 'high',
    targetDate: '2026-03-01',
    taskIds: ['t4'],
    createdAt: '2025-02-05T00:00:00Z',
  },
]

export const milestoneRepo = {
  async getAll(): Promise<Milestone[]> {
    return Promise.resolve([...data])
  },
  async getById(id: string): Promise<Milestone | null> {
    return Promise.resolve(data.find((m) => m.id === id) ?? null)
  },
  async getByProject(projectId: string): Promise<Milestone[]> {
    return Promise.resolve(data.filter((m) => m.projectId === projectId))
  },
  async create(milestone: Omit<Milestone, 'id' | 'createdAt'>): Promise<Milestone> {
    const next: Milestone = {
      ...milestone,
      id: `m${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Milestone>): Promise<Milestone | null> {
    const i = data.findIndex((m) => m.id === id)
    if (i === -1) return Promise.resolve(null)
    data[i] = { ...data[i], ...patch }
    return Promise.resolve(data[i])
  },
}
