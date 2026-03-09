import type { Department } from '../../types'

const data: Department[] = [
  {
    id: 'd1',
    companyId: 'c1',
    name: 'Engineering',
    description: 'Software development',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'd2',
    companyId: 'c1',
    name: 'Delivery',
    description: 'Project delivery',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'd3',
    companyId: 'c1',
    name: 'Operations',
    description: 'Operations & support',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

export const departmentRepo = {
  async listByCompany(companyId: string): Promise<Department[]> {
    return Promise.resolve(data.filter((d) => d.companyId === companyId))
  },
  async create(payload: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    const next: Department = {
      ...payload,
      id: `d${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Department>): Promise<Department | null> {
    const i = data.findIndex((d) => d.id === id)
    if (i === -1) return Promise.resolve(null)
    data[i] = { ...data[i], ...patch, updatedAt: new Date().toISOString() }
    return Promise.resolve(data[i])
  },
  async remove(id: string): Promise<boolean> {
    const i = data.findIndex((d) => d.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}

