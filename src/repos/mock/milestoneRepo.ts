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
    workflowStateId: 's3',
  },
  {
    id: 'm2',
    projectId: 'p1',
    name: 'Content ready',
    priority: 'medium',
    targetDate: '2026-02-28',
    taskIds: ['t3'],
    createdAt: '2025-01-20T00:00:00Z',
    workflowStateId: 's6',
  },
  {
    id: 'm1b',
    projectId: 'p1',
    name: 'QA and launch',
    priority: 'high',
    targetDate: '2026-04-15',
    taskIds: [],
    createdAt: '2025-01-25T00:00:00Z',
    workflowStateId: 's2',
  },
  {
    id: 'm1c',
    projectId: 'p1',
    name: 'Discovery and research',
    priority: 'low',
    targetDate: '2026-02-10',
    taskIds: [],
    createdAt: '2025-01-18T00:00:00Z',
    workflowStateId: 's1',
  },
  {
    id: 'm1d',
    projectId: 'p1',
    name: 'Stakeholder sign-off',
    priority: 'medium',
    targetDate: '2026-03-25',
    taskIds: [],
    createdAt: '2025-01-22T00:00:00Z',
    workflowStateId: 's4',
  },
  {
    id: 'm3',
    projectId: 'p2',
    name: 'Campaign launch',
    priority: 'high',
    targetDate: '2026-03-01',
    taskIds: ['t4'],
    createdAt: '2025-02-05T00:00:00Z',
    workflowStateId: 's2',
  },
  {
    id: 'm1e',
    projectId: 'p1',
    name: 'Development complete',
    priority: 'high',
    targetDate: '2026-05-10',
    taskIds: [],
    createdAt: '2026-02-01T00:00:00Z',
    workflowStateId: 's3',
  },
  {
    id: 'm1f',
    projectId: 'p1',
    name: 'UAT and feedback',
    priority: 'medium',
    targetDate: '2026-06-20',
    taskIds: [],
    createdAt: '2026-03-15T00:00:00Z',
    workflowStateId: 's2',
  },
  {
    id: 'm1g',
    projectId: 'p1',
    name: 'Go-live and hypercare',
    priority: 'high',
    targetDate: '2026-07-15',
    taskIds: [],
    createdAt: '2026-04-01T00:00:00Z',
    workflowStateId: 's1',
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
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((m) => m.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}
