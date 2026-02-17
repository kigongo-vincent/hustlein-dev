import type { Project } from '../../types'

const data: Project[] = [
  {
    id: 'p1',
    companyId: 'c1',
    name: 'Website Redesign',
    description: 'New marketing site and blog',
    projectLeadId: 'u2',
    workflowId: 'w1',
    folderId: 'f1',
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'p2',
    companyId: 'c1',
    name: 'Q1 Campaign',
    description: 'Launch campaign and events',
    projectLeadId: 'u2',
    workflowId: 'w2',
    folderId: 'f2',
    createdAt: '2025-02-01T00:00:00Z',
  },
]

export const projectRepo = {
  async getAll(): Promise<Project[]> {
    return Promise.resolve([...data])
  },
  async getById(id: string): Promise<Project | null> {
    return Promise.resolve(data.find((p) => p.id === id) ?? null)
  },
  async getByCompany(companyId: string): Promise<Project[]> {
    return Promise.resolve(data.filter((p) => p.companyId === companyId))
  },
  async getByLead(projectLeadId: string): Promise<Project[]> {
    return Promise.resolve(data.filter((p) => p.projectLeadId === projectLeadId))
  },
  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const next: Project = {
      ...project,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Project>): Promise<Project | null> {
    const i = data.findIndex((p) => p.id === id)
    if (i === -1) return Promise.resolve(null)
    data[i] = { ...data[i], ...patch }
    return Promise.resolve(data[i])
  },
}
