import type { User } from '../../types'

const data: User[] = [
  { id: 'u1', email: 'admin@acme.com', name: 'Admin User', role: 'company_admin', companyId: 'c1' },
  { id: 'u2', email: 'lead@acme.com', name: 'Jane Lead', role: 'project_lead', companyId: 'c1' },
  { id: 'u3', email: 'consultant@acme.com', name: 'Bob Consultant', role: 'consultant', companyId: 'c1' },
  { id: 'u4', email: 'alice@acme.com', name: 'Alice Dev', role: 'consultant', companyId: 'c1' },
]

export const userRepo = {
  async getAll(): Promise<User[]> {
    return Promise.resolve([...data])
  },
  async getById(id: string): Promise<User | null> {
    return Promise.resolve(data.find((u) => u.id === id) ?? null)
  },
  async getByCompany(companyId: string): Promise<User[]> {
    return Promise.resolve(data.filter((u) => u.companyId === companyId))
  },
  async getByEmail(email: string): Promise<User | null> {
    return Promise.resolve(data.find((u) => u.email === email) ?? null)
  },
  async create(user: Omit<User, 'id'>): Promise<User> {
    const next: User = { ...user, id: `u${Date.now()}` }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const i = data.findIndex((u) => u.id === id)
    if (i === -1) return Promise.resolve(null)
    data[i] = { ...data[i], ...patch }
    return Promise.resolve(data[i])
  },
}
