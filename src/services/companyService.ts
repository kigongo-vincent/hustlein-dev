import { companyRepo } from '../repos'
import type { Company } from '../types'
import { endpoints } from '../api'
import { getStoredToken } from '../api/client'

export const companyService = {
  async list(): Promise<Company[]> {
    return companyRepo.getAll()
  },
  async get(id: string): Promise<Company | null> {
    return companyRepo.getById(id)
  },
  async create(payload: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    return companyRepo.create(payload)
  },
  async update(id: string, payload: Partial<Company>): Promise<Company | null> {
    return companyRepo.update(id, payload)
  },
  async remove(id: string): Promise<boolean> {
    return companyRepo.delete(id)
  },
  async uploadLogo(companyId: string, file: File): Promise<string> {
    const token = getStoredToken()
    const body = new FormData()
    body.append('file', file)

    const res = await fetch(endpoints.companyLogoUpload(companyId), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    })

    const data = (await res.json()) as { logoUrl?: string; error?: string }
    if (!res.ok) {
      const msg = typeof data === 'object' && data && 'error' in data && data.error ? data.error : `Upload failed (${res.status})`
      throw new Error(String(msg))
    }

    if (!data.logoUrl) {
      throw new Error('Upload failed: missing logoUrl')
    }
    return data.logoUrl
  },
}
