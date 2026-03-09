import type { Company } from '../../types'

const data: Company[] = [
  {
    id: 'c1',
    name: 'Acme Corp',
    subscription: 'paid',
    createdAt: '2025-01-01T00:00:00Z',
    taxRate: 18,
    storageLimitMb: 10240,
    storageUsedMb: 2048,
    address: 'Plot 1, Kampala, Uganda',
    phone: '+256 700 000 000',
    email: 'accounts@acmecorp.com',
  },
  {
    id: 'c2',
    name: 'Startup Co',
    subscription: 'free',
    createdAt: '2025-02-01T00:00:00Z',
    taxRate: 0,
    storageLimitMb: 2048,
    storageUsedMb: 256,
    address: 'Nairobi, Kenya',
    phone: '+254 700 000 000',
    email: 'info@startup.co',
  },
]

export const companyRepo = {
  async getAll(): Promise<Company[]> {
    return Promise.resolve([...data])
  },
  async getById(id: string): Promise<Company | null> {
    return Promise.resolve(data.find((c) => c.id === id) ?? null)
  },
  async create(company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    const next: Company = {
      ...company,
      id: `c${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Company>): Promise<Company | null> {
    const i = data.findIndex((c) => c.id === id)
    if (i === -1) return Promise.resolve(null)
    data[i] = { ...data[i], ...patch }
    return Promise.resolve(data[i])
  },
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((c) => c.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}
